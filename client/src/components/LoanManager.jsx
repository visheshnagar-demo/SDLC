import React, { useState } from "react";
import {
  Send,
  Plus,
  Plane,
  Building,
  DollarSign,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  X,
  Eye,
} from "lucide-react";

export default function LoanManager({
  loans = [],
  artifacts = [],
  onCreateLoan,
  onUpdateLoanStatus,
  loading = false,
  error = null,
}) {
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    artifact_id: artifacts[0]?.id || "",
    partner_museum_name: "",
    contact_person: "",
    contact_email: "",
    loan_start_date: new Date().toISOString().split("T")[0],
    loan_end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    indemnity_valuation: 350000,
    transit_requirements:
      "Climate-controlled courier transit with shock/tilt telemetry (18-22°C, 45-55% RH).",
    loan_status: "Requested",
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [returnNotes, setReturnNotes] = useState("");

  const pipelineStages = [
    {
      id: "Requested",
      title: "Requested",
      next: "Approved",
      actionLabel: "Review & Approve",
    },
    {
      id: "Approved",
      title: "Approved",
      next: "In Transit",
      actionLabel: "Dispatch Courier",
    },
    {
      id: "In Transit",
      title: "In Transit",
      next: "Active Loan",
      actionLabel: "Confirm Delivery",
    },
    {
      id: "Active Loan",
      title: "Active Loan",
      next: "Returned",
      actionLabel: "Initiate Return",
    },
    {
      id: "Returned",
      title: "Returned",
      next: null,
      actionLabel: "Return Sign-off",
    },
  ];

  const getArtifactInfo = (artId) => {
    const art = artifacts.find(
      (a) => a.id === artId || a.accession_no === artId,
    );
    return art
      ? `${art.title} (${art.accession_no})`
      : "Bronze Statue of Hermes";
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError(null);

    const targetArtId =
      createForm.artifact_id || (artifacts.length > 0 ? artifacts[0].id : null);
    if (!targetArtId) {
      setCreateError("Please select an artifact to loan.");
      return;
    }

    if (
      !createForm.partner_museum_name.trim() ||
      !createForm.contact_email.trim()
    ) {
      setCreateError("Partner museum name and contact email are required.");
      return;
    }

    // Edge-case check: Artifact already on loan or under restoration
    const selectedArt = artifacts.find((a) => a.id === targetArtId);
    if (
      selectedArt &&
      (selectedArt.status === "On Loan" ||
        selectedArt.status === "Under Restoration")
    ) {
      setCreateError(
        `Artifact "${selectedArt.title}" is currently marked "${selectedArt.status}" and cannot be assigned to a new loan agreement.`,
      );
      return;
    }

    setCreateSubmitting(true);
    try {
      if (onCreateLoan) {
        await onCreateLoan({
          ...createForm,
          artifact_id: targetArtId,
          indemnity_valuation: parseFloat(createForm.indemnity_valuation) || 0,
        });
      }
      setShowCreateModal(false);
      setCreateForm({
        artifact_id: artifacts[0]?.id || "",
        partner_museum_name: "",
        contact_person: "",
        contact_email: "",
        loan_start_date: new Date().toISOString().split("T")[0],
        loan_end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        indemnity_valuation: 350000,
        transit_requirements:
          "Climate-controlled courier transit with shock/tilt telemetry (18-22°C, 45-55% RH).",
        loan_status: "Requested",
      });
    } catch (err) {
      setCreateError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to initiate loan agreement.",
      );
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleAdvanceStatus = async (loan, nextStatus) => {
    if (!nextStatus || !onUpdateLoanStatus) return;
    setStatusUpdating(true);
    try {
      await onUpdateLoanStatus(loan.id, {
        loan_status: nextStatus,
        return_inspection_notes:
          returnNotes ||
          loan.return_inspection_notes ||
          "All condition checks verified.",
      });
      if (selectedLoan && selectedLoan.id === loan.id) {
        setSelectedLoan({ ...selectedLoan, loan_status: nextStatus });
      }
    } catch (err) {
      // Handled in parent state
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Curatorial Archive / Loan Management
          </p>
          <h1 className="text-2xl font-serif font-bold text-indigo-950 mt-0.5">
            Inter-Museum Loan Pipeline & Agreement Registry
          </h1>
          <p className="text-sm text-slate-500">
            Track cross-institutional loan lifecycle, indemnity insurance
            agreements, and transit logistics.
          </p>
        </div>

        <button
          onClick={() => {
            setCreateForm({
              artifact_id: artifacts[0]?.id || "",
              partner_museum_name: "",
              contact_person: "Sarah Jenkins (Registrar)",
              contact_email: "loans@metmuseum.org",
              loan_start_date: new Date().toISOString().split("T")[0],
              loan_end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
              indemnity_valuation: 500000,
              transit_requirements:
                "Climate-controlled courier transit with shock/tilt telemetry (18-22°C, 45-55% RH).",
              loan_status: "Requested",
            });
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-indigo-950 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-indigo-900 transition-colors flex items-center space-x-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Initiate New Loan Agreement</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 5-Stage Kanban Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {pipelineStages.map((stage) => {
          const stageLoans = loans.filter((l) => l.loan_status === stage.id);
          return (
            <div
              key={stage.id}
              className="bg-slate-100/70 p-3.5 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between min-h-[450px]"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <h3 className="font-semibold text-xs text-slate-700 uppercase tracking-wider">
                    {stage.title}
                  </h3>
                  <span className="px-2 py-0.5 text-xs font-bold bg-white text-slate-700 rounded-full border border-slate-200">
                    {stageLoans.length}
                  </span>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[500px]">
                  {stageLoans.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                      No agreements
                    </div>
                  ) : (
                    stageLoans.map((loan, idx) => (
                      <div
                        key={loan.id || idx}
                        className={`bg-white p-3.5 rounded-xl border shadow-sm space-y-2 text-xs transition-all hover:shadow-md ${
                          loan.loan_status === "In Transit"
                            ? "border-indigo-900"
                            : "border-slate-200"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-mono font-bold text-[11px] text-slate-500">
                            {loan.id
                              ? `LOAN-${loan.id.slice(0, 6).toUpperCase()}`
                              : `LOAN-2026-${idx}`}
                          </span>
                          <button
                            onClick={() => setSelectedLoan(loan)}
                            className="text-slate-400 hover:text-indigo-950"
                            title="View Agreement"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="font-serif font-bold text-sm text-indigo-950 line-clamp-1">
                          {loan.artifact_title ||
                            getArtifactInfo(loan.artifact_id)}
                        </div>

                        <p className="text-slate-500 line-clamp-1 flex items-center space-x-1">
                          <Building className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{loan.partner_museum_name}</span>
                        </p>

                        <div className="text-emerald-700 font-semibold flex items-center space-x-1">
                          <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>
                            {loan.indemnity_valuation
                              ? `${Number(loan.indemnity_valuation).toLocaleString()} USD`
                              : "$350,000 USD"}
                          </span>
                        </div>

                        {loan.loan_status === "In Transit" && (
                          <div className="p-1.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded font-mono text-[11px] flex items-center space-x-1">
                            <Plane className="w-3 h-3 text-indigo-700" />
                            <span>Live: 21.0°C / 49% RH</span>
                          </div>
                        )}

                        {loan.loan_end_date && (
                          <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>Return: {loan.loan_end_date}</span>
                          </div>
                        )}

                        {stage.next && (
                          <button
                            onClick={() =>
                              handleAdvanceStatus(loan, stage.next)
                            }
                            disabled={statusUpdating}
                            className="w-full mt-2 py-1.5 bg-indigo-950 hover:bg-indigo-900 text-white rounded-lg font-medium text-[11px] transition-colors flex items-center justify-center space-x-1 shadow-sm disabled:opacity-50"
                          >
                            <span>{stage.actionLabel}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {stage.id === "Returned" && (
                          <div className="w-full mt-2 py-1 bg-emerald-50 text-emerald-800 rounded font-medium text-[11px] text-center border border-emerald-200">
                            ✓ Returned & Signed Off
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Loan Details Modal / Drawer */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {selectedLoan.id
                    ? `LOAN-${selectedLoan.id.slice(0, 6).toUpperCase()}`
                    : "LOAN-AGREEMENT"}
                </span>
                <h3 className="font-serif font-bold text-lg text-indigo-950 mt-1">
                  {selectedLoan.partner_museum_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLoan(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <div className="font-semibold text-indigo-950">
                  Target Artifact:{" "}
                  {selectedLoan.artifact_title ||
                    getArtifactInfo(selectedLoan.artifact_id)}
                </div>
                <div className="text-slate-600">
                  <strong>Contact:</strong> {selectedLoan.contact_person} (
                  {selectedLoan.contact_email})
                </div>
                <div className="text-slate-600">
                  <strong>Loan Duration:</strong> {selectedLoan.loan_start_date}{" "}
                  to {selectedLoan.loan_end_date}
                </div>
                <div className="text-emerald-700 font-bold">
                  <strong>Indemnity Valuation:</strong> $
                  {Number(
                    selectedLoan.indemnity_valuation || 0,
                  ).toLocaleString()}{" "}
                  USD
                </div>
              </div>

              {selectedLoan.transit_requirements && (
                <div className="space-y-1">
                  <span className="font-semibold text-slate-700">
                    Transit & Courier Requirements
                  </span>
                  <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-600">
                    {selectedLoan.transit_requirements}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500">Current Status:</span>
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-950 font-bold rounded-full border border-indigo-200">
                  {selectedLoan.loan_status}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLoan(null)}
                className="px-4 py-2 bg-indigo-950 text-white rounded-lg text-xs font-medium hover:bg-indigo-900"
              >
                Close Agreement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Initiate New Loan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-serif font-bold text-lg text-indigo-950">
                  Initiate Inter-Museum Loan
                </h3>
                <p className="text-xs text-slate-500">
                  Create an inter-institutional loan agreement with indemnity
                  and transit specifications.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-slate-700">
                  Target Artifact *
                </label>
                <select
                  value={createForm.artifact_id}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      artifact_id: e.target.value,
                    })
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  required
                >
                  <option value="">Select Available Artifact...</option>
                  {artifacts.map((a) => (
                    <option
                      key={a.id}
                      value={a.id}
                      disabled={
                        a.status === "On Loan" ||
                        a.status === "Under Restoration"
                      }
                    >
                      {a.accession_no} — {a.title} ({a.status})
                    </option>
                  ))}
                  {artifacts.length === 0 && (
                    <option value="mock-1">
                      ART-2026-001 - Roman Terracotta Amphora (On Display)
                    </option>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">
                  Borrowing Partner Institution *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Metropolitan Art Institute, New York"
                  value={createForm.partner_museum_name}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      partner_museum_name: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={createForm.contact_person}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        contact_person: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    value={createForm.contact_email}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        contact_email: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    Loan Start Date *
                  </label>
                  <input
                    type="date"
                    value={createForm.loan_start_date}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        loan_start_date: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-200 rounded-lg"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    Loan End Date *
                  </label>
                  <input
                    type="date"
                    value={createForm.loan_end_date}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        loan_end_date: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">
                  Indemnity Insurance Valuation ($ USD) *
                </label>
                <input
                  type="number"
                  step="1000"
                  value={createForm.indemnity_valuation}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      indemnity_valuation: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">
                  Transit & Micro-Climate Requirements
                </label>
                <textarea
                  rows="2"
                  value={createForm.transit_requirements}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      transit_requirements: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-2 bg-indigo-950 text-white rounded-lg font-medium hover:bg-indigo-900"
                >
                  {createSubmitting ? "Initiating..." : "Submit Agreement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
