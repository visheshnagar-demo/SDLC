import React, { useState } from "react";
import { X, AlertCircle } from "lucide-react";

export function RegisterFlockModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: "",
    breed: "Rhode Island Red",
    hatch_date: new Date().toISOString().split("T")[0],
    initial_count: 500,
    coop_location: "Coop #1",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "initial_count" ? parseInt(value, 10) || 0 : value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validation per acceptance criteria
    if (!formData.name.trim()) {
      setError("Flock name/ID is required.");
      return;
    }

    if (formData.initial_count <= 0) {
      setError(
        "Initial hen count must be greater than zero (HTTP 400 validation rule).",
      );
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        ...formData,
        active_count: formData.initial_count,
        status: "Active",
      });
      onClose();
      setFormData({
        name: "",
        breed: "Rhode Island Red",
        hatch_date: new Date().toISOString().split("T")[0],
        initial_count: 500,
        coop_location: "Coop #1",
      });
    } catch (err) {
      console.error("Failed to register flock", err);
      const detail =
        err.response?.data?.detail || err.message || "Failed to register flock";
      setError(typeof detail === "string" ? detail : JSON.stringify(detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900">
            Register New Flock
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Flock ID / Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Flock A-101"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Chicken Breed
            </label>
            <select
              name="breed"
              value={formData.breed}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Rhode Island Red">Rhode Island Red</option>
              <option value="Leghorn White">Leghorn White</option>
              <option value="Plymouth Rock">Plymouth Rock</option>
              <option value="Sussex Light">Sussex Light</option>
              <option value="Ameraucana">Ameraucana</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Hatch Date
              </label>
              <input
                type="date"
                name="hatch_date"
                value={formData.hatch_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Initial Hen Count *
              </label>
              <input
                type="number"
                name="initial_count"
                value={formData.initial_count}
                onChange={handleChange}
                min="1"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Housing Coop Location
            </label>
            <input
              type="text"
              name="coop_location"
              value={formData.coop_location}
              onChange={handleChange}
              placeholder="e.g. Coop #1"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Registering..." : "Register Flock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterFlockModal;
