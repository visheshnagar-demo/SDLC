import React, { useState, useEffect } from "react";
import RundownTimelineMatrix from "../components/RundownTimelineMatrix";
import SlotAssignmentForm from "../components/SlotAssignmentForm";
import { schedulesApi, channelsApi, programsApi } from "../services/api";
import { Calendar, Plus, ShieldAlert, Trash2, Clock } from "lucide-react";

export default function SchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [channels, setChannels] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notification, setNotification] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, cRes, pRes] = await Promise.allSettled([
        schedulesApi.getSchedules(),
        channelsApi.getChannels(),
        programsApi.getPrograms(),
      ]);

      if (cRes.status === "fulfilled" && Array.isArray(cRes.value)) {
        setChannels(cRes.value);
      } else {
        setChannels([
          {
            id: "ch-1",
            name: "Global News HD",
            code: "GNN-HD",
            resolution: "1080p60",
          },
          {
            id: "ch-2",
            name: "World News 24/7",
            code: "WN24",
            resolution: "4K UHD",
          },
        ]);
      }

      if (pRes.status === "fulfilled" && Array.isArray(pRes.value)) {
        setPrograms(pRes.value);
      } else {
        setPrograms([
          {
            id: "prg-1",
            title: "Morning Global Bulletin",
            category: "News",
            host_name: "Sarah Jenkins",
          },
          {
            id: "prg-2",
            title: "Evening Financial Roundtable",
            category: "Finance",
            host_name: "David Miller",
          },
        ]);
      }

      if (sRes.status === "fulfilled" && Array.isArray(sRes.value)) {
        setSchedules(sRes.value);
      } else {
        const now = new Date();
        setSchedules([
          {
            id: "sched-1",
            channel_id: "ch-1",
            program_id: "prg-1",
            start_time: new Date(now.getTime() - 1800000).toISOString(),
            end_time: new Date(now.getTime() + 1800000).toISOString(),
            status: "ON AIR",
            notes: "Morning Bulletin live feed.",
            is_emergency_override: false,
          },
          {
            id: "sched-2",
            channel_id: "ch-2",
            program_id: "prg-2",
            start_time: new Date(now.getTime() + 3600000).toISOString(),
            end_time: new Date(now.getTime() + 7200000).toISOString(),
            status: "CONFIRMED",
            notes: "Financial market wrap-up.",
            is_emergency_override: false,
          },
        ]);
      }
    } catch (_e) {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddSlot = () => {
    setSelectedSlot(null);
    setShowSlotForm(true);
  };

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    setShowSlotForm(true);
  };

  const handleSaveSlot = async (slotData) => {
    if (selectedSlot?.id) {
      await schedulesApi.updateSchedule(selectedSlot.id, slotData);
      setNotification("Program slot updated successfully.");
    } else {
      await schedulesApi.createSchedule(slotData);
      setNotification("New program slot scheduled successfully.");
    }
    setTimeout(() => setNotification(""), 4000);
    fetchData();
  };

  const handleEmergencyOverride = async (overrideData) => {
    await schedulesApi.triggerOverride(overrideData.channel_id, overrideData);
    setNotification("🚨 Emergency breaking news override activated.");
    setTimeout(() => setNotification(""), 5000);
    fetchData();
  };

  const handleDeleteSlot = async (id) => {
    if (confirm("Cancel and delete this broadcast schedule slot?")) {
      await schedulesApi.deleteSchedule(id);
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-400" />
            Broadcast & Playout Rundown Scheduler
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Linear broadcast rundown matrix, collision detection, and automated
            slot playout assignments.
          </p>
        </div>

        <button
          onClick={handleOpenAddSlot}
          className="bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-lg shadow-sky-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Program Slot</span>
        </button>
      </div>

      {notification && (
        <div className="bg-blue-950 border border-blue-800 text-blue-200 p-3 rounded-xl text-xs font-mono">
          {notification}
        </div>
      )}

      {/* 24-Hour Rundown Matrix Component */}
      <RundownTimelineMatrix
        schedules={schedules}
        channels={channels}
        programs={programs}
        onSelectSlot={handleSelectSlot}
        onAddSlot={handleOpenAddSlot}
      />

      {/* Detailed Slot List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl p-5">
        <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          Scheduled Rundown List ({schedules.length} Items)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-700">
              <tr>
                <th className="p-3">Time Window</th>
                <th className="p-3">Channel</th>
                <th className="p-3">Program / Bulletin</th>
                <th className="p-3">Status</th>
                <th className="p-3">Emergency Override</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {schedules.map((s) => {
                const ch = channels.find((c) => c.id === s.channel_id);
                const prg = programs.find((p) => p.id === s.program_id);

                return (
                  <tr key={s.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-slate-300">
                      {new Date(s.start_time).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" → "}
                      {new Date(s.end_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-200">
                        {ch?.name || s.channel_id}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-100">
                        {prg?.title || s.notes || "Scheduled Slot"}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Host: {prg?.host_name || "N/A"}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">
                        {s.status || "CONFIRMED"}
                      </span>
                    </td>
                    <td className="p-3">
                      {s.is_emergency_override ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-400 border border-red-800">
                          🚨 ACTIVE OVERRIDE
                        </span>
                      ) : (
                        <span className="text-slate-600 font-mono text-[10px]">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleSelectSlot(s)}
                        className="text-blue-400 hover:text-blue-300 text-xs font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSlot(s.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {showSlotForm && (
        <SlotAssignmentForm
          slot={selectedSlot}
          channels={channels}
          programs={programs}
          onClose={() => setShowSlotForm(false)}
          onSave={handleSaveSlot}
          onEmergencyOverride={handleEmergencyOverride}
        />
      )}
    </div>
  );
}
