import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, AlertTriangle } from "lucide-react";

export default function SlotAssignmentForm({
  slot,
  channels = [],
  programs = [],
  onClose,
  onSave,
  onEmergencyOverride,
}) {
  const [channelId, setChannelId] = useState(
    slot?.channel_id || channels[0]?.id || "",
  );
  const [programId, setProgramId] = useState(
    slot?.program_id || programs[0]?.id || "",
  );
  const [startTime, setStartTime] = useState(
    slot?.start_time
      ? new Date(slot.start_time).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
  );
  const [endTime, setEndTime] = useState(
    slot?.end_time
      ? new Date(slot.end_time).toISOString().slice(0, 16)
      : new Date(Date.now() + 3600000).toISOString().slice(0, 16),
  );
  const [notes, setNotes] = useState(slot?.notes || "");
  const [isEmergency, setIsEmergency] = useState(
    slot?.is_emergency_override || false,
  );
  const [overrideTitle, setOverrideTitle] = useState("");
  const [overrideDesc, setOverrideDesc] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (channels.length > 0 && !channelId) setChannelId(channels[0].id);
    if (programs.length > 0 && !programId) setProgramId(programs[0].id);
  }, [channels, programs]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!channelId) {
      setErrorMsg("Please select a target news channel.");
      return;
    }
    setErrorMsg("");
    setIsSaving(true);

    try {
      if (isEmergency && onEmergencyOverride) {
        await onEmergencyOverride({
          channel_id: channelId,
          title: overrideTitle || "BREAKING NEWS OVERRIDE",
          description:
            overrideDesc ||
            notes ||
            "Immediate broadcast interruption for critical bulletin.",
        });
      } else {
        await onSave({
          channel_id: channelId,
          program_id: programId || null,
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
          notes,
          is_emergency_override: isEmergency,
          status: "CONFIRMED",
        });
      }
      onClose();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.detail || "Failed to save slot assignment.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-end">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-lg h-full flex flex-col justify-between shadow-2xl p-6 overflow-y-auto">
        <div>
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-slate-100">
                {slot ? "Edit Program Slot" : "Schedule Program Slot"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Target Channel */}
            <div>
              <label className="block text-xs font-mono font-medium text-slate-400 mb-1">
                News Channel *
              </label>
              <select
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                required
              >
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code}) - {c.resolution}
                  </option>
                ))}
              </select>
            </div>

            {/* Program Selection */}
            <div>
              <label className="block text-xs font-mono font-medium text-slate-400 mb-1">
                Program Title
              </label>
              <select
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Custom Bulletin / Unassigned --</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.category || "News"}) - Host:{" "}
                    {p.host_name || "N/A"}
                  </option>
                ))}
              </select>
            </div>

            {/* Timing */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-medium text-slate-400 mb-1">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-mono font-medium text-slate-400 mb-1">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-mono font-medium text-slate-400 mb-1">
                Rundown Notes / Producer Remarks
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Special guests, studio camera requirements, commercial break markers..."
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 p-3 rounded-lg text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Emergency Breaking News Interlock */}
            <div className="bg-red-950/30 border border-red-900/60 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-red-400 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>EMERGENCY BREAKING NEWS OVERRIDE</span>
                </div>
                <input
                  type="checkbox"
                  checked={isEmergency}
                  onChange={(e) => setIsEmergency(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded border-slate-700 focus:ring-red-500"
                />
              </div>

              {isEmergency && (
                <div className="space-y-2 pt-2 border-t border-red-900/40">
                  <input
                    type="text"
                    value={overrideTitle}
                    onChange={(e) => setOverrideTitle(e.target.value)}
                    placeholder="Breaking Headline (e.g. FLASH: Emergency Announcement)"
                    className="w-full bg-slate-950 border border-red-800 text-red-200 px-3 py-1.5 rounded text-xs font-bold"
                  />
                  <textarea
                    value={overrideDesc}
                    onChange={(e) => setOverrideDesc(e.target.value)}
                    placeholder="Details for emergency control room operator..."
                    rows={2}
                    className="w-full bg-slate-950 border border-red-800 text-red-200 p-2 rounded text-xs"
                  />
                </div>
              )}
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="text-xs text-red-400 font-medium bg-red-950/40 p-2 rounded border border-red-800"
              >
                {errorMsg}
              </div>
            )}

            {/* Form Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow-lg transition-all ${
                  isEmergency
                    ? "bg-red-600 hover:bg-red-700 shadow-red-600/30"
                    : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/30"
                }`}
              >
                {isSaving
                  ? "Processing..."
                  : isEmergency
                    ? "🚨 Trigger Emergency Override"
                    : "Save Schedule Slot"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
