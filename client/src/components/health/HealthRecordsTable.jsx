import React, { useState } from "react";
import { Heart, Search, Calendar, User, FileText } from "lucide-react";
import { Badge } from "../common/Badge";

export const HealthRecordsTable = ({ records = [], loading = false }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const types = [
    "ALL",
    "Vaccination",
    "Checkup",
    "Treatment",
    "Surgery",
    "Quarantine",
  ];

  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      (rec.title &&
        rec.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rec.diagnosis &&
        rec.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rec.tag_id &&
        rec.tag_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rec.cow_id &&
        rec.cow_id.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType =
      typeFilter === "ALL" ||
      (rec.record_type &&
        rec.record_type.toLowerCase() === typeFilter.toLowerCase());

    return matchesSearch && matchesType;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Cow, Diagnosis, Title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {types.map((t) => (
              <option key={t} value={t}>
                Event Type: {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/75 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Cattle Tag</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Event Title / Diagnosis</th>
              <th className="py-3 px-4">Treatment Plan</th>
              <th className="py-3 px-4">Next Due Date</th>
              <th className="py-3 px-4">Administered By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-500">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mb-2"></div>
                  <p>Loading medical records...</p>
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-500">
                  <p className="font-medium">
                    No medical or vaccination events found.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Record a new veterinary event using the button above.
                  </p>
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec, idx) => (
                <tr
                  key={rec.id || idx}
                  className="hover:bg-slate-50/75 transition"
                >
                  <td className="py-3 px-4 text-xs font-medium text-slate-600">
                    {rec.event_date}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {rec.tag_id || rec.cow_id}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={rec.record_type}>{rec.record_type}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800 text-xs">
                      {rec.title}
                    </div>
                    {rec.diagnosis && (
                      <div className="text-xs text-slate-500">
                        {rec.diagnosis}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                    {rec.treatment_plan || "—"}
                  </td>
                  <td className="py-3 px-4 text-xs">
                    {rec.next_due_date ? (
                      <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {rec.next_due_date}
                      </span>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600">
                    {rec.administered_by || "Dr. Sarah (Vet)"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="p-3 bg-slate-50/50 border-t border-slate-200 text-xs text-slate-500">
        <span>
          Showing {filteredRecords.length} health and veterinary records
        </span>
      </div>
    </div>
  );
};

export default HealthRecordsTable;
