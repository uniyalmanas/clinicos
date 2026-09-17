from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date
from app.api.v1.appointments import APPOINTMENTS_DB

router = APIRouter(prefix="/expenses", tags=["Clinic Expenses & P&L Ledger"])

class CreateExpenseRequest(BaseModel):
    clinic_slug: str = "derma-care-dehradun"
    category: str = Field(..., pattern="^(Electricity|Staff Salary|Rent|Consumables|Maintenance|Miscellaneous)$")
    amount: float = Field(..., gt=0)
    description: Optional[str] = None
    payment_mode: str = "upi"

EXPENSES_DB = [
    {
        "id": "exp-001",
        "clinic_slug": "derma-care-dehradun",
        "category": "Electricity",
        "amount": 4200.0,
        "expense_date": "2026-09-15",
        "description": "Commercial UPCL power bill for August (AC & Lasers)",
        "payment_mode": "upi"
    },
    {
        "id": "exp-002",
        "clinic_slug": "derma-care-dehradun",
        "category": "Consumables",
        "amount": 1450.0,
        "expense_date": "2026-09-16",
        "description": "Disposable nitrile gloves, surgical spirit, cotton rolls, disinfectant",
        "payment_mode": "cash"
    },
    {
        "id": "exp-003",
        "clinic_slug": "derma-care-dehradun",
        "category": "Staff Salary",
        "amount": 15000.0,
        "expense_date": "2026-09-10",
        "description": "Receptionist monthly salary (Pooja Verma)",
        "payment_mode": "upi"
    }
]

@router.get("")
def get_expenses_ledger(clinic_slug: str = "derma-care-dehradun"):
    clinic_expenses = [e for e in EXPENSES_DB if e["clinic_slug"] == clinic_slug]
    total_expenses = sum(e["amount"] for e in clinic_expenses)

    # Calculate gross collections from appointments
    today_str = str(date.today())
    gross_collections = sum(
        apt.get("fee_amount", 0.0) 
        for apt in APPOINTMENTS_DB.values() 
        if apt.get("payment_status") == "paid"
    )
    # Give baseline gross collections for month (~₹48,000)
    simulated_month_gross = gross_collections + 48000.0

    net_profit = simulated_month_gross - total_expenses
    profit_margin_pct = round((net_profit / simulated_month_gross) * 100, 1) if simulated_month_gross > 0 else 0.0

    # Category breakdown
    category_totals = {}
    for e in clinic_expenses:
        cat = e["category"]
        category_totals[cat] = category_totals.get(cat, 0.0) + e["amount"]

    return {
        "status": "success",
        "clinic_slug": clinic_slug,
        "kpis": {
            "gross_collections": simulated_month_gross,
            "total_expenses": total_expenses,
            "real_net_profit": net_profit,
            "profit_margin_pct": profit_margin_pct
        },
        "category_breakdown": category_totals,
        "expenses": clinic_expenses
    }

@router.post("")
def add_expense(payload: CreateExpenseRequest):
    import uuid
    new_id = f"exp-{uuid.uuid4().hex[:6]}"
    record = {
        "id": new_id,
        "clinic_slug": payload.clinic_slug,
        "category": payload.category,
        "amount": payload.amount,
        "expense_date": str(date.today()),
        "description": payload.description or payload.category,
        "payment_mode": payload.payment_mode
    }
    EXPENSES_DB.insert(0, record)

    return {
        "status": "success",
        "expense": record,
        "message": f"Expense of ₹{payload.amount} logged under {payload.category}."
    }
