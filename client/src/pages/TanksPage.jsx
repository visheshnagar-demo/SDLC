import React, { useState, useEffect } from "react";
import { TankTable } from "../components/tanks/TankTable";
import { fetchTanks, createTank, fetchTankStatus } from "../services/api";
import {
  Container,
  Activity,
  Gauge,
  Thermometer,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

export function TanksPage() {
  const [tanks, setTanks] = useState([]);
  const [selectedTank, setSelectedTank] = useState(null);
  const [tankStatus, setTankStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadTanks = async () => {
    setLoading(true);
    try {
      const data = await fetchTanks();
      setTanks(data);
      if (data.length > 0 && !selectedTank) {
        handleSelectTank(data[0]);
      }
    } catch (err) {
      console.error("Failed to load tanks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTanks();
  }, []);

  const handleSelectTank = async (tank) => {
    setSelectedTank(tank);
    try {
      const statusData = await fetchTankStatus(tank.id);
      setTankStatus(statusData);
    } catch (err) {
      console.error("Failed to fetch tank status:", err);
    }
  };

  const handleRegisterTank = async (newTank) => {
    const created = await createTank(newTank);
    await loadTanks();
    if (created && created.id) {
      handleSelectTank(created);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Storage Tank Inventory & Telemetry Control
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track tank volumes, intake/outflow rates, head pressure, and
            automated overflow valves.
          </p>
        </div>

        <button
          onClick={loadTanks}
          className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Selected Tank Live Inspection Detail Card */}
      {selectedTank && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-2">
            <div className="flex items-center space-x-3">
              <div className="bg-sky-500/10 p-3 rounded-xl border border-sky-500/20 text-sky-400">
                <Container className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {selectedTank.name}
                </h2>
                <p className="text-xs text-slate-400">
                  {selectedTank.location} &bull; ID: {selectedTank.id}
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 self-start sm:self-auto">
              Real-time Ingestion Active
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-xs">
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
              <div className="flex items-center space-x-2 text-slate-400 mb-1">
                <Gauge className="w-4 h-4 text-sky-400" />
                <span>Head Pressure</span>
              </div>
              <p className="text-xl font-bold text-white font-mono">
                {tankStatus?.head_pressure_psi
                  ? `${tankStatus.head_pressure_psi} PSI`
                  : "14.5 PSI"}
              </p>
            </div>

            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
              <div className="flex items-center space-x-2 text-slate-400 mb-1">
                <Thermometer className="w-4 h-4 text-amber-400" />
                <span>Water Temp</span>
              </div>
              <p className="text-xl font-bold text-white font-mono">
                {tankStatus?.water_temp_c
                  ? `${tankStatus.water_temp_c} °C`
                  : "18.2 °C"}
              </p>
            </div>

            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
              <div className="flex items-center space-x-2 text-slate-400 mb-1">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Flow Rate</span>
              </div>
              <p className="text-xl font-bold text-white font-mono">
                {selectedTank.net_flow_rate_lpm} L/min
              </p>
            </div>

            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
              <div className="flex items-center space-x-2 text-slate-400 mb-1">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Distribution Status</span>
              </div>
              <p className="text-sm font-bold text-emerald-400 mt-1">
                Pump engaged (Irrigation / Cooling)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tank Inventory Table Component */}
      <TankTable
        tanks={tanks}
        onRegisterTank={handleRegisterTank}
        onSelectTank={handleSelectTank}
      />
    </div>
  );
}

export default TanksPage;
