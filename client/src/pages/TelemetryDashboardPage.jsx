import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Activity,
  Radio,
  RefreshCw,
  Droplet,
  Thermometer,
  Wind,
  Biohazard,
} from "lucide-react";
import {
  getTanks,
  getLatestTelemetry,
  getTelemetryHistory,
  getAlerts,
} from "../services/api";
import MetricCard from "../components/telemetry/MetricCard";
import TelemetryChart from "../components/telemetry/TelemetryChart";
import TankMatrix from "../components/telemetry/TankMatrix";
import TelemetryIngestModal from "../components/telemetry/TelemetryIngestModal";
import AlertBanner from "../components/alerts/AlertBanner";

export default function TelemetryDashboardPage() {
  const context = useOutletContext();
  const refreshAlertsContext = context?.refreshAlerts;

  const [tanks, setTanks] = useState([]);
  const [selectedTankId, setSelectedTankId] = useState("");
  const [latestData, setLatestData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [error, setError] = useState(null);

  const loadTanksAndAlerts = useCallback(async () => {
    try {
      const [tankList, alertList] = await Promise.all([
        getTanks(),
        getAlerts({ status: "ACTIVE" }),
      ]);
      const validTanks = Array.isArray(tankList) ? tankList : [];
      setTanks(validTanks);
      setActiveAlerts(Array.isArray(alertList) ? alertList : []);

      if (validTanks.length > 0 && !selectedTankId) {
        setSelectedTankId(validTanks[0].id);
      }
    } catch {
      setError(
        "Unable to reach telemetry backend. Please ensure server is running.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedTankId]);

  const loadTankTelemetry = useCallback(async (tankId) => {
    if (!tankId) return;
    setIsRefreshing(true);
    try {
      const [latest, history] = await Promise.all([
        getLatestTelemetry(tankId),
        getTelemetryHistory({ tank_id: tankId, limit: 30 }),
      ]);
      setLatestData(latest);
      setHistoryData(Array.isArray(history) ? history.reverse() : []);
      setError(null);
    } catch {
      // Don't wipe current data on transient error
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTanksAndAlerts();
  }, [loadTanksAndAlerts]);

  useEffect(() => {
    if (selectedTankId) {
      loadTankTelemetry(selectedTankId);
      const interval = setInterval(() => {
        loadTankTelemetry(selectedTankId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedTankId, loadTankTelemetry]);

  const handleTankCreated = (newTank) => {
    setTanks((prev) => [...prev, newTank]);
    setSelectedTankId(newTank.id);
  };

  const handleTelemetryIngested = (result) => {
    loadTankTelemetry(selectedTankId);
    if (refreshAlertsContext) refreshAlertsContext();
    getAlerts({ status: "ACTIVE" }).then((alerts) => {
      if (Array.isArray(alerts)) setActiveAlerts(alerts);
    });
  };

  const currentReading = latestData?.reading || {};
  const currentTank = tanks.find((t) => t.id === selectedTankId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Alert Banner */}
      <AlertBanner alerts={activeAlerts} />

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1e2e45]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-mono text-[#00e5ff] tracking-tight">
              Live Telemetry & Tank Monitor
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-[#141c27] text-[#bac9cc] border border-[#1e2e45]">
              {currentTank ? currentTank.name : "No Tank Selected"}
            </span>
          </div>
          <p className="text-xs text-[#bac9cc] font-mono mt-1">
            Real-time multi-sensor telemetry stream with automated threshold
            safety evaluation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadTankTelemetry(selectedTankId)}
            disabled={isRefreshing || !selectedTankId}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#141c27] hover:bg-[#1e2e45] text-[#bac9cc] hover:text-[#dbe3f3] text-xs font-mono border border-[#1e2e45] transition-all disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#00e5ff]" : ""}`}
            />
            <span>Sync</span>
          </button>

          <button
            type="button"
            onClick={() => setShowIngestModal(true)}
            disabled={tanks.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-[#070c13] text-xs font-bold font-mono transition-all disabled:opacity-50"
          >
            <Radio className="w-4 h-4" />
            <span>Transmit Sensor Data</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#4c0519]/40 border border-[#fb7185] text-[#fb7185] text-xs font-mono">
          {error}
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="pH Level"
          value={
            currentReading.ph_level !== undefined
              ? currentReading.ph_level.toFixed(2)
              : "--"
          }
          unit="pH"
          status={latestData?.ph_status || "SAFE"}
          safeRange="6.8 - 7.8 pH"
          icon={Droplet}
        />
        <MetricCard
          title="Dissolved Oxygen"
          value={
            currentReading.dissolved_oxygen !== undefined
              ? currentReading.dissolved_oxygen.toFixed(2)
              : "--"
          }
          unit="mg/L"
          status={latestData?.oxygen_status || "SAFE"}
          safeRange="> 6.0 mg/L"
          icon={Wind}
        />
        <MetricCard
          title="Temperature"
          value={
            currentReading.temperature_c !== undefined
              ? currentReading.temperature_c.toFixed(1)
              : "--"
          }
          unit="°C"
          status={latestData?.temperature_status || "SAFE"}
          safeRange="24.0 - 26.5 °C"
          icon={Thermometer}
        />
        <MetricCard
          title="Ammonia (NH3)"
          value={
            currentReading.ammonia_ppm !== undefined
              ? currentReading.ammonia_ppm.toFixed(3)
              : "--"
          }
          unit="ppm"
          status={latestData?.ammonia_status || "SAFE"}
          safeRange="< 0.05 ppm"
          icon={Biohazard}
        />
      </div>

      {/* 24-Hour Analytics Chart */}
      <TelemetryChart telemetryData={historyData} />

      {/* Monitored Tank Matrix */}
      <TankMatrix
        tanks={tanks}
        selectedTankId={selectedTankId}
        onSelectTank={setSelectedTankId}
        onTankCreated={handleTankCreated}
      />

      {/* Sensor Ingest Modal */}
      <TelemetryIngestModal
        isOpen={showIngestModal}
        onClose={() => setShowIngestModal(false)}
        tankId={selectedTankId}
        tanks={tanks}
        onIngested={handleTelemetryIngested}
      />
    </div>
  );
}
