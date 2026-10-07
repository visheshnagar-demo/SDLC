import React, { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";

export const AddEditCowModal = ({ isOpen, onClose, onSave, cow = null }) => {
  const isEdit = Boolean(cow && cow.id);

  const [formData, setFormData] = useState({
    tag_id: "",
    breed: "Holstein",
    date_of_birth: new Date().toISOString().split("T")[0],
    gender: "Female",
    health_status: "Healthy",
    weight_kg: "",
    location: "Barn A",
  });

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (cow) {
      setFormData({
        tag_id: cow.tag_id || "",
        breed: cow.breed || "Holstein",
        date_of_birth:
          cow.date_of_birth || new Date().toISOString().split("T")[0],
        gender: cow.gender || "Female",
        health_status: cow.health_status || "Healthy",
        weight_kg: cow.weight_kg !== undefined ? String(cow.weight_kg) : "",
        location: cow.location || "Barn A",
      });
    } else {
      setFormData({
        tag_id: "",
        breed: "Holstein",
        date_of_birth: new Date().toISOString().split("T")[0],
        gender: "Female",
        health_status: "Healthy",
        weight_kg: "",
        location: "Barn A",
      });
    }
    setFormError("");
  }, [cow, isOpen]);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.tag_id.trim()) {
      setFormError("Tag ID is required (e.g. COW-1050)");
      return;
    }

    if (formData.date_of_birth > todayStr) {
      setFormError("Date of Birth cannot be in the future.");
      return;
    }

    if (formData.weight_kg && isNaN(Number(formData.weight_kg))) {
      setFormError("Weight must be a valid numeric value in kg.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        weight_kg: formData.weight_kg ? Number(formData.weight_kg) : 600,
      };
      await onSave(payload, cow?.id);
      onClose();
    } catch (err) {
      setFormError(
        err.message || "Failed to save cattle profile. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {isEdit
              ? `Edit Cattle: ${cow.tag_id}`
              : "Register New Cattle Profile"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tag ID *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. COW-1050"
                value={formData.tag_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tag_id: e.target.value.toUpperCase(),
                  })
                }
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Breed
              </label>
              <select
                value={formData.breed}
                onChange={(e) =>
                  setFormData({ ...formData, breed: e.target.value })
                }
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Holstein">Holstein</option>
                <option value="Jersey">Jersey</option>
                <option value="Angus">Angus</option>
                <option value="Guernsey">Guernsey</option>
                <option value="Brown Swiss">Brown Swiss</option>
                <option value="Hereford">Hereford</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                required
                max={todayStr}
                value={formData.date_of_birth}
                onChange={(e) =>
                  setFormData({ ...formData, date_of_birth: e.target.value })
                }
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Female">Female (Cow)</option>
                <option value="Male">Male (Bull/Steer)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Health Status
              </label>
              <select
                value={formData.health_status}
                onChange={(e) =>
                  setFormData({ ...formData, health_status: e.target.value })
                }
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Healthy">Healthy</option>
                <option value="Under Treatment">Under Treatment</option>
                <option value="Quarantined">Quarantined</option>
                <option value="Sold">Sold</option>
                <option value="Deceased">Deceased</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 640"
                value={formData.weight_kg}
                onChange={(e) =>
                  setFormData({ ...formData, weight_kg: e.target.value })
                }
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Location / Stall
            </label>
            <input
              type="text"
              placeholder="e.g. Barn A - Stall 04"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {submitting
                ? "Saving..."
                : isEdit
                  ? "Update Profile"
                  : "Register Cow"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditCowModal;
