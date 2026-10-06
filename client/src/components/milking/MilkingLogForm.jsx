import React, { useState, useEffect } from "react";
import {
  Milk,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  QrCode,
} from "lucide-react";

export default function MilkingLogForm({
  onSubmit,
  cattleList = [],
  activeWithdrawals = [],
}) {
  const [formData, setFormData] = useState({
    cow_id: "",
    milking_date: new Date().toISOString().split("T")[0],
    session: "Morning",
    yield_liters: "",
    fat_percentage: "3.8",
    protein_percentage: "3.2",
    somatic_cell_count: "150",
  });

  const [rfidWandScan, setRfidWandScan] = useState("");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if selected cow is in active withdrawal
  const selectedCow = cattleList.find(
    (c) => c.id === formData.cow_id || c.tag_number === formData.cow_id,
  );

  const isCowWithheld = activeWithdrawals.some(
    (w) =>
      w.cow_id === formData.cow_id ||
      (selectedCow &&
        (w.cow_id === selectedCow.id || w.cow_tag === selectedCow.tag_number)),
  );

  // Check for 30% yield drop mastitis variance alert
  const checkVarianceAndAlerts = (yieldVal, sccVal) => {
    const yieldNum = parseFloat(yieldVal);
    const sccNum = parseInt(sccVal, 10);

    // Assume average expected yield is ~20L for demo calculation
    const expectedAvg = 20.0;
    let alerts = [];

    if (!isNaN(yieldNum) && yieldNum > 0 && yieldNum < expectedAvg * 0.7) {
      alerts.push(
        `Yield drop >30% detected (${yieldNum}L vs ~${expectedAvg}L average). Automated mastitis alert triggered.`,
      );
    }
    if (!isNaN(sccNum) && sccNum >= 250) {
      alerts.push(
        `High Somatic Cell Count (${sccNum}k/mL). Possible subclinical mastitis flagged.`,
      );
    }

    if (alerts.length > 0) {
      setWarning(alerts.join(" | "));
    } else {
      setWarning("");
    }
  };

  const handleYieldChange = (e) => {
    const val = e.target.value;
    setFormData({ ...formData, yield_liters: val });
    checkVarianceAndAlerts(val, formData.somatic_cell_count);
  };

  const handleSccChange = (e) => {
    const val = e.target.value;
    setFormData({ ...formData, somatic_cell_count: val });
    checkVarianceAndAlerts(formData.yield_liters, val);
  };

  const handleWandScan = (e) => {
    const scanVal = e.target.value;
    setRfidWandScan(scanVal);
    const matched = cattleList.find(
      (c) =>
        c.rfid_tag?.replace(/\s/g, "") === scanVal.replace(/\s/g, "") ||
        c.tag_number?.toLowerCase() === scanVal.toLowerCase(),
    );
    if (matched) {
      setFormData((prev) => ({
        ...prev,
        cow_id: matched.id || matched.tag_number,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.cow_id) {
      setError("Please select a cow or scan an RFID tag.");
      return;
    }

    if (!formData.yield_liters || parseFloat(formData.yield_liters) <= 0) {
      setError("Please enter a valid milk yield volume (Liters).");
      return;
    }

    const payload = {
      cow_id: formData.cow_id,
      milking_date: formData.milking_date,
      session: formData.session,
      yield_liters: parseFloat(formData.yield_liters),
      fat_percentage: formData.fat_percentage
        ? parseFloat(formData.fat_percentage)
        : null,
      protein_percentage: formData.protein_percentage
        ? parseFloat(formData.protein_percentage)
        : null,
      somatic_cell_count: formData.somatic_cell_count
        ? parseInt(formData.somatic_cell_count, 10)
        : null,
      is_withheld: isCowWithheld,
      variance_alert: !!warning,
    };

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(payload);
      }
      setSuccess(
        `Milking entry recorded successfully for ${selectedCow?.tag_number || formData.cow_id} (${payload.yield_liters} L)!`,
      );
      setFormData({
        cow_id: "",
        milking_date: new Date().toISOString().split("T")[0],
        session: "Morning",
        yield_liters: "",
        fat_percentage: "3.8",
        protein_percentage: "3.2",
        somatic_cell_count: "150",
      });
      setRfidWandScan("");
      setWarning("");
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to record milk log.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillSampleData = () => {
    const firstCow = cattleList[0] || {
      id: "COW-1042",
      tag_number: "COW-1042",
      rfid_tag: "982 000010428912",
    };
    setFormData({
      cow_id: firstCow.id || firstCow.tag_number,
      milking_date: new Date().toISOString().split("T")[0],
      session: "Morning",
      yield_liters: "18.5",
      fat_percentage: "3.8",
      protein_percentage: "3.2",
      somatic_cell_count: "150",
    });
    setRfidWandScan(firstCow.rfid_tag || "982 000010428912");
    setWarning("");
  };

  return (
    <div className="bg-white rounded-xl border border-[#DBE5E0] shadow-sm p-5">
      <div className="flex items-center justify-between pb-4 border-b border-[#DBE5E0] mb-5">
        <div>
          <h3 className="text-base font-bold text-[#171F24] flex items-center space-x-2">
            <Milk className="w-5 h-5 text-[#0D7A52]" />
            <span>Milking Session Logger</span>
          </h3>
          <p className="text-xs text-[#6B7A73]">
            Record morning/evening yields, milk fat, protein, and automated SCC
            mastitis checks
          </p>
        </div>
        <button
          type="button"
          onClick={fillSampleData}
          className="text-xs text-[#0D7A52] hover:underline font-medium bg-[#E7F5EE] px-2.5 py-1 rounded-md"
        >
          Fill Demo Sample
        </button>
      </div>

      {isCowWithheld && (
        <div
          role="alert"
          className="mb-4 p-3 bg-[#FDF0ED] border border-[#E76F51] rounded-lg flex items-start space-x-2 text-xs text-[#D92929]"
        >
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-[#E76F51]" />
          <div>
            <strong className="font-semibold block">
              COMPLIANCE WITHHOLDING ACTIVE
            </strong>
            This cow is currently under active veterinary milk withdrawal. Milk
            from this session MUST be dumped and excluded from bulk tank sales.
          </div>
        </div>
      )}

      {warning && (
        <div
          role="alert"
          className="mb-4 p-3 bg-[#FEF7EC] border border-[#E5941A]/40 rounded-lg flex items-start space-x-2 text-xs text-[#E5941A]"
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[#E5941A]" />
          <div>
            <strong className="font-semibold block">
              Automated Mastitis / Quality Alert
            </strong>
            {warning}
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 p-3 bg-[#FDF0ED] border border-[#D92929]/30 rounded-lg flex items-center space-x-2 text-xs text-[#D92929]"
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-[#E7F5EE] border border-[#149E4D]/30 rounded-lg flex items-center space-x-2 text-xs text-[#149E4D]">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#171F24] mb-1">
              RFID Wand Quick Scan / Search
            </label>
            <div className="relative">
              <QrCode className="w-4 h-4 absolute left-3 top-2.5 text-[#6B7A73]" />
              <input
                type="text"
                placeholder="Scan ear tag or enter RFID..."
                value={rfidWandScan}
                onChange={handleWandScan}
                className="w-full pl-9 pr-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171F24] mb-1">
              Select Cow *
            </label>
            <select
              value={formData.cow_id}
              onChange={(e) => {
                setFormData({ ...formData, cow_id: e.target.value });
              }}
              className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
              required
            >
              <option value="">-- Choose Cow --</option>
              {cattleList.map((c) => (
                <option key={c.id || c.tag_number} value={c.id || c.tag_number}>
                  {c.tag_number} ({c.breed}) - RFID: {c.rfid_tag || "N/A"}
                </option>
              ))}
              {cattleList.length === 0 && (
                <option value="COW-1042">COW-1042 (Holstein-Friesian)</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171F24] mb-1">
              Milking Date *
            </label>
            <input
              type="date"
              value={formData.milking_date}
              onChange={(e) =>
                setFormData({ ...formData, milking_date: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171F24] mb-1">
              Session *
            </label>
            <select
              value={formData.session}
              onChange={(e) =>
                setFormData({ ...formData, session: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
            >
              <option value="Morning">Morning Milking (AM)</option>
              <option value="Evening">Evening Milking (PM)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171F24] mb-1">
              Milk Yield (Liters) *
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 18.5"
              value={formData.yield_liters}
              onChange={handleYieldChange}
              className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171F24] mb-1">
              Fat Percentage (%)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 3.8"
              value={formData.fat_percentage}
              onChange={(e) =>
                setFormData({ ...formData, fat_percentage: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171F24] mb-1">
              Protein Percentage (%)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 3.2"
              value={formData.protein_percentage}
              onChange={(e) =>
                setFormData({ ...formData, protein_percentage: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171F24] mb-1">
              Somatic Cell Count (SCC, k/mL)
            </label>
            <input
              type="number"
              step="1"
              placeholder="e.g. 150"
              value={formData.somatic_cell_count}
              onChange={handleSccChange}
              className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#0D7A52] hover:bg-[#095C3E] text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <Milk className="w-4 h-4" />
            <span>{isSubmitting ? "Recording..." : "Record Milk Yield"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
