import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  Plus,
  UserPlus,
  UserMinus,
  ShieldAlert,
  Trash2,
  Eye,
  RefreshCw,
} from "lucide-react";
import StatusBadge from "./StatusBadge";

export default function DeviceInventoryTable({
  devices = [],
  loading = false,
  onRefresh,
  onAddDevice,
  onAssignDevice,
  onUnassignDevice,
  onTriggerAction,
  onDeleteDevice,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [ownershipFilter, setOwnershipFilter] = useState("ALL");
  const [osFilter, setOsFilter] = useState("ALL");

  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      searchTerm === "" ||
      device.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      device.status?.toLowerCase() === statusFilter.toLowerCase();

    const matchesOwnership =
      ownershipFilter === "ALL" ||
      device.ownership_type?.toLowerCase() === ownershipFilter.toLowerCase();

    const matchesOs =
      osFilter === "ALL" ||
      device.os_type?.toLowerCase() === osFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesOwnership && matchesOs;
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header & Controls */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Device Inventory Catalog
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage mobile hardware assets, assignments, and compliance status
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title="Refresh Catalog"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          )}

          {onAddDevice && (
            <button
              onClick={onAddDevice}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-xs font-medium shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Register Device</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search model, serial, IMEI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="Available">Available</option>
          <option value="Assigned">Assigned</option>
          <option value="Pending Return">Pending Return</option>
          <option value="Wiped">Wiped / Locked</option>
          <option value="Decommissioned">Decommissioned</option>
        </select>

        <select
          value={ownershipFilter}
          onChange={(e) => setOwnershipFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white outline-none"
        >
          <option value="ALL">All Ownership Types</option>
          <option value="Corporate">Corporate</option>
          <option value="BYOD">BYOD</option>
        </select>

        <select
          value={osFilter}
          onChange={(e) => setOsFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white outline-none"
        >
          <option value="ALL">All OS Types</option>
          <option value="iOS">iOS</option>
          <option value="Android">Android</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-3">Device Model</th>
              <th className="p-3">IMEI / Serial</th>
              <th className="p-3">OS & Version</th>
              <th className="p-3">Ownership</th>
              <th className="p-3">Status</th>
              <th className="p-3">Compliance</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-500">
                  Loading device catalog...
                </td>
              </tr>
            ) : filteredDevices.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-500">
                  No mobile devices matched the search criteria.
                </td>
              </tr>
            ) : (
              filteredDevices.map((device) => (
                <tr
                  key={device.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <td className="p-3 font-medium text-slate-900 dark:text-white">
                    <div>{device.model}</div>
                    <div className="text-[10px] text-slate-500">
                      {device.manufacturer}
                    </div>
                  </td>
                  <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                    <div>S/N: {device.serial_number || "N/A"}</div>
                    <div className="text-[10px] text-slate-500">
                      IMEI: {device.imei || "N/A"}
                    </div>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">
                    {device.os_type} {device.os_version}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        device.ownership_type === "Corporate"
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          : "bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                      }`}
                    >
                      {device.ownership_type || "Corporate"}
                    </span>
                  </td>
                  <td className="p-3">
                    <StatusBadge status={device.status} />
                  </td>
                  <td className="p-3">
                    <StatusBadge
                      status={device.is_compliant}
                      type="compliance"
                    />
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Link
                        to={`/devices/${device.id}`}
                        className="p-1.5 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Inspect Device Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      {device.status?.toLowerCase() === "assigned" ? (
                        <button
                          onClick={() =>
                            onUnassignDevice && onUnassignDevice(device)
                          }
                          className="p-1.5 text-amber-600 hover:text-amber-800 dark:text-amber-400 rounded hover:bg-amber-50 dark:hover:bg-amber-900/30"
                          title="Unassign Device"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            onAssignDevice && onAssignDevice(device)
                          }
                          className="p-1.5 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                          title="Assign Device"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() =>
                          onTriggerAction && onTriggerAction(device)
                        }
                        className="p-1.5 text-purple-600 hover:text-purple-800 dark:text-purple-400 rounded hover:bg-purple-50 dark:hover:bg-purple-900/30"
                        title="Trigger Remote Command"
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>

                      {onDeleteDevice && (
                        <button
                          onClick={() => onDeleteDevice(device.id)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 dark:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-900/30"
                          title="Decommission Device"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
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
