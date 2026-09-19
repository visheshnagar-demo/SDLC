import React from "react";
import StatusBadge from "./StatusBadge";
import {
  Eye,
  Edit,
  Trash2,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

export default function DeviceCatalog({
  devices = [],
  loading = false,
  onViewDetails,
  onAssign,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Loading device catalog...
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        No mobile devices match your criteria.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th className="px-4 py-3">Device / Model</th>
            <th className="px-4 py-3">IMEI / Serial</th>
            <th className="px-4 py-3">OS & Version</th>
            <th className="px-4 py-3">Ownership</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Compliance</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {devices.map((device) => (
            <tr
              key={device.id}
              className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                <div>{device.model}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {device.manufacturer}
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                <div>IMEI: {device.imei}</div>
                <div className="text-[10px] text-slate-400">
                  S/N: {device.serial_number}
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                {device.os_type} {device.os_version}
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {device.ownership_type}
                </span>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={device.status} />
              </td>
              <td className="px-4 py-3">
                {device.is_compliant ? (
                  <span className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Compliant</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-rose-600 dark:text-rose-400 font-medium">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Non-Compliant</span>
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right space-x-2">
                <button
                  onClick={() => onViewDetails && onViewDetails(device)}
                  className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onAssign && onAssign(device)}
                  className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  title="Assign / Unassign"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
                {onDelete && (
                  <button
                    onClick={() => onDelete(device.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    title="Decommission Device"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
