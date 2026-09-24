import React, { useState } from "react";
import {
  Calendar,
  AlertTriangle,
  CheckCircle,
  Plus,
  Clock,
  ClipboardList,
  ShieldAlert,
  User,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function InspectionScheduler({
  inspections = [],
  artifacts = [],
  onCreateInspection,
  onCompleteInspection,
  loading = false,
  error = null,
}) {
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Active Audit Checklist state
  const [checklistData, setChecklistData] = useState({
    surface_condition: "Minor Wear",
    pest_activity: false,
    structural_integrity: "Fragile",
    findings_notes:
      "Inspection of artifact reveals slight hygroscopic stress due to recent moisture excursion in storage.",
  });
  const [checklistSubmitting, setChecklistSubmitting] = useState(false);
  const [checklistError, setChecklistError] = useState(null);
  const [checklistSuccess, setChecklistSuccess] = useState(null);

  // Schedule modal form state
  const [scheduleForm, setScheduleForm] = useState({
    artifact_id: artifacts[0]?.id || "",
    assigned_inspector: "Dr. Eleanor Vance",
    scheduled_date: new Date().toISOString().split("T")[0],
    findings_notes: "Routine scheduled preservation inspection.",
  });
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);

  // Calculate next recommended inspection interval
  const calculateNextInterval = () => {
    if (
      checklistData.structural_integrity === "Compromised" ||
      checklistData.pest_activity
    ) {
      return { days: 14, label: "14 Days (Critical Risk Interval)" };
    }
    if (
      checklistData.structural_integrity === "Fragile" ||
      checklistData.surface_condition === "Severe Flaking/Fraying"
    ) {
      return { days: 30, label: "30 Days (High Fragility Risk Interval)" };
    }
    if (
      checklistData.surface_condition === "Abrasion" ||
      checklistData.surface_condition === "Minor Wear"
    ) {
      return { days: 90, label: "90 Days (Standard Quarterly Interval)" };
    }
    return { days: 180, label: "180 Days (Semi-Annual Routine)" };
  };

  const nextInterval = calculateNextInterval();
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + nextInterval.days);
  const nextDateStr = nextDate.toISOString().split("T")[0];

  const handleChecklistSubmit = async (e) => {
    e.preventDefault();
    setChecklistError(null);
    setChecklistSuccess(null);

    const inspectionId =
      selectedInspection?.id ||
      (inspections.length > 0 ? inspections[0].id : null);
    if (!inspectionId && !onCreateInspection) {
      setChecklistError("No inspection selected for audit submission.");
      return;
    }

    setChecklistSubmitting(true);
    try {
      const payload = {
        ...checklistData,
        completed_date: new Date().toISOString().split("T")[0],
        next_recommended_inspection_date: nextDateStr,
        inspection_status: "Completed",
      };

      if (inspectionId && onCompleteInspection) {
        await onCompleteInspection(inspectionId, payload);
      } else if (onCreateInspection) {
        await onCreateInspection({
          ...payload,
          artifact_id: artifacts[0]?.id || "mock-art-1",
          assigned_inspector: "Dr. Eleanor Vance",
          scheduled_date: new Date().toISOString().split("T")[0],
        });
      }
      setChecklistSuccess(
        "✓ Inspection audit submitted and next recurring date calculated.",
      );
    } catch (err) {
      setChecklistError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to submit inspection audit.",
      );
    } finally {
      setChecklistSubmitting(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setScheduleError(null);

    const targetArtId =
      scheduleForm.artifact_id ||
      (artifacts.length > 0 ? artifacts[0].id : null);
    if (!targetArtId) {
      setScheduleError("Please select a target artifact.");
      return;
    }

    setScheduleSubmitting(true);
    try {
      if (onCreateInspection) {
        await onCreateInspection({
          ...scheduleForm,
          artifact_id: targetArtId,
          inspection_status: "Pending",
        });
      }
      setShowScheduleModal(false);
      setScheduleForm({
        artifact_id: artifacts[0]?.id || "",
        assigned_inspector: "Dr. Eleanor Vance",
        scheduled_date: new Date().toISOString().split("T")[0],
        findings_notes: "",
      });
    } catch (err) {
      setScheduleError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to schedule inspection.",
      );
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const getArtifactName = (artId) => {
    const art = artifacts.find(
      (a) => a.id === artId || a.accession_no === artId,
    );
    return art
      ? `${art.title} (${art.accession_no})`
      : "Flemish Silk Tapestry Fragment (ART-2026-089)";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Curatorial Archive / Inspection Queue
          </p>
          <h1 className="text-2xl font-serif font-bold text-indigo-950 mt-0.5">
            Physical Inspection Scheduling & Preservation Audit Queue
          </h1>
          <p className="text-sm text-slate-500">
            Risk-based recurring inspection schedules, multi-point physical
            checklists, and overdue risk queues.
          </p>
        </div>

        <button
          onClick={() => {
            setScheduleForm({
              artifact_id: artifacts[0]?.id || "",
              assigned_inspector: "Dr. Eleanor Vance",
              scheduled_date: new Date().toISOString().split("T")[0],
              findings_notes: "",
            });
            setShowScheduleModal(true);
          }}
          className="px-4 py-2 bg-indigo-950 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-indigo-900 transition-colors flex items-center space-x-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Preservation Inspection</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Dual-Pane Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Pane: Priority & Overdue Inspection Queue */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-base font-bold text-indigo-950 flex items-center space-x-2">
                <ClipboardList className="w-4 h-4 text-indigo-900" />
                <span>Active Priority Queue & Overdue Audits</span>
              </h2>
              <p className="text-xs text-slate-500">
                Automated triage queue ordered by environmental trigger urgency
                and scheduled due dates.
              </p>
            </div>
            <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-1 rounded-full border border-amber-200">
              {inspections.length > 0
                ? `${inspections.length} In Queue`
                : "3 In Queue"}
            </span>
          </div>

          <div className="space-y-3.5">
            {/* Urgent Overdue Callout Card */}
            <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 space-y-2.5 shadow-sm">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="font-serif font-bold text-sm text-red-950 block">
                    Flemish Silk Tapestry Fragment (ART-2026-089)
                  </span>
                  <p className="text-xs text-red-700 mt-1">
                    <strong>Trigger:</strong> Storage Vault A RH Spiking to
                    68.2% (+18.2% excursion). Urgent hygroscopic fiber stress
                    risk check.
                  </p>
                </div>
                <span className="px-2 py-0.5 text-xs bg-red-600 text-white rounded font-semibold animate-pulse flex-shrink-0">
                  OVERDUE (4 Days)
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-red-100 gap-2">
                <span className="flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Inspector: Dr. Eleanor Vance</span>
                </span>
                <button
                  onClick={() => {
                    setSelectedInspection({
                      id: "overdue-1",
                      artifact_title:
                        "Flemish Silk Tapestry Fragment (ART-2026-089)",
                    });
                    setChecklistData({
                      surface_condition: "Minor Wear",
                      pest_activity: false,
                      structural_integrity: "Fragile",
                      findings_notes:
                        "Inspection of tapestry warp threads reveals slight hygroscopic fiber swelling due to recent Vault A moisture excursion.",
                    });
                  }}
                  className="text-red-900 font-bold hover:underline flex items-center space-x-1 text-xs"
                >
                  <span>Complete Inspection Checklist →</span>
                </button>
              </div>
            </div>

            {/* List of inspections */}
            {inspections.map((insp, idx) => {
              const isCompleted = insp.inspection_status === "Completed";
              return (
                <div
                  key={insp.id || idx}
                  className={`p-4 rounded-xl border transition-all ${
                    selectedInspection?.id === insp.id
                      ? "border-indigo-950 bg-indigo-50/30 shadow-sm"
                      : "border-slate-200 bg-slate-50/40 hover:bg-white hover:border-indigo-200"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-serif font-bold text-sm text-indigo-950">
                        {getArtifactName(insp.artifact_id)}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Scheduled: {insp.scheduled_date || "2026-09-24"} |
                        Inspector:{" "}
                        {insp.assigned_inspector || "Dr. Eleanor Vance"}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                        isCompleted
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {insp.inspection_status || "Pending"}
                    </span>
                  </div>

                  {insp.findings_notes && (
                    <p className="text-xs text-slate-600 mt-2 bg-white/70 p-2 rounded border border-slate-100">
                      {insp.findings_notes}
                    </p>
                  )}

                  {!isCompleted && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedInspection(insp);
                          setChecklistData({
                            surface_condition:
                              insp.surface_condition || "Normal",
                            pest_activity: insp.pest_activity || false,
                            structural_integrity:
                              insp.structural_integrity || "Sound",
                            findings_notes: insp.findings_notes || "",
                          });
                        }}
                        className="text-xs font-semibold text-indigo-950 hover:underline"
                      >
                        Load Checklist →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Multi-Point Audit Checklist Panel */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h2 className="font-serif text-base font-bold text-indigo-950 flex items-center space-x-2">
              <ClipboardList className="w-4 h-4 text-indigo-900" />
              <span>Active Audit Checklist</span>
            </h2>
            <p className="text-xs text-slate-500">
              {selectedInspection
                ? `Auditing: ${selectedInspection.artifact_title || "Selected Artifact"}`
                : "Multi-point physical inspection evaluation form."}
            </p>
          </div>

          {checklistError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {checklistError}
            </div>
          )}

          {checklistSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{checklistSuccess}</span>
            </div>
          )}

          <form
            onSubmit={handleChecklistSubmit}
            className="space-y-3.5 text-xs"
          >
            <div className="space-y-1">
              <label className="font-medium text-slate-700">
                Surface Condition *
              </label>
              <select
                value={checklistData.surface_condition}
                onChange={(e) =>
                  setChecklistData({
                    ...checklistData,
                    surface_condition: e.target.value,
                  })
                }
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-950 focus:outline-none"
              >
                <option value="Normal">
                  Normal — No noticeable surface deterioration
                </option>
                <option value="Minor Wear">
                  Minor Wear — Superficial patina change
                </option>
                <option value="Abrasion">
                  Abrasion — Mechanical friction or micro-scratches
                </option>
                <option value="Severe Flaking/Fraying">
                  Severe Flaking/Fraying — Urgent intervention needed
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-700">
                Biological & Pest Activity *
              </label>
              <div className="flex items-center space-x-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="pest"
                    checked={!checklistData.pest_activity}
                    onChange={() =>
                      setChecklistData({
                        ...checklistData,
                        pest_activity: false,
                      })
                    }
                    className="text-indigo-950"
                  />
                  <span>No Pest Activity</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer text-red-700 font-semibold">
                  <input
                    type="radio"
                    name="pest"
                    checked={checklistData.pest_activity}
                    onChange={() =>
                      setChecklistData({
                        ...checklistData,
                        pest_activity: true,
                      })
                    }
                    className="text-red-600"
                  />
                  <span>Active Infestation</span>
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700">
                Structural Integrity *
              </label>
              <select
                value={checklistData.structural_integrity}
                onChange={(e) =>
                  setChecklistData({
                    ...checklistData,
                    structural_integrity: e.target.value,
                  })
                }
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-950 focus:outline-none"
              >
                <option value="Sound">
                  Sound — Structurally stable and self-supporting
                </option>
                <option value="Fragile">
                  Fragile — Stress fractures or micro-cleavage
                </option>
                <option value="Compromised">
                  Compromised — Imminent structural failure risk
                </option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700">
                Findings Notes
              </label>
              <textarea
                rows="3"
                value={checklistData.findings_notes}
                onChange={(e) =>
                  setChecklistData({
                    ...checklistData,
                    findings_notes: e.target.value,
                  })
                }
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-950 focus:outline-none"
              />
            </div>

            {/* Auto-calculated Next Inspection Horizon */}
            <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-950 rounded-lg space-y-1">
              <div className="font-semibold flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-indigo-700" />
                <span>Calculated Next Inspection</span>
              </div>
              <p className="text-[11px] text-indigo-900 font-medium">
                {nextInterval.label} &bull; Due by{" "}
                <strong>{nextDateStr}</strong>
              </p>
            </div>

            <button
              type="submit"
              disabled={checklistSubmitting}
              className="w-full py-2.5 bg-indigo-950 text-white rounded-lg font-medium hover:bg-indigo-900 transition-colors shadow-sm disabled:opacity-50"
            >
              {checklistSubmitting
                ? "Submitting..."
                : "Submit Inspection Audit Report"}
            </button>
          </form>
        </div>
      </div>

      {/* Schedule Inspection Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-serif font-bold text-lg text-indigo-950">
                Schedule Preservation Inspection
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {scheduleError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {scheduleError}
              </div>
            )}

            <form
              onSubmit={handleScheduleSubmit}
              className="space-y-3.5 text-xs"
            >
              <div className="space-y-1">
                <label className="font-medium text-slate-700">
                  Target Artifact *
                </label>
                <select
                  value={scheduleForm.artifact_id}
                  onChange={(e) =>
                    setScheduleForm({
                      ...scheduleForm,
                      artifact_id: e.target.value,
                    })
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  required
                >
                  <option value="">Select Artifact...</option>
                  {artifacts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accession_no} — {a.title}
                    </option>
                  ))}
                  {artifacts.length === 0 && (
                    <option value="mock-1">
                      ART-2026-089 - Flemish Silk Tapestry Fragment
                    </option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    Assigned Inspector *
                  </label>
                  <input
                    type="text"
                    value={scheduleForm.assigned_inspector}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        assigned_inspector: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-200 rounded-lg"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    Scheduled Due Date *
                  </label>
                  <input
                    type="date"
                    value={scheduleForm.scheduled_date}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        scheduled_date: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">
                  Inspection Trigger / Notes
                </label>
                <textarea
                  rows="2"
                  value={scheduleForm.findings_notes}
                  onChange={(e) =>
                    setScheduleForm({
                      ...scheduleForm,
                      findings_notes: e.target.value,
                    })
                  }
                  placeholder="e.g. Quarterly scheduled check or humidity breach triage..."
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduleSubmitting}
                  className="px-4 py-2 bg-indigo-950 text-white rounded-lg font-medium hover:bg-indigo-900"
                >
                  {scheduleSubmitting ? "Scheduling..." : "Confirm Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
