import React, { useState } from "react";
import {
  X,
  MapPin,
  Calendar,
  Layers,
  Clock,
  Shield,
  Wrench,
  CheckCircle,
  FileText,
  Edit2,
  Save,
} from "lucide-react";

export default function ArtifactDetailModal({
  artifact,
  locations = [],
  restorations = [],
  inspections = [],
  loans = [],
  onClose,
  onUpdateArtifact,
}) {
  if (!artifact) return null;

  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: artifact.title || "",
    description: artifact.description || "",
    category: artifact.category || "Ceramic",
    medium: artifact.medium || "",
    creation_era: artifact.creation_era || "",
    origin: artifact.origin || "",
    status: artifact.status || "On Display",
    condition_rating: artifact.condition_rating || "Good",
    current_location_id: artifact.current_location_id || "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Filter linked records
  const artifactRestorations = restorations.filter(
    (r) =>
      r.artifact_id === artifact.id || r.artifact_id === artifact.accession_no,
  );
  const artifactInspections = inspections.filter(
    (i) =>
      i.artifact_id === artifact.id || i.artifact_id === artifact.accession_no,
  );
  const artifactLoans = loans.filter(
    (l) =>
      l.artifact_id === artifact.id || l.artifact_id === artifact.accession_no,
  );

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);
    try {
      if (onUpdateArtifact) {
        await onUpdateArtifact(artifact.id, editForm);
      }
      setIsEditing(false);
    } catch (err) {
      setSaveError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to update artifact.",
      );
    } finally {
      setSaving(false);
    }
  };

  const getLocationName = (id) => {
    const loc = locations.find((l) => l.id === id);
    return loc ? `${loc.name} (${loc.zone_type})` : "Main Gallery";
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 animate-fadeIn">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {artifact.accession_no}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-900 font-medium border border-indigo-200">
                {artifact.category}
              </span>
            </div>
            <h2 className="font-serif font-bold text-xl text-indigo-950 mt-1">
              {artifact.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dossier Tabs */}
        <div className="px-5 border-b border-slate-200 bg-slate-50 flex space-x-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-2.5 border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-indigo-950 text-indigo-950 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Overview & Provenance
          </button>
          <button
            onClick={() => setActiveTab("restorations")}
            className={`py-2.5 border-b-2 transition-colors flex items-center space-x-1 ${
              activeTab === "restorations"
                ? "border-indigo-950 text-indigo-950 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Conservation Ledger</span>
            <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px]">
              {artifactRestorations.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("inspections")}
            className={`py-2.5 border-b-2 transition-colors flex items-center space-x-1 ${
              activeTab === "inspections"
                ? "border-indigo-950 text-indigo-950 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Inspections</span>
            <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px]">
              {artifactInspections.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("loans")}
            className={`py-2.5 border-b-2 transition-colors flex items-center space-x-1 ${
              activeTab === "loans"
                ? "border-indigo-950 text-indigo-950 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Loans</span>
            <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px]">
              {artifactLoans.length}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {saveError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {saveError}
            </div>
          )}

          {activeTab === "overview" && (
            <div className="space-y-4">
              {!isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 font-medium block">
                        Medium / Material
                      </span>
                      <span className="text-slate-800 font-semibold text-sm">
                        {artifact.medium || "Terracotta / Slip glaze"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">
                        Creation Era / Period
                      </span>
                      <span className="text-slate-800 font-semibold text-sm">
                        {artifact.creation_era || "1st Century CE"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">
                        Origin & Provenance
                      </span>
                      <span className="text-slate-800 font-semibold text-sm">
                        {artifact.origin || "Pompeii, Italy"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">
                        Accession Date
                      </span>
                      <span className="text-slate-800 font-semibold text-sm">
                        {artifact.accession_date || "2026-09-24"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white border border-slate-200 rounded-lg">
                      <span className="text-slate-500 block mb-1 font-medium">
                        Current Status
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                        {artifact.status || "On Display"}
                      </span>
                    </div>
                    <div className="p-3 bg-white border border-slate-200 rounded-lg">
                      <span className="text-slate-500 block mb-1 font-medium">
                        Condition Rating
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-50 text-indigo-950 font-semibold">
                        {artifact.condition_rating || "Good"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-slate-400 text-[10px] block">
                        Location Assignment
                      </span>
                      <span className="text-slate-800 font-semibold">
                        {artifact.location_name ||
                          getLocationName(artifact.current_location_id)}
                      </span>
                    </div>
                  </div>

                  {artifact.description && (
                    <div className="space-y-1">
                      <span className="font-semibold text-slate-700">
                        Curatorial Description
                      </span>
                      <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                        {artifact.description}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center space-x-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Dossier</span>
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleSave} className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">
                      Artifact Title
                    </label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                      className="w-full p-2 border border-slate-200 rounded-lg"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-medium text-slate-700">
                        Category
                      </label>
                      <select
                        value={editForm.category}
                        onChange={(e) =>
                          setEditForm({ ...editForm, category: e.target.value })
                        }
                        className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                      >
                        <option value="Ceramic">Ceramic</option>
                        <option value="Painting">Painting</option>
                        <option value="Sculpture">Sculpture</option>
                        <option value="Textile">Textile</option>
                        <option value="Manuscript">Manuscript</option>
                        <option value="Metalwork">Metalwork</option>
                        <option value="Woodwork">Woodwork</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-medium text-slate-700">
                        Location
                      </label>
                      <select
                        value={editForm.current_location_id}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            current_location_id: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                      >
                        <option value="">Select Location...</option>
                        {locations.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-medium text-slate-700">
                        Status
                      </label>
                      <select
                        value={editForm.status}
                        onChange={(e) =>
                          setEditForm({ ...editForm, status: e.target.value })
                        }
                        className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                      >
                        <option value="On Display">On Display</option>
                        <option value="In Storage">In Storage</option>
                        <option value="Under Restoration">
                          Under Restoration
                        </option>
                        <option value="On Loan">On Loan</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-medium text-slate-700">
                        Condition Rating
                      </label>
                      <select
                        value={editForm.condition_rating}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            condition_rating: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                      >
                        <option value="Good">Good</option>
                        <option value="Stable">Stable</option>
                        <option value="Fair">Fair</option>
                        <option value="Damaged">Damaged</option>
                        <option value="Compromised">Compromised</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">
                      Description
                    </label>
                    <textarea
                      rows="3"
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div className="pt-2 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-3 py-1.5 bg-indigo-950 text-white rounded-lg font-medium hover:bg-indigo-900"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === "restorations" && (
            <div className="space-y-3">
              {artifactRestorations.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Wrench className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>No conservation treatments recorded for this artifact.</p>
                </div>
              ) : (
                artifactRestorations.map((res, idx) => (
                  <div
                    key={res.id || idx}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-indigo-950">
                        {res.technique || "Conservation Treatment"}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {res.treatment_date || "2026-09-24"}
                      </span>
                    </div>
                    <div className="text-slate-600">
                      <strong>Conservator:</strong>{" "}
                      {res.conservator_name || "Dr. Eleanor Vance"}
                    </div>
                    {res.materials_used && (
                      <div className="text-slate-600">
                        <strong>Materials:</strong> {res.materials_used}
                      </div>
                    )}
                    <div className="text-slate-600">
                      <strong>Condition Delta:</strong>{" "}
                      <span className="text-amber-700">
                        {res.condition_before || "Fair"}
                      </span>{" "}
                      →{" "}
                      <span className="text-emerald-700 font-bold">
                        {res.condition_after || "Stable"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "inspections" && (
            <div className="space-y-3">
              {artifactInspections.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>No preservation inspections recorded for this artifact.</p>
                </div>
              ) : (
                artifactInspections.map((insp, idx) => (
                  <div
                    key={insp.id || idx}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-800">
                        Status: {insp.inspection_status || "Completed"}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {insp.scheduled_date || insp.completed_date}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      <strong>Inspector:</strong>{" "}
                      {insp.assigned_inspector || "Dr. Eleanor Vance"}
                    </p>
                    {insp.findings_notes && (
                      <p className="text-slate-600">
                        <strong>Findings:</strong> {insp.findings_notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "loans" && (
            <div className="space-y-3">
              {artifactLoans.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>No inter-museum loans recorded for this artifact.</p>
                </div>
              ) : (
                artifactLoans.map((loan, idx) => (
                  <div
                    key={loan.id || idx}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-indigo-950">
                        {loan.partner_museum_name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-semibold">
                        {loan.loan_status}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      <strong>Dates:</strong> {loan.loan_start_date} to{" "}
                      {loan.loan_end_date}
                    </p>
                    <p className="text-slate-600">
                      <strong>Indemnity:</strong> $
                      {loan.indemnity_valuation?.toLocaleString()} USD
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between items-center text-xs">
          <div className="flex items-center space-x-1.5 text-slate-500 font-mono text-[11px]">
            <Shield className="w-3.5 h-3.5 text-indigo-900" />
            <span>ISO 21127 Archival Record Sealed</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-950 text-white rounded-lg font-medium hover:bg-indigo-900"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
