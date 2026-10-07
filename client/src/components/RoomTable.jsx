import React, { useState } from "react";
import {
  Search,
  Filter,
  Edit3,
  BedDouble,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

const statusConfig = {
  Available: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  Occupied: {
    bg: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  Reserved: {
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  "Under Maintenance": {
    bg: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
  Maintenance: {
    bg: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
};

const RoomTable = ({ rooms = [], onEditRoom, isLoading = false }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [floorFilter, setFloorFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const categories = ["All", "Standard", "Deluxe", "Suite"];
  const floors = ["All", "1", "2", "3", "4"];
  const statuses = [
    "All",
    "Available",
    "Occupied",
    "Reserved",
    "Under Maintenance",
  ];

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      (room.room_number &&
        room.room_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (room.room_category &&
        room.room_category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      categoryFilter === "All" ||
      (room.room_category &&
        room.room_category.toLowerCase() === categoryFilter.toLowerCase());

    const matchesFloor =
      floorFilter === "All" || String(room.floor_number) === floorFilter;

    const matchesStatus =
      statusFilter === "All" ||
      (room.status && room.status.toLowerCase() === statusFilter.toLowerCase());

    return matchesSearch && matchesCategory && matchesFloor && matchesStatus;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search room # or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>

          {/* Floor Filter */}
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {floors.map((fl) => (
              <option key={fl} value={fl}>
                Floor: {fl}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {statuses.map((st) => (
              <option key={st} value={st}>
                Status: {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-5 py-3.5">Room #</th>
              <th className="px-5 py-3.5">Category</th>
              <th className="px-5 py-3.5">Floor</th>
              <th className="px-5 py-3.5">Rate / Night</th>
              <th className="px-5 py-3.5">Capacity</th>
              <th className="px-5 py-3.5">Amenities</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {isLoading ? (
              <tr>
                <td
                  colSpan="8"
                  className="px-5 py-10 text-center text-slate-400"
                >
                  Loading room inventory...
                </td>
              </tr>
            ) : filteredRooms.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  className="px-5 py-10 text-center text-slate-400"
                >
                  No rooms found matching your filter criteria.
                </td>
              </tr>
            ) : (
              filteredRooms.map((room) => {
                const conf =
                  statusConfig[room.status] || statusConfig.Available;
                const amenitiesList = Array.isArray(room.amenities)
                  ? room.amenities
                  : typeof room.amenities === "string"
                    ? room.amenities.split(",").map((a) => a.trim())
                    : ["Wi-Fi", "TV"];

                return (
                  <tr
                    key={room.id || room.room_number}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-5 py-4 font-bold text-slate-900 flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-blue-600" />
                      <span>{room.room_number}</span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {room.room_category}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      Floor {room.floor_number || 1}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      ${room.base_rate_per_night || 120}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {room.max_occupancy || 2} Guests
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {amenitiesList.slice(0, 3).map((amenity, i) => (
                          <span
                            key={i}
                            className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600"
                          >
                            {amenity}
                          </span>
                        ))}
                        {amenitiesList.length > 3 && (
                          <span className="text-[10px] text-slate-400 font-semibold">
                            +{amenitiesList.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${conf.bg}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${conf.dot}`}
                        />
                        {room.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onEditRoom && onEditRoom(room)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 font-semibold text-xs transition-colors"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoomTable;
