import React, { useState, useEffect } from "react";
import { QualityMetrics } from "../components/quality/QualityMetrics";
import { fetchWaterQuality, triggerBackwash } from "../services/api";
import { Activity, ShieldCheck, RefreshCw, Layers } from "lucide-react";

export function QualityPage() {
  const [quality, setQuality] = useState({});
  const [loading, setLoading] = useState(true);

  const loadQuality = async () => {
    setLoading(true);
    try {
      const data = await fetchWaterQuality();
      setQuality(data);
    } catch (err) {
      console.error("Failed to load quality metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuality();
  }, []);

  const handleTriggerBackwash = async (payload) => {
    await triggerBackwash(payload);
    await loadQuality();
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Water Quality & Filtration Assurance
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated post-filtration sensor monitoring (pH, turbidity, TDS) and
            automated filter backwash cycles.
          </p>
        </div>

        <button
          onClick={loadQuality}
          className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Quality Metrics Control Panel */}
      <QualityMetrics
        qualityData={quality}
        onTriggerBackwash={handleTriggerBackwash}
      />

      {/* Historical Sensor Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <Layers className="w-5 h-5 text-sky-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Recent Water Quality & Backwash Logs
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Log Timestamp</th>
                <th className="py-3 px-4">pH Level</th>
                <th className="py-3 px-4">Turbidity (NTU)</th>
                <th className="py-3 px-4">TDS (PPM)</th>
                <th className="py-3 px-4">Compliance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-xs">
              {(
                quality.history || [
                  { timestamp: "10:00 AM", ph: 7.1, turbidity: 1.2, tds: 140 },
                  { timestamp: "11:00 AM", ph: 7.3, turbidity: 1.5, tds: 148 },
                  { timestamp: "12:00 PM", ph: 7.2, turbidity: 1.4, tds: 145 },
                  { timestamp: "01:00 PM", ph: 6.9, turbidity: 1.8, tds: 152 },
                  { timestamp: "02:00 PM", ph: 7.2, turbidity: 1.4, tds: 145 },
                ]
              ).map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-800/50">
                  <td className="py-3 px-4 text-white font-sans">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-4 font-bold text-sky-400">
                    {log.ph} pH
                  </td>
                  <td className="py-3 px-4 text-slate-200">
                    {log.turbidity} NTU
                  </td>
                  <td className="py-3 px-4 text-slate-200">{log.tds} PPM</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      PASSED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default QualityPage;
