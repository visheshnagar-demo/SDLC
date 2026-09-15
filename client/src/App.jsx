import React, { useState, useEffect, useCallback } from "react";
import KPIHeaderStrip from "./components/KPIHeaderStrip.jsx";
import SKUPerformanceTable from "./components/SKUPerformanceTable.jsx";
import ScenarioSelector from "./components/ScenarioSelector.jsx";
import ApprovalReviewPanel from "./components/ApprovalReviewPanel.jsx";
import InlineAuditBanner from "./components/InlineAuditBanner.jsx";
import {
  getKPIs,
  getSKUs,
  getScenarios,
  evaluateScenario,
  submitApproval,
} from "./services/api.js";

export default function App() {
  const [kpis, setKpis] = useState(null);
  const [kpisLoading, setKpisLoading] = useState(true);
  const [kpisError, setKpisError] = useState(null);

  const [skus, setSkus] = useState([]);
  const [skusLoading, setSkusLoading] = useState(true);
  const [skusError, setSkusError] = useState(null);

  const [scenarios, setScenarios] = useState([]);
  const [scenariosLoading, setScenariosLoading] = useState(true);
  const [scenariosError, setScenariosError] = useState(null);

  const [selectedScenarioCode, setSelectedScenarioCode] = useState("BALANCED");
  const [evaluation, setEvaluation] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [auditData, setAuditData] = useState(null);

  // 1. Fetch initial data on mount
  useEffect(() => {
    const fetchData = async () => {
      // Fetch KPIs
      try {
        setKpisLoading(true);
        const kpiRes = await getKPIs();
        setKpis(kpiRes);
      } catch (err) {
        setKpisError("Failed to load store cluster KPIs.");
      } finally {
        setKpisLoading(false);
      }

      // Fetch SKUs
      try {
        setSkusLoading(true);
        const skuRes = await getSKUs();
        setSkus(skuRes);
      } catch (err) {
        setSkusError("Failed to load Snacks SKU performance list.");
      } finally {
        setSkusLoading(false);
      }

      // Fetch Scenarios
      try {
        setScenariosLoading(true);
        const scenarioRes = await getScenarios();
        setScenarios(scenarioRes);
        const defaultScen =
          scenarioRes.find((s) => s.is_default) || scenarioRes[0];
        if (defaultScen) {
          setSelectedScenarioCode(defaultScen.code);
        }
      } catch (err) {
        setScenariosError("Failed to load strategy scenarios.");
      } finally {
        setScenariosLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2. Evaluate active scenario whenever selection changes
  const runEvaluation = useCallback(async (code) => {
    try {
      setEvaluating(true);
      const evalRes = await evaluateScenario(code);
      setEvaluation(evalRes);
    } catch (err) {
      // Non-blocking evaluation fallback
    } finally {
      setEvaluating(false);
    }
  }, []);

  useEffect(() => {
    if (selectedScenarioCode) {
      runEvaluation(selectedScenarioCode);
    }
  }, [selectedScenarioCode, runEvaluation]);

  const handleSelectScenario = (code) => {
    setSelectedScenarioCode(code);
    setSubmitError(null);
  };

  const handleSubmit = async (submitPayload) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await submitApproval(submitPayload);
      setAuditData(response);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Submission failed. Please check your network and retry.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const activeScenario = scenarios.find(
    (s) => s.code === selectedScenarioCode,
  ) || {
    code: "BALANCED",
    title: "Balanced",
    description: "Optimal margin & private brand expansion.",
    projected_sales_growth_pct: 4.2,
    projected_private_brand_share_pct: 29.5,
    shelf_space_impact_pct: 3.5,
    sku_actions_summary: { GROW: 4, MAINTAIN: 12, SWAP: 3, REDUCE: 2 },
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Navigation */}
        <header className="bg-slate-900 text-white rounded-lg p-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-slate-800 shadow-md">
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-[#E5B800] text-slate-950 font-black px-3 py-1 rounded text-lg tracking-wide shadow-sm">
              DG
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold leading-tight">
                Dollar General — Cluster Assortment Advisor
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-0.5 rounded-full border border-slate-700">
                  Small Town Value Cluster • 1,240 Stores
                </span>
                <span className="text-slate-400 text-xs hidden sm:inline">
                  Category: Snacks
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
            <span className="text-xs sm:text-sm text-slate-300">
              Manager: <strong className="text-white">MGR-8842</strong>
            </span>
            <button
              onClick={() =>
                alert(
                  "Planogram (POG) export generated for Small Town Value Cluster.",
                )
              }
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded border border-slate-700 font-medium transition-colors"
            >
              Export POG
            </button>
          </div>
        </header>

        {/* Inline Audit Confirmation Banner */}
        <InlineAuditBanner
          auditData={auditData}
          onDismiss={() => setAuditData(null)}
        />

        {/* KPI Header Strip */}
        <KPIHeaderStrip kpis={kpis} loading={kpisLoading} error={kpisError} />

        {/* SKU Performance Table Section */}
        <SKUPerformanceTable
          skus={skus}
          loading={skusLoading}
          error={skusError}
        />

        {/* Scenarios & Approval Panel Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <ScenarioSelector
            scenarios={scenarios}
            selectedScenarioCode={selectedScenarioCode}
            onSelectScenario={handleSelectScenario}
            loading={scenariosLoading}
            error={scenariosError}
          />

          <ApprovalReviewPanel
            scenario={activeScenario}
            evaluation={evaluation}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitError={submitError}
          />
        </div>
      </div>
    </div>
  );
}
