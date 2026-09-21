import React, { useState, useEffect } from "react";
import { StatCard } from "../components/dashboard/StatCard";
import { TankGaugeCard } from "../components/dashboard/TankGaugeCard";
import {
  fetchTanks,
  fetchWaterQuality,
  fetchAlerts,
  postTelemetry,
} from "../services/api";
import {
  Container,
  Activity,
  CloudRain,
  AlertTriangle,
  Send,
  RefreshCw,
} from "lucide-react";

export function DashboardPage() {
  const [tanks, setTanks] = useState([]);
  const [quality, setQuality] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [telemetryModal, setTelemetryModal] = useState(false);
  const [telemetryForm, setTelemetryForm] = useState({
    tank_id: "tank-a",
    water_level_liters: 7600,
    flow_rate_lpm: 125,
    ph_level: 7.2,
    turbidity_ntu: 1.4,
    tds_ppm: 145,
  });
  const [ingestMsg, setIngestMsg] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tanksData, qualityData, alertsData] = await Promise.all([
        fetchTanks(),
        fetchWaterQuality(),
        fetchAlerts(),
      ]);
      setTanks(tanksData);
      setQuality(qualityData);
      setAlerts(alertsData);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalCapacity = tanks.reduce(
    (acc, t) => acc + (t.total_capacity_liters || 0),
    0,
  );
  const totalVolume = tanks.reduce(
    (acc, t) => acc + (t.current_volume_liters || 0),
    0,
  );
  const overallFillPct =
    totalCapacity > 0 ? Math.round((totalVolume / totalCapacity) * 100) : 0;
  const unacknowledgedAlerts = alerts.filter((a) => !a.is_acknowledged).length;

  const handleIngestTelemetry = async (e) => {
    e.preventDefault();
    setIngestMsg(null);
    try {
      await postTelemetry({
        ...telemetryForm,
        water_level_liters: Number(telemetryForm.water_level_liters),
        flow_rate_lpm: Number(telemetryForm.flow_rate_lpm),
        ph_level: Number(telemetryForm.ph_level),
        turbidity_ntu: Number(telemetryForm.turbidity_ntu),
        tds_ppm: Number(telemetryForm.tds_ppm),
      });
      setIngestMsg({
        type: "success",
        text: "Telemetry successfully ingested! Sensor logs updated.",
      });
      loadData();
      setTelemetryModal(false);
    } catch (err) {
      setIngestMsg({
        type: "error",
        text: err?.response?.data?.detail || "Telemetry ingestion failed.",
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Rainwater Harvesting Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time storage telemetry, filtration quality metrics, and
            automated yield distribution.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setTelemetryModal(true)}
            className="flex items-center space-x-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow"
          >
            <Send className="w-4 h-4" />
            <span>Ingest Telemetry</span>
          </button>

          <button
            onClick={loadData}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors"
            title="Refresh System Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {ingestMsg && (
        <div
          className={`p-3 rounded-lg text-xs font-medium ${
            ingestMsg.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
          }`}
        >
          {ingestMsg.text}
        </div>
      )}

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Harvested Storage"
          value={totalVolume.toLocaleString()}
          unit={`/ ${totalCapacity.toLocaleString()} L`}
          icon={Container}
          status="info"
          progress={overallFillPct}
          description={`${overallFillPct}% Total Facility Capacity`}
        />

        <StatCard
          title="Water Quality Index"
          value={quality.ph_level ? `${quality.ph_level} pH` : "7.2 pH"}
          unit={
            quality.turbidity_ntu ? `${quality.turbidity_ntu} NTU` : "1.4 NTU"
          }
          icon={Activity}
          status={quality.pass_status ? "success" : "error"}
          description={
            quality.pass_status
              ? "Passes Non-Potable Spec"
              : "Diversion Valve Active"
          }
        />

        <StatCard
          title="Catchment Yield (Forecast)"
          value="11,250"
          unit="L"
          icon={CloudRain}
          status="info"
          trend="+12% Rain Event"
          description="500 m² Rooftop @ 25mm Rainfall"
        />

        <StatCard
          title="Active System Alerts"
          value={unacknowledgedAlerts.toString()}
          unit="Active"
          icon={AlertTriangle}
          status={unacknowledgedAlerts > 0 ? "warning" : "success"}
          description={
            unacknowledgedAlerts > 0 ? "Requires Action" : "All Systems Nominal"
          }
        />
      </div>

      {/* Tanks Inventory Gauge Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white tracking-tight">
            Storage Tank Telemetry
          </h2>
          <span className="text-xs text-slate-400">
            {tanks.length} Connected Storage Units
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tanks.map((tank) => (
            <TankGaugeCard key={tank.id} tank={tank} />
          ))}
        </div>
      </div>

      {/* Telemetry Simulation Modal */}
      {telemetryModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md text-slate-200 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              Simulate Raw Sensor Telemetry Payload
            </h3>
            <form onSubmit={handleIngestTelemetry} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Storage Tank
                </label>
                <select
                  value={telemetryForm.tank_id}
                  onChange={(e) =>
                    setTelemetryForm({
                      ...telemetryForm,
                      tank_id: e.target.value,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {tanks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Water Level (Liters)
                  </label>
                  <input
                    type="number"
                    value={telemetryForm.water_level_liters}
                    onChange={(e) =>
                      setTelemetryForm({
                        ...telemetryForm,
                        water_level_liters: e.target.value,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Flow Rate (L/min)
                  </label>
                  <input
                    type="number"
                    value={telemetryForm.flow_rate_lpm}
                    onChange={(e) =>
                      setTelemetryForm({
                        ...telemetryForm,
                        flow_rate_lpm: e.target.value,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    pH
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={telemetryForm.ph_level}
                    onChange={(e) =>
                      setTelemetryForm({
                        ...telemetryForm,
                        ph_level: e.target.value,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Turbidity (NTU)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={telemetryForm.turbidity_ntu}
                    onChange={(e) =>
                      setTelemetryForm({
                        ...telemetryForm,
                        turbidity_ntu: e.target.value,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    TDS (PPM)
                  </label>
                  <input
                    type="number"
                    value={telemetryForm.tds_ppm}
                    onChange={(e) =>
                      setTelemetryForm({
                        ...telemetryForm,
                        tds_ppm: e.target.value,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTelemetryModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow"
                >
                  Post Telemetry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
