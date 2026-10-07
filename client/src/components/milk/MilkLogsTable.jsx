import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Search, Filter } from 'lucide-react';
import { Badge } from '../common/Badge';

export const MilkLogsTable = ({ logs = [], loading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [alertOnly, setAlertOnly] = useState(false);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.cow_id && log.cow_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.tag_id && log.tag_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.notes && log.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAlert = !alertOnly || log.yield_drop_alert;

    return matchesSearch && matchesAlert;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Cow, Tag ID, Notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 px-3 py-1.5 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={alertOnly}
              onChange={(e) => setAlertOnly(e.target.checked)}
              className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
            />
            <span>Show Yield Drop Alerts Only</span>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/75 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Cattle Tag</th>
              <th className="py-3 px-4">Morning (L)</th>
              <th className="py-3 px-4">Evening (L)</th>
              <th className="py-3 px-4 font-bold">Total (L)</th>
              <th className="py-3 px-4">Anomaly Flag</th>
              <th className="py-3 px-4">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-500">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mb-2"></div>
                  <p>Loading milk logs...</p>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-500">
                  <p className="font-medium">No milking records found.</p>
                  <p className="text-xs text-slate-400 mt-1">Record a new morning or evening session above.</p>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, idx) => (
                <tr key={log.id || idx} className="hover:bg-slate-50/75 transition">
                  <td className="py-3 px-4 font-medium text-slate-700 text-xs">{log.logging_date}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{log.tag_id || log.cow_id}</td>
                  <td className="py-3 px-4 text-sky-700 font-medium text-xs">{log.morning_yield_liters} L</td>
                  <td className="py-3 px-4 text-emerald-700 font-medium text-xs">{log.evening_yield_liters} L</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{log.total_yield_liters} L</td>
                  <td className="py-3 px-4">
                    {log.yield_drop_alert ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="h-3 w-3 text-rose-600" />
                        <span>>30% Drop</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="h-3 w-3 text-emerald-600" />
                        <span>Normal</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs truncate max-w-xs">{log.notes || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="p-3 bg-slate-50/50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
        <span>Showing {filteredLogs.length} milking logs</span>
      </div>
    </div>
  );
};

export default MilkLogsTable;
