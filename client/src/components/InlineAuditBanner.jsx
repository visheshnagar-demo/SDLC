import React, { useState } from "react";
import PropTypes from "prop-types";
import { CheckCircle2, X, FileText } from "lucide-react";

export default function InlineAuditBanner({ auditData, onDismiss }) {
  const [showModal, setShowModal] = useState(false);

  if (!auditData) return null;

  const formattedDate = auditData.submitted_at
    ? new Date(auditData.submitted_at).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : new Date().toLocaleDateString("en-US");

  return (
    <>
      <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-start sm:items-center gap-3">
          <div className="bg-emerald-500 text-white rounded-full p-1.5 mt-0.5 sm:mt-0 flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-emerald-950 flex flex-wrap items-center gap-2">
              <span>Plan Approved & Staged for POG Distribution</span>
              <span className="bg-emerald-200 text-emerald-900 text-xs font-mono px-2 py-0.5 rounded">
                Audit ID: {auditData.audit_id || "AUD-20260518-001"}
              </span>
            </div>
            <p className="text-xs text-emerald-700 mt-0.5">
              Submitted {formattedDate} • Manager:{" "}
              {auditData.manager_id || "MGR-8842"} •{" "}
              {auditData.total_sku_actions || 21} SKU actions queued for Small
              Town Value Cluster
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setShowModal(true)}
            className="text-xs font-semibold text-emerald-800 underline hover:text-emerald-950 px-2 py-1"
          >
            View Certificate
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-emerald-700 hover:text-emerald-950 p-1 rounded hover:bg-emerald-100"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Certificate Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <FileText className="w-5 h-5 text-[#E5B800]" />
                <span>Assortment Plan Audit Certificate</span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs text-slate-700">
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1.5 font-mono">
                <div>
                  <span className="text-slate-400">Audit ID:</span>{" "}
                  {auditData.audit_id}
                </div>
                <div>
                  <span className="text-slate-400">Timestamp:</span>{" "}
                  {formattedDate}
                </div>
                <div>
                  <span className="text-slate-400">Manager:</span>{" "}
                  {auditData.manager_id}
                </div>
                <div>
                  <span className="text-slate-400">Scenario Applied:</span>{" "}
                  {auditData.scenario_applied}
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>{" "}
                  {auditData.status || "APPROVED"}
                </div>
              </div>

              {auditData.guardrails && auditData.guardrails.length > 0 && (
                <div>
                  <div className="font-bold text-slate-800 mb-1.5">
                    Guardrail Verification
                  </div>
                  <div className="space-y-1">
                    {auditData.guardrails.map((g, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center bg-emerald-50 text-emerald-900 p-2 rounded border border-emerald-200"
                      >
                        <span>{g.name}</span>
                        <span className="font-bold">
                          {g.actual_value} (PASS)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="bg-slate-900 text-white px-4 py-2 rounded text-xs font-semibold hover:bg-slate-800"
              >
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

InlineAuditBanner.propTypes = {
  auditData: PropTypes.shape({
    audit_id: PropTypes.string,
    submitted_at: PropTypes.string,
    manager_id: PropTypes.string,
    scenario_applied: PropTypes.string,
    total_sku_actions: PropTypes.number,
    guardrails: PropTypes.array,
    status: PropTypes.string,
    message: PropTypes.string,
  }),
  onDismiss: PropTypes.func,
};
