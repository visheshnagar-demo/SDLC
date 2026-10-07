import React, { useState } from "react";
import { Badge } from "../common/Badge";
import { Eye, Edit2, Trash2, Search, Filter } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const CowsDataTable = ({
  cows = [],
  loading = false,
  onViewCow,
  onEditCow,
  onDeleteCow,
}) => {
  const { isManager } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [breedFilter, setBreedFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const breeds = [
    "ALL",
    ...Array.from(new Set(cows.map((c) => c.breed).filter(Boolean))),
  ];
  const statuses = [
    "ALL",
    "Healthy",
    "Under Treatment",
    "Quarantined",
    "Sold",
    "Deceased",
  ];

  const filteredCows = cows.filter((cow) => {
    const matchesSearch =
      (cow.tag_id &&
        cow.tag_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cow.breed &&
        cow.breed.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cow.location &&
        cow.location.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesBreed = breedFilter === "ALL" || cow.breed === breedFilter;
    const matchesStatus =
      statusFilter === "ALL" || cow.health_status === statusFilter;

    return matchesSearch && matchesBreed && matchesStatus;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Search and Filters Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Tag ID, Breed, Location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center space-x-1.5">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              aria-label="Filter by Breed"
              value={breedFilter}
              onChange={(e) => setBreedFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {breeds.map((b) => (
                <option key={b} value={b}>
                  Breed: {b}
                </option>
              ))}
            </select>
          </div>

          <select
            aria-label="Filter by Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                Status: {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/75 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4">Tag ID</th>
              <th className="py-3 px-4">Breed</th>
              <th className="py-3 px-4">DOB</th>
              <th className="py-3 px-4">Gender</th>
              <th className="py-3 px-4">Health Status</th>
              <th className="py-3 px-4">Weight (kg)</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan="8" className="py-12 text-center text-slate-500">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mb-2"></div>
                  <p>Loading cattle inventory...</p>
                </td>
              </tr>
            ) : filteredCows.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-12 text-center text-slate-500">
                  <p className="font-medium">
                    No cattle found matching criteria.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try resetting search filters or register a new cow.
                  </p>
                </td>
              </tr>
            ) : (
              filteredCows.map((cow) => (
                <tr
                  key={cow.id || cow.tag_id}
                  className="hover:bg-slate-50/75 transition"
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <button
                      type="button"
                      onClick={() => onViewCow && onViewCow(cow)}
                      className="text-emerald-700 hover:text-emerald-800 hover:underline"
                    >
                      {cow.tag_id}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {cow.breed}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 text-xs">
                    {cow.date_of_birth}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 text-xs">
                    {cow.gender}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge>{cow.health_status}</Badge>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-semibold text-xs">
                    {cow.weight_kg ? `${cow.weight_kg} kg` : "N/A"}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 text-xs">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      {cow.location || "Barn A"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1">
                    <button
                      type="button"
                      title="View Details"
                      onClick={() => onViewCow && onViewCow(cow)}
                      className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {isManager && (
                      <>
                        <button
                          type="button"
                          title="Edit Profile"
                          onClick={() => onEditCow && onEditCow(cow)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Delete Profile"
                          onClick={() => onDeleteCow && onDeleteCow(cow)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="p-3 bg-slate-50/50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
        <span>
          Showing {filteredCows.length} of {cows.length} cattle
        </span>
        {!isManager && (
          <span className="text-amber-600 font-medium">
            Viewing as Farm Worker (Read-only actions)
          </span>
        )}
      </div>
    </div>
  );
};

export default CowsDataTable;
