import React, { useState } from "react";
import {
  BedDouble,
  Sparkles,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";

const statusConfig = {
  Available: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    label: "Available",
    icon: CheckCircle2,
  },
  Occupied: {
    bg: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    label: "Occupied",
    icon: BedDouble,
  },
  Reserved: {
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    label: "Reserved",
    icon: Clock,
  },
  "Under Maintenance": {
    bg: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
    label: "Maintenance",
    icon: AlertCircle,
  },
  Maintenance: {
    bg: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
    label: "Maintenance",
    icon: AlertCircle,
  },
};

const RoomStatusGrid = ({ rooms = [], onSelectRoom, isLoading = false }) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const categories = ["All", "Standard", "Deluxe", "Suite"];
  const statuses = [
    "All",
    "Available",
    "Occupied",
    "Reserved",
    "Under Maintenance",
  ];

  const filteredRooms = rooms.filter((room) => {
    const matchCategory =
      selectedCategory === "All" ||
      (room.room_category &&
        room.room_category.toLowerCase() === selectedCategory.toLowerCase());
    const matchStatus =
      selectedStatus === "All" ||
      (room.status &&
        room.status.toLowerCase() === selectedStatus.toLowerCase());
    return matchCategory && matchStatus;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Live Room Status Grid
          </h3>
          <p className="text-xs text-slate-500">
            Real-time room occupancy and housekeeping matrix
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Tabs */}
          <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Status Select */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {statuses.map((st) => (
              <option key={st} value={st}>
                Status: {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          Loading room matrix...
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
          No rooms match the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {filteredRooms.map((room) => {
            const config = statusConfig[room.status] || statusConfig.Available;
            const Icon = config.icon;

            return (
              <button
                key={room.id || room.room_number}
                type="button"
                onClick={() => onSelectRoom && onSelectRoom(room)}
                className="group relative flex flex-col justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:shadow-md transition-all text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-base font-extrabold text-slate-900 block group-hover:text-blue-600">
                      {room.room_number}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-tight">
                      {room.room_category}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${config.bg}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${config.dot}`}
                    />
                    {config.label}
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    Floor {room.floor_number || 1}
                  </span>
                  <span className="font-bold text-slate-800">
                    ${room.base_rate_per_night || 150}/nt
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RoomStatusGrid;
