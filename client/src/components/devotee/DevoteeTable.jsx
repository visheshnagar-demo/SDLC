import React, { useState } from "react";
import { Search, UserPlus, Users, Phone, Hash, Award } from "lucide-react";

export default function DevoteeTable({
  devotees = [],
  onSelectDevotee,
  onNewDevoteeClick,
}) {
  const [searchTerm, setSearchStyle] = useState("");
  const [filterGotra, setFilterGotra] = useState("ALL");

  const filteredDevotees = devotees.filter((d) => {
    const matchesSearch =
      d.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone?.includes(searchTerm) ||
      d.devotee_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGotra = filterGotra === "ALL" || d.gotra === filterGotra;
    return matchesSearch && matchesGotra;
  });

  const gotraOptions = [
    "ALL",
    ...new Set(devotees.map((d) => d.gotra).filter(Boolean)),
  ];

  return (
    <div className="bg-white rounded-xl shadow-md border border-orange-200 overflow-hidden">
      <div className="p-5 bg-amber-50/50 border-b border-orange-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Users className="w-6 h-6 text-orange-700" />
          <h2 className="text-xl font-serif font-bold text-orange-950">
            Devotee Directory
          </h2>
          <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {filteredDevotees.length} Devotees
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-orange-400" />
            <input
              type="text"
              placeholder="Search name, phone, ID..."
              value={searchTerm}
              onChange={(e) => setSearchStyle(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            />
          </div>

          <select
            value={filterGotra}
            onChange={(e) => setFilterGotra(e.target.value)}
            className="px-3 py-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-orange-900"
          >
            <option value="ALL">Filter Gotra (All)</option>
            {gotraOptions
              .filter((g) => g !== "ALL")
              .map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
          </select>

          <button
            onClick={onNewDevoteeClick}
            className="flex items-center px-4 py-2 bg-orange-700 hover:bg-orange-800 text-white font-medium rounded-lg text-sm shadow transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            New Devotee
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-orange-100/60 text-orange-900 text-xs font-semibold uppercase tracking-wider">
              <th className="p-3.5 border-b border-orange-200">Devotee ID</th>
              <th className="p-3.5 border-b border-orange-200">Full Name</th>
              <th className="p-3.5 border-b border-orange-200">Phone</th>
              <th className="p-3.5 border-b border-orange-200">
                Gotra / Rashi
              </th>
              <th className="p-3.5 border-b border-orange-200">
                Family Members
              </th>
              <th className="p-3.5 border-b border-orange-200 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-100 text-sm">
            {filteredDevotees.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="p-8 text-center text-orange-600/70 font-medium"
                >
                  No devotees found matching search criteria.
                </td>
              </tr>
            ) : (
              filteredDevotees.map((devotee) => (
                <tr
                  key={devotee.id || devotee.devotee_number}
                  className="hover:bg-amber-50/60 transition-colors"
                >
                  <td className="p-3.5 font-mono text-xs font-semibold text-orange-900">
                    <span className="flex items-center">
                      <Hash className="w-3.5 h-3.5 mr-1 text-orange-500" />
                      {devotee.devotee_number || devotee.id}
                    </span>
                  </td>
                  <td className="p-3.5 font-medium text-orange-950">
                    <div>{devotee.full_name}</div>
                    <div className="text-xs text-orange-600">
                      {devotee.email || "No email provided"}
                    </div>
                  </td>
                  <td className="p-3.5 text-orange-800">
                    <span className="flex items-center">
                      <Phone className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
                      {devotee.phone}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-orange-900">
                      {devotee.gotra || "Kashyapa"}
                    </div>
                    <div className="text-xs text-orange-600">
                      {devotee.rashi
                        ? `${devotee.rashi} • ${devotee.nakshatra || ""}`
                        : "Rashi N/A"}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      <Users className="w-3 h-3 mr-1" />
                      {devotee.family_members?.length || 0} Members
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => onSelectDevotee(devotee)}
                      className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-semibold rounded-md transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
