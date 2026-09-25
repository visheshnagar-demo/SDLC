import React, { useState, useEffect, useCallback } from "react";
import { Calendar, History, Utensils, CheckCircle } from "lucide-react";
import {
  getTanks,
  getFeedingSchedules,
  getFeedingLogs,
  createFeedingLog,
} from "../services/api";
import FeedingChecklist from "../components/feeding/FeedingChecklist";
import FeedingLogForm from "../components/feeding/FeedingLogForm";
import FeedingScheduleTable from "../components/feeding/FeedingScheduleTable";

export default function FeedingPage() {
  const [tanks, setTanks] = useState([]);
  const [selectedTankId, setSelectedTankId] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [tankList, scheduleList, logList] = await Promise.all([
        getTanks(),
        getFeedingSchedules(selectedTankId ? { tank_id: selectedTankId } : {}),
        getFeedingLogs(
          selectedTankId
            ? { tank_id: selectedTankId, limit: 50 }
            : { limit: 50 },
        ),
      ]);
      setTanks(Array.isArray(tankList) ? tankList : []);
      setSchedules(Array.isArray(scheduleList) ? scheduleList : []);
      setLogs(Array.isArray(logList) ? logList : []);

      if (Array.isArray(tankList) && tankList.length > 0 && !selectedTankId) {
        setSelectedTankId(tankList[0].id);
      }
    } catch {
      setError("Failed to load feeding management data.");
    }
  }, [selectedTankId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleQuickLog = async (schedule) => {
    try {
      const payload = {
        tank_id: schedule.tank_id || selectedTankId,
        schedule_id: schedule.id,
        food_type: schedule.food_type,
        portion_grams: schedule.portion_grams,
        fed_by: "Automated Routine / Caretaker",
        notes: `Executed on-schedule at ${new Date().toLocaleTimeString()}`,
      };
      await createFeedingLog(payload);
      loadData();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Failed to record quick feeding execution",
      );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1e2e45]">
        <div>
          <h1 className="text-2xl font-bold font-mono text-[#00e5ff] tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#00e5ff]" />
            <span>Feeding Schedules & Nutrition Logistics</span>
          </h1>
          <p className="text-xs text-[#bac9cc] font-mono mt-1">
            Configure automated portioning, track daily feeding timelines, and
            log manual feedings.
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

      {/* Grid: Timeline Checklist + Manual Log Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FeedingChecklist
          schedules={schedules}
          logs={logs}
          onQuickLog={handleQuickLog}
        />
        <FeedingLogForm
          tankId={selectedTankId}
          tanks={tanks}
          onLogCreated={loadData}
        />
      </div>

      {/* Configured Recurring Schedules */}
      <FeedingScheduleTable
        schedules={schedules}
        tankId={selectedTankId}
        tanks={tanks}
        onScheduleCreated={loadData}
      />

      {/* Historical Feeding Logs Table */}
      <div className="p-6 rounded-xl bg-[#141c27] border border-[#1e2e45] space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-[#00e5ff]" />
          <h2 className="text-base font-bold font-mono text-[#00e5ff]">
            Historical Feeding Execution Logs
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1e2e45] text-[#8899a6] uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Diet / Food Type</th>
                <th className="py-3 px-4">Portion</th>
                <th className="py-3 px-4">Administered By</th>
                <th className="py-3 px-4">Observations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2e45]/50 text-[#dbe3f3]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#bac9cc]">
                    No feeding logs recorded. Complete a feeding checklist item
                    or submit a manual log above.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-[#1e2e45]/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-[#00e5ff] font-bold">
                      {log.fed_at
                        ? new Date(log.fed_at).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Recent"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#c3f5ff]">
                      {log.food_type}
                    </td>
                    <td className="py-3.5 px-4">{log.portion_grams}g</td>
                    <td className="py-3.5 px-4 text-[#bac9cc]">
                      {log.fed_by || "Staff"}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-[#8899a6]">
                      {log.notes || "Normal ingestion"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
