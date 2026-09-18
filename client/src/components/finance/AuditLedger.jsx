import React, { useState } from "react";
import { Landmark, ShieldCheck, Filter, Search, FileText } from "lucide-react";

export default function AuditLedger({ auditLogs = [] }) {
  const [filterType, setFilterType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const defaultLogs = [
    {
      id: "LOG-1001",
      event_type: "DONATION_RECORDED",
      ip_address: "192.168.1.12",
      masked_payload: "₹1,008 e-Hundi Offering",
      created_at: "2026-09-18 10:15:22",
    },
    {
      id: "LOG-1002",
      event_type: "POOJA_BOOKED",
      ip_address: "192.168.1.15",
      masked_payload: "Mahaganapati Homa (Slot #4)",
      created_at: "2026-09-18 10:22:45",
    },
    {
      id: "LOG-1003",
      event_type: "SHIFT_RECONCILED",
      ip_address: "192.168.1.04",
      masked_payload: "Counter #1 Zero Variance",
      created_at: "2026-09-18 11:05:00",
    },
    {
      id: "LOG-1004",
      event_type: "INVENTORY_DISPATCH",
      ip_address: "192.168.1.08",
      masked_payload: "50kg Modak Flour Issued",
      created_at: "2026-09-18 11:30:10",
    },
  ];

  const logsToDisplay = auditLogs.length > 0 ? auditLogs : defaultLogs;

  const filteredLogs = logsToDisplay.filter((log) => {
    const matchesSearch =
      log.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.event_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.masked_payload?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      filterType === "ALL" || log.event_type.includes(filterType);
    return matchesSearch && matchesType;
  });

  return (
    <div className="bg-white rounded-xl shadow-md border border-orange-200 overflow-hidden">
      <div className="p-5 bg-amber-50/50 border-b border-orange-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-6 h-6 text-green-700" />
          <h2 className="text-xl font-serif font-bold text-orange-950">
            Immutable Audit Trail Ledger
          </h2>
          <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            Tamper-Proof Log
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-orange-400" />
            <input
              type="text"
              placeholder="Search audit log event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-orange-900"
          >
            <option value="ALL">All Event Types</option>
            <option value="DONATION">Donation Events</option>
            <option value="POOJA">Pooja Events</option>
            <option value="SHIFT">Shift Events</option>
            <option value="INVENTORY">Inventory Events</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-orange-100/60 text-orange-900 text-xs font-semibold uppercase tracking-wider">
              <th className="p-3.5 border-b border-orange-200">Log ID</th>
              <th className="p-3.5 border-b border-orange-200">Event Action</th>
              <th className="p-3.5 border-b border-orange-200">
                Payload Overview
              </th>
              <th className="p-3.5 border-b border-orange-200">IP Origin</th>
              <th className="p-3.5 border-b border-orange-200">
                Timestamp (UTC)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-100 text-sm">
            {filteredLogs.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="p-8 text-center text-orange-600/70 font-medium"
                >
                  No audit entries found.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-amber-50/50 transition-colors"
                >
                  <td className="p-3.5 font-mono text-xs font-bold text-orange-900">
                    {log.id}
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-800">
                      {log.event_type}
                    </span>
                  </td>
                  <td className="p-3.5 text-xs text-orange-950 font-medium">
                    {log.masked_payload}
                  </td>
                  <td className="p-3.5 text-xs font-mono text-orange-700">
                    {log.ip_address}
                  </td>
                  <td className="p-3.5 text-xs text-orange-800">
                    {log.created_at}
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
