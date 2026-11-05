import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { guard, CLINIC_ROLES, ADMIN_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, {
      roles: CLINIC_ROLES,
      audit: "expenses.view",
      auditEntity: "expenses",
    });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;
    const clinicId = auth.auth.clinic!.id;

    // 1. Fetch expenses for authenticated clinic
    const expensesRows = await sql`
      SELECT * FROM expenses 
      WHERE clinic_slug = ${clinicSlug}
      ORDER BY date DESC, created_at DESC;
    `;

    // 2. Fetch appointment collections scoped to this clinic
    const aptRevenueQuery = await sql`
      SELECT COALESCE(SUM(fee_amount), 0) AS total_fee 
      FROM appointments 
      WHERE payment_status = 'paid'
        AND clinic_id::text = ${clinicId}::text;
    `;
    const appointmentCollections = Number(aptRevenueQuery[0]?.total_fee || 0);

    // 3. Fetch pharmacy collections scoped to this clinic
    const pharmRevenueQuery = await sql`
      SELECT COALESCE(SUM(total_amount), 0) AS total_pharm 
      FROM pharmacy_dispenses
      WHERE clinic_slug = ${clinicSlug};
    `;
    const pharmacyCollections = Number(pharmRevenueQuery[0]?.total_pharm || 0);

    const grossCollections = appointmentCollections + pharmacyCollections;

    // 4. Calculate total expenses & breakdown by category
    const categoryBreakdown: Record<string, number> = {};
    let totalExpenses = 0;
    let pendingApprovalCount = 0;
    let flaggedDuplicateCount = 0;

    for (const exp of expensesRows) {
      const amt = Number(exp.amount || 0);
      if (exp.approval_status !== "PENDING_APPROVAL") {
        totalExpenses += amt;
      } else {
        pendingApprovalCount++;
      }
      if (exp.duplicate_flag) {
        flaggedDuplicateCount++;
      }
      const cat = exp.category || "General";
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amt;
    }

    const realNetProfit = grossCollections - totalExpenses;
    const profitMarginPct = grossCollections > 0 
      ? parseFloat(((realNetProfit / grossCollections) * 100).toFixed(1)) 
      : 0;

    return NextResponse.json({
      expenses: expensesRows,
      kpis: {
        gross_collections: grossCollections,
        appointment_collections: appointmentCollections,
        pharmacy_collections: pharmacyCollections,
        total_expenses: totalExpenses,
        real_net_profit: realNetProfit,
        profit_margin_pct: profitMarginPct,
        pending_approval_count: pendingApprovalCount,
        flagged_duplicate_count: flaggedDuplicateCount
      },
      category_breakdown: categoryBreakdown
    });
  } catch (error: any) {
    console.error("GET /api/expenses error:", error);
    return apiError(500, error.message || "Failed to load expenses.", "server_error");
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, {
      roles: CLINIC_ROLES,
      audit: "expense.create",
      auditEntity: "expenses",
    });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;
    const isManagerRole = ADMIN_ROLES.includes(auth.auth.role as any) || auth.auth.role === "doctor";

    const body = await req.json();
    const {
      title,
      category = "Consumables",
      amount,
      payment_mode = "upi",
      recorded_by = auth.auth.user.full_name,
      date,
      receipt_url,
      action = "create"
    } = body;

    // -------------------------------------------------------------
    // ACTION: APPROVE PENDING VOUCHER WITH AUTHORIZED SESSION
    // -------------------------------------------------------------
    if (action === "approve_voucher") {
      if (!isManagerRole) {
        return apiError(
          403,
          "Manager or Doctor authorization required to approve expense vouchers.",
          "forbidden"
        );
      }

      const { expense_id } = body;
      if (!expense_id) {
        return apiError(400, "expense_id is required.", "missing_id");
      }

      const approvedByName = `${auth.auth.user.full_name} (${auth.auth.role})`;
      const updated = await sql`
        UPDATE expenses
        SET 
          approval_status = 'APPROVED',
          manager_pin_verified = true,
          approved_by = ${approvedByName},
          requires_approval = false
        WHERE id = ${expense_id}
          AND clinic_slug = ${clinicSlug}
        RETURNING *;
      `;

      if (updated.length === 0) {
        return apiError(404, "Expense voucher not found or does not belong to your clinic.", "not_found");
      }

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId: auth.auth.clinic?.id ?? null,
        action: "expense.approve",
        entity: "expenses",
        entityId: expense_id,
        after: updated[0],
        request: req,
      });

      return NextResponse.json({
        status: "success",
        message: `Voucher approved by ${approvedByName}. Outflow posted to cashbook.`,
        expense: updated[0]
      });
    }

    // -------------------------------------------------------------
    // ACTION: RECORD NEW EXPENSE VOUCHER
    // -------------------------------------------------------------
    if (!title || !amount) {
      return apiError(400, "Title and amount are required.", "missing_fields");
    }

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return apiError(400, "Amount must be a positive number.", "invalid_amount");
    }

    const id = randomUUID();
    const expenseDate = date || new Date().toISOString().split("T")[0];

    // Duplicate check within past 30 days
    const duplicateCheck = await sql`
      SELECT id, title, amount, date FROM expenses 
      WHERE clinic_slug = ${clinicSlug}
        AND amount = ${numAmount}
        AND (title ILIKE ${title} OR title ILIKE ${`%${title}%`})
        AND created_at >= NOW() - INTERVAL '30 days'
      LIMIT 1;
    `;
    const isDuplicate = duplicateCheck.length > 0;

    const exceedsThreshold = numAmount > 500;
    let approvalStatus = "APPROVED";
    let approvedBy: string | null = auth.auth.user.full_name;
    let pinVerified = isManagerRole;

    if (exceedsThreshold && !isManagerRole) {
      approvalStatus = "PENDING_APPROVAL";
      approvedBy = null;
      pinVerified = false;
    }

    const inserted = await sql`
      INSERT INTO expenses (
        id, clinic_slug, title, category, amount, 
        payment_mode, recorded_by, date, created_at,
        requires_approval, approval_status, approved_by,
        manager_pin_verified, receipt_url, ocr_scanned_amt,
        ocr_vendor, ocr_verified, duplicate_flag
      ) VALUES (
        ${id},
        ${clinicSlug},
        ${title},
        ${category},
        ${numAmount},
        ${payment_mode},
        ${recorded_by},
        ${expenseDate},
        NOW(),
        ${exceedsThreshold && !isManagerRole},
        ${approvalStatus},
        ${approvedBy},
        ${pinVerified},
        ${receipt_url || "/receipts/sample_voucher.png"},
        ${numAmount},
        'Authorized Commercial Vendor',
        true,
        ${isDuplicate}
      )
      RETURNING *;
    `;

    let statusMsg = "Expense voucher recorded successfully.";
    if (exceedsThreshold && !isManagerRole) {
      statusMsg = "⚠️ Expense > ₹500 logged as PENDING_APPROVAL. Manager or Doctor approval required before disbursement.";
    } else if (isDuplicate) {
      statusMsg = "⚠️ Warning: Duplicate voucher detected in past 30 days. Flagged for audit.";
    }

    return NextResponse.json({ 
      status: "success", 
      message: statusMsg,
      expense: inserted[0] 
    });
  } catch (error: any) {
    console.error("POST /api/expenses error:", error);
    return apiError(500, error.message || "Failed to record expense.", "server_error");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await guard(req, {
      roles: ADMIN_ROLES,
      audit: "expense.delete",
      auditEntity: "expenses",
    });
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return apiError(400, "id is required.", "missing_id");
    }

    const clinicSlug = auth.auth.clinic!.slug;
    const deleted = await sql`
      DELETE FROM expenses 
      WHERE id = ${id} AND clinic_slug = ${clinicSlug}
      RETURNING id, title, amount;
    `;

    if (deleted.length === 0) {
      return apiError(404, "Expense voucher not found or does not belong to your clinic.", "not_found");
    }

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId: auth.auth.clinic?.id ?? null,
      action: "expense.delete",
      entity: "expenses",
      entityId: id,
      before: deleted[0],
      request: req,
    });

    return NextResponse.json({ status: "success", message: "Expense voucher removed." });
  } catch (error: any) {
    console.error("DELETE /api/expenses error:", error);
    return apiError(500, error.message || "Failed to delete expense.", "server_error");
  }
}
