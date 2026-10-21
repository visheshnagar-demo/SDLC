import React from "react";
import { Pill, Plus, Trash2 } from "lucide-react";

export function PrescriptionTable({
  prescriptions = [],
  onChange,
  readOnly = false,
}) {
  const handleAddRow = () => {
    if (readOnly) return;
    const newRow = {
      drug_name: "",
      dosage: "1 tablet",
      frequency: "Once daily",
      duration: "30 days",
      instructions: "Take with food",
    };
    onChange([...prescriptions, newRow]);
  };

  const handleUpdateRow = (index, field, value) => {
    if (readOnly) return;
    const updated = prescriptions.map((item, i) =>
      i === index ? { ...item, [field]: value } : item,
    );
    onChange(updated);
  };

  const handleRemoveRow = (index) => {
    if (readOnly) return;
    const updated = prescriptions.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Pill className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              e-Prescribe & Medication Orders
            </h4>
            <p className="text-[11px] text-slate-400">
              Add medications, dosage, and frequency instructions
            </p>
          </div>
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={handleAddRow}
            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold border border-indigo-200 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Medication
          </button>
        )}
      </div>

      {prescriptions.length === 0 ? (
        <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-slate-400">
          <Pill className="w-6 h-6 mx-auto mb-1 text-slate-300" />
          <p className="text-xs font-medium">No medications prescribed yet.</p>
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddRow}
              className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              + Click to add first prescription
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Medication Name / Strength</th>
                <th className="py-2.5 px-3">Dosage</th>
                <th className="py-2.5 px-3">Frequency</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Special Instructions</th>
                {!readOnly && <th className="py-2.5 px-2 text-right"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {prescriptions.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-2 px-3">
                    {readOnly ? (
                      <span className="font-semibold text-slate-800">
                        {p.drug_name}
                      </span>
                    ) : (
                      <input
                        type="text"
                        placeholder="e.g. Amlodipine 5mg"
                        value={p.drug_name}
                        onChange={(e) =>
                          handleUpdateRow(idx, "drug_name", e.target.value)
                        }
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {readOnly ? (
                      <span className="text-slate-700">{p.dosage}</span>
                    ) : (
                      <input
                        type="text"
                        placeholder="e.g. 1 tab"
                        value={p.dosage}
                        onChange={(e) =>
                          handleUpdateRow(idx, "dosage", e.target.value)
                        }
                        className="w-24 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {readOnly ? (
                      <span className="text-slate-700">{p.frequency}</span>
                    ) : (
                      <input
                        type="text"
                        placeholder="e.g. Once daily"
                        value={p.frequency}
                        onChange={(e) =>
                          handleUpdateRow(idx, "frequency", e.target.value)
                        }
                        className="w-28 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {readOnly ? (
                      <span className="text-slate-700">{p.duration}</span>
                    ) : (
                      <input
                        type="text"
                        placeholder="e.g. 30 days"
                        value={p.duration}
                        onChange={(e) =>
                          handleUpdateRow(idx, "duration", e.target.value)
                        }
                        className="w-24 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {readOnly ? (
                      <span className="text-slate-600">{p.instructions}</span>
                    ) : (
                      <input
                        type="text"
                        placeholder="e.g. After breakfast"
                        value={p.instructions}
                        onChange={(e) =>
                          handleUpdateRow(idx, "instructions", e.target.value)
                        }
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    )}
                  </td>
                  {!readOnly && (
                    <td className="py-2 px-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PrescriptionTable;
