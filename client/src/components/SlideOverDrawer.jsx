import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  AlertCircle,
  CheckCircle2,
  BedDouble,
  DollarSign,
  Wrench,
} from "lucide-react";

const SlideOverDrawer = ({
  isOpen,
  onClose,
  room,
  onSave,
  isSubmitting = false,
}) => {
  const [status, setStatus] = useState("Available");
  const [baseRate, setBaseRate] = useState(150);
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (room) {
      setStatus(room.status || "Available");
      setBaseRate(room.base_rate_per_night || 150);
      setNotes(room.notes || "");
      setErrorMsg("");
    }
  }, [room]);

  if (!isOpen || !room) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (baseRate <= 0) {
      setErrorMsg("Nightly rate must be greater than $0.");
      return;
    }
    setErrorMsg("");
    onSave({
      id: room.id,
      room_number: room.room_number,
      status,
      base_rate_per_night: Number(baseRate),
      notes,
    });
  };

  const statusOptions = [
    {
      value: "Available",
      label: "Available",
      desc: "Ready for guest check-in & booking",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      value: "Occupied",
      label: "Occupied",
      desc: "Guest is currently checked-in",
      color: "text-blue-700 bg-blue-50 border-blue-200",
    },
    {
      value: "Reserved",
      label: "Reserved",
      desc: "Booked for an upcoming check-in",
      color: "text-amber-700 bg-amber-50 border-amber-200",
    },
    {
      value: "Under Maintenance",
      label: "Under Maintenance",
      desc: "Out of order / housekeeping cleaning",
      color: "text-rose-700 bg-rose-50 border-rose-200",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-md bg-white shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-600 text-white">
                <BedDouble className="h-4 w-4" />
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Manage Room {room.room_number}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {room.room_category} • Floor {room.floor_number || 1} • Max{" "}
              {room.max_occupancy || 2} Guests
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Operational Status */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Operational Status
            </label>
            <div className="space-y-2">
              {statusOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    status === opt.value
                      ? `${opt.color} ring-2 ring-blue-500 font-semibold`
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="roomStatus"
                    value={opt.value}
                    checked={status === opt.value}
                    onChange={(e) => setStatus(e.target.value)}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-xs font-bold leading-tight">
                      {opt.label}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {opt.desc}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Base Rate Per Night */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Base Rate Per Night ($ USD)
            </label>
            <div className="relative">
              <DollarSign className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                min="1"
                step="0.01"
                value={baseRate}
                onChange={(e) => setBaseRate(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Standard nightly tariff calculated during reservation.
            </p>
          </div>

          {/* Work Order / Housekeeping Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5 text-slate-500" />
              <span>Housekeeping & Maintenance Notes</span>
            </label>
            <textarea
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Deep clean scheduled, AC filter replaced, VIP amenities prepared..."
              className="w-full p-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </form>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlideOverDrawer;
