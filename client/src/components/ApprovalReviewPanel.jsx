import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from "lucide-react";

export default function ApprovalReviewPanel({
  scenario,
  evaluation,
  onSubmit,
  submitting,
  submitError,
}) {
  const [overrideComments, setOverrideComments] = useState("");
  const [showOverrideInput, setShowOverrideInput] = useState(false);

  const skuActions = evaluation?.sku_actions_summary ||
    scenario?.sku_actions_summary || {
      GROW: 4,
      MAINTAIN: 12,
      SWAP: 3,
      REDUCE: 2,
    };

  const totalActions = Object.values(skuActions).reduce(
    (a, b) => a + Number(b),
    0,
  );

  const guardrails = evaluation?.guardrails || [
    {
      name: "Private Brand Share ≥ 25.0%",
      passed: true,
      actual_value: `${scenario?.projected_private_brand_share_pct || 29.5}%`,
    },
    {
      name: "Space Displacement ≤ 10.0%",
      passed: true,
      actual_value: `${scenario?.shelf_space_impact_pct || 3.5}%`,
    },
  ];

  const hasFailedGuardrails = guardrails.some((g) => !g.passed);
  const canSubmit = evaluation ? evaluation.can_submit : !hasFailedGuardrails;

  const handleSubmitClick = () => {
    if (hasFailedGuardrails && !overrideComments.trim()) {
      setShowOverrideInput(true);
      return;
    }
    onSubmit({
      scenario_code: scenario.code,
      override_comments: overrideComments.trim() || null,
    });
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
          <h2 className="text-base font-bold text-slate-900">
            Approval Review Panel
          </h2>
          <ShieldCheck className="w-4 h-4 text-slate-400" />
        </div>

        {/* Active Scenario Card */}
        <div className="bg-slate-50 p-3 rounded border border-slate-200 mb-3">
          <div className="text-xs font-semibold text-slate-500">
            Active Scenario
          </div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">
            {scenario
              ? `${scenario.title} Strategy (${totalActions} SKUs)`
              : "Loading..."}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
              {skuActions.GROW || 0} GROW
            </span>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
              {skuActions.MAINTAIN || 0} MAINTAIN
            </span>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
              {skuActions.SWAP || 0} SWAP
            </span>
            <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded">
              {skuActions.REDUCE || 0} REDUCE
            </span>
          </div>
        </div>

        {/* Guardrail Checks */}
        <div className="space-y-2 mb-4">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Guardrail Compliance Checks
          </div>
          {guardrails.map((g, idx) => (
            <div
              key={idx}
              className={`flex justify-between items-center text-xs p-2 rounded border ${
                g.passed
                  ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                  : "bg-amber-50 text-amber-900 border-amber-300"
              }`}
            >
              <div className="flex items-center gap-1.5">
                {g.passed ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>{g.name}</span>
              </div>
              <span className="font-bold font-mono">
                {g.actual_value} ({g.passed ? "PASS ✓" : "FAIL ✗"})
              </span>
            </div>
          ))}
        </div>

        {/* Override comments if guardrail fails */}
        {hasFailedGuardrails && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded">
            <div className="text-xs font-bold text-amber-900 mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Guardrail Warning Override Required
            </div>
            <p className="text-[11px] text-amber-800 mb-2">
              One or more guardrail checks did not pass. Enter justification
              comments to submit this scenario.
            </p>
            <textarea
              value={overrideComments}
              onChange={(e) => setOverrideComments(e.target.value)}
              placeholder="Provide reason for guardrail override (mandatory)..."
              rows={2}
              className="w-full text-xs border border-amber-300 rounded p-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        )}

        {submitError && (
          <div className="mb-3 bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded">
            <div className="font-semibold">Submission Failed</div>
            <div>{submitError}</div>
          </div>
        )}
      </div>

      <button
        onClick={handleSubmitClick}
        disabled={
          submitting || (hasFailedGuardrails && !overrideComments.trim())
        }
        className={`w-full font-bold py-2.5 px-4 rounded shadow text-sm transition-colors flex items-center justify-center gap-2 mt-4 ${
          submitting || (hasFailedGuardrails && !overrideComments.trim())
            ? "bg-slate-300 text-slate-500 cursor-not-allowed"
            : "bg-[#E5B800] hover:bg-amber-400 text-slate-950 active:bg-amber-500"
        }`}
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Submitting Plan...</span>
          </>
        ) : (
          <>
            <span>Submit Assortment Plan</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}

ApprovalReviewPanel.propTypes = {
  scenario: PropTypes.shape({
    code: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    projected_sales_growth_pct: PropTypes.number,
    projected_private_brand_share_pct: PropTypes.number,
    shelf_space_impact_pct: PropTypes.number,
    sku_actions_summary: PropTypes.object,
  }),
  evaluation: PropTypes.shape({
    scenario_code: PropTypes.string,
    sku_actions_summary: PropTypes.object,
    guardrails: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        passed: PropTypes.bool.isRequired,
        actual_value: PropTypes.string.isRequired,
      }),
    ),
    can_submit: PropTypes.bool,
  }),
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  submitError: PropTypes.string,
};
