import React, { useState, useEffect, useCallback } from "react";
import {
  HeartPulse,
  Wrench,
  ShieldAlert,
  Plus,
  Layers,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { getTanks, getHealthRecords, getEquipment } from "../services/api";
import FishHealthTable from "../components/health/FishHealthTable";
import HealthRecordModal from "../components/health/HealthRecordModal";
import QuarantineBanner from "../components/health/QuarantineBanner";
import EquipmentCard from "../components/equipment/EquipmentCard";
import EquipmentModal from "../components/equipment/EquipmentModal";
import MaintenanceLogModal from "../components/equipment/MaintenanceLogModal";

export default function HealthEquipmentPage() {
  const [tanks, setTanks] = useState([]);
  const [selectedTankId, setSelectedTankId] = useState("");
  const [healthRecords, setHealthRecords] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [selectedEquipmentForMaintenance, setSelectedEquipmentForMaintenance] =
    useState(null);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [tankList, records, equipment] = await Promise.all([
        getTanks(),
        getHealthRecords(selectedTankId ? { tank_id: selectedTankId } : {}),
        getEquipment(selectedTankId ? { tank_id: selectedTankId } : {}),
      ]);
      setTanks(Array.isArray(tankList) ? tankList : []);
      setHealthRecords(Array.isArray(records) ? records : []);
      setEquipmentList(Array.isArray(equipment) ? equipment : []);

      if (Array.isArray(tankList) && tankList.length > 0 && !selectedTankId) {
        setSelectedTankId(tankList[0].id);
      }
    } catch {
      setError("Failed to fetch fish health and equipment data.");
    }
  }, [selectedTankId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Aggregate stats
  const totalBiota = healthRecords.reduce(
    (sum, r) => sum + (parseInt(r.population_count, 10) || 0),
    0,
  );
  const quarantinedRecords = healthRecords.filter((r) => r.is_quarantined);
  const quarantinedCount = quarantinedRecords.reduce(
    (sum, r) => sum + (parseInt(r.population_count, 10) || 0),
    0,
  );
  const overdueEquipment = equipmentList.filter(
    (e) =>
      e.status?.toUpperCase() === "OVERDUE" ||
      (e.next_due_at && new Date(e.next_due_at) < new Date()),
  );
  const nextServiceItem = equipmentList
    .slice()
    .sort(
      (a, b) => new Date(a.next_due_at || 0) - new Date(b.next_due_at || 0),
    )[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1e2e45]">
        <div>
          <h1 className="text-2xl font-bold font-mono text-[#00e5ff] tracking-tight flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-[#00e5ff]" />
            <span>Biota Health & Equipment Lifecycle Hub</span>
          </h1>
          <p className="text-xs text-[#bac9cc] font-mono mt-1">
            Monitor fish population welfare, medical observations, and
            life-support hardware servicing intervals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-mono text-[#bac9cc]">
            Filter Tank:
          </label>
          <select
            value={selectedTankId}
            onChange={(e) => setSelectedTankId(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#141c27] border border-[#1e2e45] text-[#dbe3f3] text-xs font-mono focus:border-[#00e5ff] focus:outline-none"
          >
            <option value="">All Monitored Tanks</option>
            {tanks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[#4c0519]/50 border border-[#fb7185] text-[#fb7185] text-xs font-mono">
          {error}
        </div>
      )}

      {/* 4 Summary Cards (from Figma Screen 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-4 rounded-xl bg-[#141c27] border border-[#1e2e45] flex items-center justify-between">
          <div>
            <div className="text-xs text-[#bac9cc] uppercase">TOTAL BIOTA</div>
            <div className="text-3xl font-bold text-[#c3f5ff] mt-1">
              {totalBiota} Specimens
            </div>
          </div>
          <Layers className="w-8 h-8 text-[#00e5ff]/40" />
        </div>

        <div className="p-4 rounded-xl bg-[#141c27] border border-[#1e2e45] flex items-center justify-between">
          <div>
            <div className="text-xs text-[#fbbf24] uppercase">
              QUARANTINE ISOLATION
            </div>
            <div className="text-3xl font-bold text-[#fbbf24] mt-1">
              {quarantinedCount} Isolated
            </div>
          </div>
          <ShieldAlert className="w-8 h-8 text-[#fbbf24]/40" />
        </div>

        <div className="p-4 rounded-xl bg-[#141c27] border border-[#1e2e45] flex items-center justify-between">
          <div>
            <div className="text-xs text-[#34d399] uppercase">
              EQUIPMENT ASSETS
            </div>
            <div className="text-3xl font-bold text-[#68dba9] mt-1">
              {equipmentList.length} Units
            </div>
          </div>
          <Wrench className="w-8 h-8 text-[#34d399]/40" />
        </div>

        <div className="p-4 rounded-xl bg-[#141c27] border border-[#1e2e45] flex items-center justify-between">
          <div>
            <div className="text-xs text-[#fb7185] uppercase">
              NEXT SERVICE DUE
            </div>
            <div className="text-sm font-bold text-[#ffb4ab] mt-1 truncate max-w-[150px]">
              {nextServiceItem ? `${nextServiceItem.name}` : "All Up to Date"}
            </div>
          </div>
          <Clock className="w-8 h-8 text-[#fb7185]/40" />
        </div>
      </div>

      {/* Quarantine Banner if any specimens are quarantined */}
      <QuarantineBanner
        quarantinedCount={quarantinedCount}
        quarantinedRecords={quarantinedRecords}
      />

      {/* Fish Population Health Table */}
      <FishHealthTable
        records={healthRecords}
        onAddRecord={() => setShowHealthModal(true)}
      />

      {/* Equipment Maintenance Lifecycle */}
      <div className="p-6 rounded-xl bg-[#141c27] border border-[#1e2e45] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#00e5ff]" />
            <h2 className="text-base font-bold font-mono text-[#00e5ff]">
              Life-Support Equipment Maintenance Lifecycle
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowEquipmentModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0c141f] hover:bg-[#1e2e45] text-[#00e5ff] text-xs font-mono font-semibold border border-[#00e5ff]/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register Asset</span>
          </button>
        </div>

        {equipmentList.length === 0 ? (
          <div className="p-8 rounded-lg bg-[#0c141f] border border-dashed border-[#1e2e45] text-center text-xs font-mono text-[#bac9cc]">
            No equipment assets registered. Click "Register Asset" to track
            filters, pumps, aerators, and heaters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipmentList.map((item) => (
              <EquipmentCard
                key={item.id}
                equipment={item}
                onLogMaintenance={(eq) =>
                  setSelectedEquipmentForMaintenance(eq)
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <HealthRecordModal
        isOpen={showHealthModal}
        onClose={() => setShowHealthModal(false)}
        tankId={selectedTankId}
        tanks={tanks}
        onRecordCreated={loadData}
      />

      <EquipmentModal
        isOpen={showEquipmentModal}
        onClose={() => setShowEquipmentModal(false)}
        tankId={selectedTankId}
        tanks={tanks}
        onEquipmentCreated={loadData}
      />

      <MaintenanceLogModal
        isOpen={Boolean(selectedEquipmentForMaintenance)}
        onClose={() => setSelectedEquipmentForMaintenance(null)}
        equipment={selectedEquipmentForMaintenance}
        onLogCompleted={loadData}
      />
    </div>
  );
}
