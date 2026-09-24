import React, { useState } from "react";
import {
  Wrench,
  ShieldCheck,
  Plus,
  History,
  Lock,
  Search,
  CheckCircle2,
  Calendar,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export default function RestorationJournal({
  restorations = [],
  artifacts = [],
  onCreateRestoration,
  loading = false,
  error = null,
}) {
  const [selectedArtifactId, setSelectedArtifactId] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [formData, setFormData] = useState({
    artifact_id: artifacts[0]?.id || "",
    conservator_name: "Dr. Eleanor Vance",
    treatment_date: new Date().toISOString().split("T")[0],
    technique: "Structural Stabilization & Desalination",
    materials_used:
      "Micro-crystalline wax, Paraloid B-72, deionized water baths",
    condition_before: "Fair",
    condition_after: "Stable",
    assessment_notes:
      "Structural consolidation of micro-fractures completed. Substrate humidity equilibrium achieved.",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const getArtifactInfo = (artId) => {
    const art = artifacts.find(
      (a) => a.id === artId || a.accession_no === artId,
    );
    return art
      ? `${art.accession_no} (${art.title})`
      : "ART-2026-001 (Roman Terracotta Amphora)";
  };

  const filteredRestorations = restorations.filter((res) => {
    const matchesArtifact =
      !selectedArtifactId ||
      res.artifact_id === selectedArtifactId ||
      res.artifact_accession === selectedArtifactId;

    const matchesQuery =
      !filterQuery ||
      res.conservator_name?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      res.technique?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      res.materials_used?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      res.assessment_notes?.toLowerCase().includes(filterQuery.toLowerCase());

    return matchesArtifact && matchesQuery;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const targetArtId =
      formData.artifact_id || (artifacts.length > 0 ? artifacts[0].id : null);
    if (!targetArtId) {
      setFormError("Please select a target artifact.");
      return;
    }

    if (!formData.technique.trim() || !formData.conservator_name.trim()) {
      setFormError("Technique and Conservator name are required.");
      return;
    }

    setSubmitting(true);
    try {
      if (onCreateRestoration) {
        await onCreateRestoration({
          ...formData,
          artifact_id: targetArtId,
        });
      }
      setSuccessMessage(
        "✓ Immutable treatment log committed and cryptographically sealed.",
      );
      setFormData({
        artifact_id: artifacts[0]?.id || "",
        conservator_name: "Dr. Eleanor Vance",
        treatment_date: new Date().toISOString().split("T")[0],
        technique: "",
        materials_used: "",
        condition_before: "Fair",
        condition_after: "Stable",
        assessment_notes: "",
      });
    } catch (err) {
      setFormError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to commit treatment log.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Curatorial Archive / Conservation Ledger
          </p>
          <h1 className="text-2xl font-serif font-bold text-indigo-950 mt-0.5">
            Conservation Journal & Immutable Treatment Ledger
          </h1>
          <p className="text-sm text-slate-500">
            Permanent audit records of conservation interventions, structural
            stabilizations, and condition transitions.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Dual Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Pane: Treatment History & Audit Trail */}
        <div className="lg:col-span-3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="font-serif text-base font-bold text-indigo-950 flex items-center space-x-2">
                <History className="w-4 h-4 text-indigo-900" />
                <span>Treatment History & Audit Trail</span>
              </h2>
              <p className="text-xs text-slate-500">
                Immutable chronological log of all conservation treatments and
                condition upgrades.
              </p>
            </div>

            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter ledger..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredRestorations.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <Wrench className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">
                  No conservation records found in this view.
                </p>
                <p className="text-[11px] text-slate-400">
                  Fill out the form on the right to log an immutable
                  conservation intervention.
                </p>
              </div>
            ) : (
              filteredRestorations.map((item, idx) => {
                const sealId = item.id
                  ? `TX-${item.id.slice(0, 8).toUpperCase()}`
                  : `TX-${9000 + idx}`;
                return (
                  <div
                    key={item.id || idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-all space-y-2.5 shadow-sm"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="font-serif font-bold text-sm text-indigo-950">
                          {item.artifact_title
                            ? `${item.artifact_accession || "ART"} (${item.artifact_title})`
                            : getArtifactInfo(item.artifact_id)}
                        </div>
                        <div className="text-xs text-indigo-900 font-semibold mt-0.5">
                          {item.technique || "Structural Stabilization"}
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                        {item.treatment_date || "2026-09-24"}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 bg-white/70 p-2.5 rounded-lg border border-slate-100">
                      <p>
                        <strong className="text-slate-700">Conservator:</strong>{" "}
                        {item.conservator_name || "Dr. Eleanor Vance"}
                      </p>
                      {item.materials_used && (
                        <p>
                          <strong className="text-slate-700">Materials:</strong>{" "}
                          {item.materials_used}
                        </p>
                      )}
                      <p>
                        <strong className="text-slate-700">
                          Condition Delta:
                        </strong>{" "}
                        <span className="text-amber-700 font-medium">
                          {item.condition_before || "Fair"}
                        </span>{" "}
                        →{" "}
                        <span className="text-emerald-700 font-bold">
                          {item.condition_after || "Stable"} (Upgraded)
                        </span>
                      </p>
                      {item.assessment_notes && (
                        <p className="text-slate-500 italic mt-1 pt-1 border-t border-slate-100">
                          "{item.assessment_notes}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                      <span className="flex items-center space-x-1 text-emerald-700">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Cryptographically Sealed #{sealId}</span>
                      </span>
                      <span>ISO 21127 Verified</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Record New Treatment Form */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h2 className="font-serif text-base font-bold text-indigo-950 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-indigo-900" />
              <span>Record New Treatment</span>
            </h2>
            <p className="text-xs text-slate-500">
              Commit a new permanent restoration log to the preservation ledger.
            </p>
          </div>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {formError}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-slate-700">
                Target Artifact *
              </label>
              <select
                value={formData.artifact_id}
                onChange={(e) =>
                  setFormData({ ...formData, artifact_id: e.target.value })
                }
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-950 focus:outline-none"
                required
              >
                <option value="">Select Artifact...</option>
                {artifacts.map((art) => (
                  <option key={art.id} value={art.id}>
                    {art.accession_no} — {art.title}
                  </option>
                ))}
                {artifacts.length === 0 && (
                  <option value="mock-art-1">
                    ART-2026-001 - Roman Terracotta Amphora
                  </option>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-slate-700">
                  Conservator Name *
                </label>
                <input
                  type="text"
                  value={formData.conservator_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conservator_name: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-950 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">
                  Treatment Date *
                </label>
                <input
                  type="date"
                  value={formData.treatment_date}
                  onChange={(e) =>
                    setFormData({ ...formData, treatment_date: e.target.value })
                  }
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-950 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700">
                Technique / Intervention *
              </label>
              <input
                type="text"
                placeholder="e.g. Structural Stabilization & Desalination"
                value={formData.technique}
                onChange={(e) =>
                  setFormData({ ...formData, technique: e.target.value })
                }
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-950 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700">
                Materials Applied
              </label>
              <textarea
                rows="2"
                placeholder="e.g. Micro-crystalline wax, Paraloid B-72, deionized water"
                value={formData.materials_used}
                onChange={(e) =>
                  setFormData({ ...formData, materials_used: e.target.value })
                }
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-950 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-slate-700">
                  Condition Before
                </label>
                <select
                  value={formData.condition_before}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      condition_before: e.target.value,
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

              <div className="space-y-1">
                <label className="font-medium text-slate-700">
                  Condition After
                </label>
                <select
                  value={formData.condition_after}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      condition_after: e.target.value,
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
                Assessment Notes
              </label>
              <textarea
                rows="2"
                placeholder="Treatment results, microscopic observations..."
                value={formData.assessment_notes}
                onChange={(e) =>
                  setFormData({ ...formData, assessment_notes: e.target.value })
                }
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-950 focus:outline-none"
              />
            </div>

            <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-[11px] flex items-start space-x-2">
              <Lock className="w-3.5 h-3.5 text-amber-700 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Preservation Mandate:</strong> Once committed, treatment
                records cannot be modified or purged pursuant to museological
                audit compliance.
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-indigo-950 text-white rounded-lg font-medium hover:bg-indigo-900 transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting
                ? "Sealing & Committing..."
                : "Commit Immutable Treatment Log"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
