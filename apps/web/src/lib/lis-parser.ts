/**
 * ASTM E1381/E1394 & HL7 v2.x LIS Machine Serial Cable Analyzer Parser
 * Supports benchtop hematology and biochemistry analyzers (Sysmex, Mindray, Horiba, Roche Cobas, Erba)
 */

export interface ParsedMachineResult {
  order_number: string;
  patient_name?: string;
  analyzer_model?: string;
  protocol: "ASTM" | "HL7" | "RAW";
  parameters: Array<{
    parameter: string;
    value: string | number;
    unit: string;
    reference_range: string;
    status: "normal" | "high" | "low" | "critical";
  }>;
}

// Dictionary to map common laboratory analyzer abbreviation codes to standardized clinical names
const PARAM_NAME_MAP: Record<string, { name: string; unit: string; range: string }> = {
  // Hematology (Sysmex, Mindray, Horiba)
  "WBC": { name: "Total Leukocyte Count (TLC)", unit: "/cumm", range: "4000 - 11000" },
  "RBC": { name: "Red Blood Cell Count (RBC)", unit: "10^6/uL", range: "4.5 - 5.9" },
  "HGB": { name: "Hemoglobin", unit: "g/dL", range: "13.0 - 17.0" },
  "HB": { name: "Hemoglobin", unit: "g/dL", range: "13.0 - 17.0" },
  "HCT": { name: "Hematocrit (PCV)", unit: "%", range: "40.0 - 50.0" },
  "MCV": { name: "Mean Corpuscular Volume (MCV)", unit: "fL", range: "80.0 - 100.0" },
  "MCH": { name: "Mean Corpuscular Hemoglobin (MCH)", unit: "pg", range: "27.0 - 32.0" },
  "MCHC": { name: "MCHC", unit: "g/dL", range: "32.0 - 36.0" },
  "PLT": { name: "Platelet Count", unit: "/cumm", range: "150000 - 450000" },
  "NEU": { name: "Neutrophils", unit: "%", range: "40 - 75" },
  "NEUT": { name: "Neutrophils", unit: "%", range: "40 - 75" },
  "LYM": { name: "Lymphocytes", unit: "%", range: "20 - 45" },
  "LYMPH": { name: "Lymphocytes", unit: "%", range: "20 - 45" },
  "MONO": { name: "Monocytes", unit: "%", range: "2 - 10" },
  "EOS": { name: "Eosinophils", unit: "%", range: "1 - 6" },
  "BASO": { name: "Basophils", unit: "%", range: "0 - 1" },
  "ESR": { name: "ESR (Westergren)", unit: "mm/1st hr", range: "0 - 15" },

  // Biochemistry (Roche Cobas, Erba, Mindray BS)
  "GLU": { name: "Fasting Blood Sugar (FBS)", unit: "mg/dL", range: "70 - 100" },
  "FBS": { name: "Fasting Blood Sugar (FBS)", unit: "mg/dL", range: "70 - 100" },
  "PPBS": { name: "Post-Prandial Blood Sugar", unit: "mg/dL", range: "90 - 140" },
  "UREA": { name: "Blood Urea", unit: "mg/dL", range: "15 - 45" },
  "CREA": { name: "Serum Creatinine", unit: "mg/dL", range: "0.7 - 1.3" },
  "UA": { name: "Uric Acid", unit: "mg/dL", range: "3.5 - 7.2" },
  "CHOL": { name: "Total Cholesterol", unit: "mg/dL", range: "125 - 200" },
  "TRIG": { name: "Triglycerides", unit: "mg/dL", range: "< 150" },
  "HDL": { name: "HDL Cholesterol", unit: "mg/dL", range: "40 - 60" },
  "LDL": { name: "LDL Cholesterol", unit: "mg/dL", range: "< 100" },
  "TBIL": { name: "Bilirubin Total", unit: "mg/dL", range: "0.2 - 1.2" },
  "DBIL": { name: "Bilirubin Direct", unit: "mg/dL", range: "0.0 - 0.3" },
  "AST": { name: "SGOT (AST)", unit: "U/L", range: "5 - 40" },
  "ALT": { name: "SGPT (ALT)", unit: "U/L", range: "7 - 56" },
  "ALP": { name: "Alkaline Phosphatase (ALP)", unit: "U/L", range: "44 - 147" },
  "HBA1C": { name: "HbA1c (Glycosylated Hemoglobin)", unit: "%", range: "< 5.7" },
  "TSH": { name: "Thyroid Stimulating Hormone (TSH)", unit: "uIU/mL", range: "0.4 - 4.5" }
};

/**
 * Parses raw serial or TCP stream data from laboratory analyzers
 */
export function parseMachineData(rawText: string): ParsedMachineResult {
  const clean = rawText.trim();

  // Detect Protocol
  if (clean.includes("MSH|") || clean.includes("OBX|")) {
    return parseHL7(clean);
  } else if (clean.startsWith("H|") || clean.includes("\nR|") || clean.includes("\rR|")) {
    return parseASTM(clean);
  } else {
    return parseDelimitedFallback(clean);
  }
}

/**
 * Parse ASTM E1394 Standard format
 * Format:
 * H|\^&|||Analyzer^Sysmex|||||||P|1
 * P|1||||PatientName||DOB|M
 * O|1|SampleBarcode||^^^TestName
 * R|1|^^^WBC|7.4|10*3/uL|4.0-11.0|N||F
 */
function parseASTM(text: string): ParsedMachineResult {
  const lines = text.split(/[\r\n]+/).filter(l => l.trim().length > 0);
  let orderNumber = "LAB-WALK-IN";
  let patientName = "Auto-Sample";
  let analyzerModel = "Automated Analyzer";
  const parameters: ParsedMachineResult["parameters"] = [];

  for (const line of lines) {
    const fields = line.split("|");
    const recordType = fields[0]?.trim();

    if (recordType === "H") {
      analyzerModel = fields[4] || "ASTM Benchtop Analyzer";
    } else if (recordType === "P") {
      patientName = fields[5]?.replace(/\^/g, " ").trim() || patientName;
    } else if (recordType === "O") {
      orderNumber = fields[2]?.trim() || orderNumber;
    } else if (recordType === "R") {
      // Result Record
      const rawCode = fields[2]?.replace(/^(\^)+/, "").split("^")[0]?.trim() || "";
      const valStr = fields[3]?.trim() || "0";
      const unit = fields[4]?.trim() || "";
      const refRange = fields[5]?.trim() || "";
      const flag = fields[6]?.trim() || "N";

      const mapped = PARAM_NAME_MAP[rawCode.toUpperCase()];
      const clinicalName = mapped ? mapped.name : rawCode || "Parameter";
      const finalUnit = unit || (mapped ? mapped.unit : "");
      const finalRange = refRange || (mapped ? mapped.range : "Standard Reference");

      let status: "normal" | "high" | "low" | "critical" = "normal";
      if (flag === "H" || flag === "HH" || flag === ">") status = "high";
      else if (flag === "L" || flag === "LL" || flag === "<") status = "low";
      else if (flag === "C" || flag === "!") status = "critical";

      parameters.push({
        parameter: clinicalName,
        value: valStr,
        unit: finalUnit,
        reference_range: finalRange,
        status
      });
    }
  }

  return {
    order_number: orderNumber,
    patient_name: patientName,
    analyzer_model: analyzerModel,
    protocol: "ASTM",
    parameters
  };
}

/**
 * Parse HL7 v2.x format
 * Format:
 * MSH|^~\&|Sysmex|LAB|...
 * PID|1||...|Sharma^Amit
 * OBR|1|LAB-2026-001|...
 * OBX|1|NM|WBC^Total Leukocytes|...|7.8|10*3/uL|4.0-11.0|N
 */
function parseHL7(text: string): ParsedMachineResult {
  const lines = text.split(/[\r\n]+/).filter(l => l.trim().length > 0);
  let orderNumber = "LAB-WALK-IN";
  let patientName = "Auto-Sample";
  let analyzerModel = "HL7 Standard Analyzer";
  const parameters: ParsedMachineResult["parameters"] = [];

  for (const line of lines) {
    const fields = line.split("|");
    const segment = fields[0]?.trim();

    if (segment === "MSH") {
      analyzerModel = fields[2]?.trim() || analyzerModel;
    } else if (segment === "PID") {
      patientName = fields[5]?.replace(/\^/g, " ").trim() || patientName;
    } else if (segment === "OBR") {
      orderNumber = fields[2]?.trim() || fields[3]?.trim() || orderNumber;
    } else if (segment === "OBX") {
      const rawCode = fields[3]?.split("^")[0]?.trim() || "";
      const clinicalTitle = fields[3]?.split("^")[1]?.trim() || rawCode;
      const valStr = fields[5]?.trim() || "0";
      const unit = fields[6]?.trim() || "";
      const refRange = fields[7]?.trim() || "";
      const flag = fields[8]?.trim() || "N";

      const mapped = PARAM_NAME_MAP[rawCode.toUpperCase()];
      const clinicalName = clinicalTitle || (mapped ? mapped.name : rawCode);
      const finalUnit = unit || (mapped ? mapped.unit : "");
      const finalRange = refRange || (mapped ? mapped.range : "Standard Reference");

      let status: "normal" | "high" | "low" | "critical" = "normal";
      if (flag === "H" || flag === "HIGH") status = "high";
      else if (flag === "L" || flag === "LOW") status = "low";
      else if (flag === "A" || flag === "CRIT") status = "critical";

      parameters.push({
        parameter: clinicalName,
        value: valStr,
        unit: finalUnit,
        reference_range: finalRange,
        status
      });
    }
  }

  return {
    order_number: orderNumber,
    patient_name: patientName,
    analyzer_model: analyzerModel,
    protocol: "HL7",
    parameters
  };
}

/**
 * Fallback parser for CSV or plain text outputs (e.g., Parameter, Value, Unit)
 */
function parseDelimitedFallback(text: string): ParsedMachineResult {
  const lines = text.split(/[\r\n]+/).filter(l => l.trim().length > 0);
  const parameters: ParsedMachineResult["parameters"] = [];

  for (const line of lines) {
    // Split by comma, tab, or double space
    const parts = line.split(/[,;\t]+/).map(p => p.trim());
    if (parts.length >= 2) {
      const code = parts[0].toUpperCase();
      const val = parts[1];
      const unit = parts[2] || "";
      const range = parts[3] || "";

      const mapped = PARAM_NAME_MAP[code];
      parameters.push({
        parameter: mapped ? mapped.name : parts[0],
        value: val,
        unit: unit || (mapped ? mapped.unit : ""),
        reference_range: range || (mapped ? mapped.range : "Normal Range"),
        status: "normal"
      });
    }
  }

  return {
    order_number: "LAB-DIRECT-IMPORT",
    patient_name: "Walk-in Patient",
    analyzer_model: "Direct Benchtop Serial",
    protocol: "RAW",
    parameters
  };
}
