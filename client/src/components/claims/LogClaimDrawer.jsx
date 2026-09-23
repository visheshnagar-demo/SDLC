import React, { useState, useEffect } from "react";
import {
  X,
  Wrench,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export default function LogClaimDrawer({
  isOpen = false,
  onClose = () => {},
  products = [],
  warranties = [],
  defaultProductId = "",
  onSubmit = async () => {},
}) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    product_id: "",
    claim_date: todayStr,
    issue_description: "Screen backlight flickering and intermittent blackouts",
    service_center: "Apple Authorized Service Center",
    repair_cost: "150.00",
    status: "Resolved",
    resolution_notes:
      "Replaced internal display ribbon cable under warranty review.",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defaultProductId) {
      setFormData((prev) => ({ ...prev, product_id: defaultProductId }));
    } else if (products.length > 0 && !formData.product_id) {
      setFormData((prev) => ({ ...prev, product_id: products[0].id }));
    }
  }, [defaultProductId, products]);

  if (!isOpen) return null;

  const selectedProduct = products.find((p) => p.id === formData.product_id);
  const selectedWarranty = warranties.find(
    (w) => w.product_id === formData.product_id,
  );

  const isWarrantyExpired =
    selectedWarranty?.status?.toLowerCase() === "expired" ||
    (selectedWarranty?.expiration_date &&
      new Date(selectedWarranty.expiration_date) < new Date());

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.product_id) {
      setErrorMessage("Please select a product.");
      return;
    }
    if (!formData.issue_description.trim()) {
      setErrorMessage("Issue description is required.");
      return;
    }
    const costNum = parseFloat(formData.repair_cost);
    if (isNaN(costNum) || costNum < 0) {
      setErrorMessage("Repair cost must be a valid non-negative number.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        repair_cost: costNum,
      });
      onClose();
    } catch (err) {
      const detail =
        err.response?.data?.detail || err.message || "Failed to log claim.";
      setErrorMessage(
        typeof detail === "string" ? detail : JSON.stringify(detail),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-sm">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Log Repair / Claim Entry
              </h2>
              <p className="text-xs text-slate-500">
                Record service details, cost, and track claim resolution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Expired Warranty Warning Banner */}
          {isWarrantyExpired && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  Warranty Expired for Selected Product
                </p>
                <p className="mt-0.5">
                  The warranty on this product has expired. You can still log
                  repair costs and claim details for your personal maintenance
                  history.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Product *
            </label>
            <select
              name="product_id"
              value={formData.product_id}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              required
            >
              {products.length === 0 ? (
                <option value="">No registered products available</option>
              ) : (
                products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.brand || "Brand"} - SN:{" "}
                    {p.serial_number || "N/A"})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Claim Date *
              </label>
              <input
                type="date"
                name="claim_date"
                value={formData.claim_date}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Claim Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Approved">Approved</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Repair Cost ($) *
              </label>
              <input
                type="number"
                name="repair_cost"
                step="0.01"
                min="0"
                value={formData.repair_cost}
                onChange={handleChange}
                placeholder="e.g. 150.00"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Service Center / Provider
              </label>
              <input
                type="text"
                name="service_center"
                value={formData.service_center}
                onChange={handleChange}
                placeholder="e.g. Best Buy Geek Squad, Official Center"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Issue Description *
            </label>
            <textarea
              name="issue_description"
              value={formData.issue_description}
              onChange={handleChange}
              rows="2"
              placeholder="Describe the malfunction, symptom, or damage..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Resolution Notes / Invoice Reference
            </label>
            <textarea
              name="resolution_notes"
              value={formData.resolution_notes}
              onChange={handleChange}
              rows="2"
              placeholder="Parts replaced, technician diagnostics, claim reference number..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Logging Claim..." : "Save Claim"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
