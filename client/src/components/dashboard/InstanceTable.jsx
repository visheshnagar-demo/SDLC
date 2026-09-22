import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Server,
  Play,
  Square,
  RotateCw,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Search,
} from "lucide-react";

export default function InstanceTable({
  instances = [],
  loading = false,
  currentUser,
  onAction,
  actionInProgress,
}) {
  const [copiedIp, setCopiedIp] = useState(null);
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedIp(text);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const isAdmin = currentUser?.role === "ADMIN";

  const filteredInstances = instances.filter((inst) => {
    const matchesProvider =
      providerFilter === "ALL" ||
      inst.provider_type === providerFilter ||
      inst.provider_id === providerFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      inst.status?.toUpperCase() === statusFilter.toUpperCase();
    const matchesSearch =
      !searchQuery ||
      inst.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.external_instance_id
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      inst.public_ip?.includes(searchQuery) ||
      inst.private_ip?.includes(searchQuery);
    return matchesProvider && matchesStatus && matchesSearch;
  });

  const getProviderBadge = (provider) => {
    const p = provider?.toUpperCase() || "AWS";
    if (p === "AWS") {
      return (
        <span className="inline-flex items-center gap-1 bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 px-2 py-0.5 rounded text-[11px] font-mono font-medium">
          AWS
        </span>
      );
    }
    if (p === "GCP") {
      return (
        <span className="inline-flex items-center gap-1 bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 px-2 py-0.5 rounded text-[11px] font-mono font-medium">
          GCP
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-[#06b6d4]/15 text-[#06b6d4] border border-[#06b6d4]/30 px-2 py-0.5 rounded text-[11px] font-mono font-medium">
        Azure
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const s = status?.toUpperCase() || "UNKNOWN";
    if (s === "RUNNING") {
      return (
        <span className="inline-flex items-center gap-1.5 bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
          RUNNING
        </span>
      );
    }
    if (s === "STOPPED") {
      return (
        <span className="inline-flex items-center gap-1.5 bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"></span>
          STOPPED
        </span>
      );
    }
    if (s === "PROVISIONING" || s === "RESTARTING") {
      return (
        <span className="inline-flex items-center gap-1.5 bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-spin"></span>
          {s}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 bg-[#f43f5e]/15 text-[#f43f5e] border border-[#f43f5e]/30 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e]"></span>
        TERMINATED
      </span>
    );
  };

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden shadow-lg">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-[#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#dae2fd] flex items-center gap-2">
            <Server className="w-4 h-4 text-[#06b6d4]" />
            Multi-Cloud VM Instances
          </h2>
          <p className="text-xs text-[#bcc9cd]">
            Managed compute nodes across connected cloud regions
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#bcc9cd] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name / IP..."
              className="bg-[#0b1326] border border-[#1e293b] rounded-lg pl-8 pr-3 py-1 text-xs text-[#dae2fd] placeholder-[#64748b] focus:outline-none focus:border-[#06b6d4]"
            />
          </div>

          {/* Provider Select */}
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="bg-[#0b1326] border border-[#1e293b] rounded-lg px-2.5 py-1 text-xs text-[#dae2fd] focus:outline-none focus:border-[#06b6d4] font-mono cursor-pointer"
          >
            <option value="ALL">All Providers</option>
            <option value="AWS">AWS</option>
            <option value="GCP">GCP</option>
            <option value="AZURE">Azure</option>
          </select>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0b1326] border border-[#1e293b] rounded-lg px-2.5 py-1 text-xs text-[#dae2fd] focus:outline-none focus:border-[#06b6d4] font-mono cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="RUNNING">RUNNING</option>
            <option value="STOPPED">STOPPED</option>
            <option value="TERMINATED">TERMINATED</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0b1326]/70 border-b border-[#1e293b] text-[#bcc9cd] font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Instance / ID</th>
              <th className="py-3 px-4">Provider</th>
              <th className="py-3 px-4">Region / Zone</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Public / Private IP</th>
              <th className="py-3 px-4 text-right">Lifecycle Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]/60">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-[#bcc9cd]">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#06b6d4] border-t-transparent rounded-full animate-spin"></span>
                    <span>Loading cloud instances...</span>
                  </div>
                </td>
              </tr>
            ) : filteredInstances.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-[#bcc9cd]">
                  No cloud instances found matching the current criteria.
                </td>
              </tr>
            ) : (
              filteredInstances.map((inst) => {
                const isTerminated =
                  inst.status?.toUpperCase() === "TERMINATED";
                const isRunning = inst.status?.toUpperCase() === "RUNNING";
                const isActionBusy = actionInProgress === inst.id;

                return (
                  <tr
                    key={inst.id}
                    className="hover:bg-[#0b1326]/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <Link
                        to={`/instances/${inst.id}`}
                        className="font-semibold text-[#dae2fd] hover:text-[#06b6d4] flex items-center gap-1.5 group"
                      >
                        <span>{inst.name}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#06b6d4]" />
                      </Link>
                      <span className="font-mono text-[10px] text-[#64748b] block mt-0.5">
                        {inst.external_instance_id || inst.id}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {getProviderBadge(inst.provider_type || inst.provider_id)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#bcc9cd]">
                      {inst.region || "us-east-1"}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#bcc9cd]">
                      <span className="bg-[#171f33] px-1.5 py-0.5 rounded border border-[#1e293b]">
                        {inst.instance_type || "t3.medium"}
                      </span>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(inst.status)}</td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5 text-[#dae2fd]">
                        <span>Pub: {inst.public_ip || "—"}</span>
                        {inst.public_ip && (
                          <button
                            onClick={() => handleCopy(inst.public_ip)}
                            className="text-[#64748b] hover:text-[#06b6d4]"
                            title="Copy Public IP"
                          >
                            {copiedIp === inst.public_ip ? (
                              <Check className="w-3 h-3 text-[#10b981]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                      <div className="text-[#64748b] text-[10px]">
                        Priv: {inst.private_ip || "10.0.1.24"}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Start Action */}
                        <button
                          disabled={
                            !isAdmin ||
                            isRunning ||
                            isTerminated ||
                            isActionBusy
                          }
                          onClick={() => onAction && onAction(inst.id, "START")}
                          title={
                            !isAdmin
                              ? "Admin role required to start instance"
                              : "Start Instance"
                          }
                          className={`p-1.5 rounded-lg border transition-colors ${
                            !isAdmin || isRunning || isTerminated
                              ? "opacity-40 cursor-not-allowed border-transparent text-[#64748b]"
                              : "bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30 hover:bg-[#10b981]/30"
                          }`}
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>

                        {/* Stop Action */}
                        <button
                          disabled={
                            !isAdmin ||
                            !isRunning ||
                            isTerminated ||
                            isActionBusy
                          }
                          onClick={() => onAction && onAction(inst.id, "STOP")}
                          title={
                            !isAdmin
                              ? "Admin role required to stop instance"
                              : "Stop Instance"
                          }
                          className={`p-1.5 rounded-lg border transition-colors ${
                            !isAdmin || !isRunning || isTerminated
                              ? "opacity-40 cursor-not-allowed border-transparent text-[#64748b]"
                              : "bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30 hover:bg-[#f59e0b]/30"
                          }`}
                        >
                          <Square className="w-3.5 h-3.5" />
                        </button>

                        {/* Restart Action */}
                        <button
                          disabled={
                            !isAdmin ||
                            !isRunning ||
                            isTerminated ||
                            isActionBusy
                          }
                          onClick={() =>
                            onAction && onAction(inst.id, "RESTART")
                          }
                          title={
                            !isAdmin
                              ? "Admin role required to restart instance"
                              : "Restart Instance"
                          }
                          className={`p-1.5 rounded-lg border transition-colors ${
                            !isAdmin || !isRunning || isTerminated
                              ? "opacity-40 cursor-not-allowed border-transparent text-[#64748b]"
                              : "bg-[#38bdf8]/15 text-[#38bdf8] border-[#38bdf8]/30 hover:bg-[#38bdf8]/30"
                          }`}
                        >
                          <RotateCw
                            className={`w-3.5 h-3.5 ${isActionBusy ? "animate-spin" : ""}`}
                          />
                        </button>

                        {/* Terminate Action */}
                        <button
                          disabled={!isAdmin || isTerminated || isActionBusy}
                          onClick={() =>
                            onAction && onAction(inst.id, "TERMINATE")
                          }
                          title={
                            !isAdmin
                              ? "Admin role required to terminate instance"
                              : "Terminate Instance"
                          }
                          className={`p-1.5 rounded-lg border transition-colors ${
                            !isAdmin || isTerminated
                              ? "opacity-40 cursor-not-allowed border-transparent text-[#64748b]"
                              : "bg-[#f43f5e]/15 text-[#f43f5e] border-[#f43f5e]/30 hover:bg-[#f43f5e]/30"
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Link to Details */}
                        <Link
                          to={`/instances/${inst.id}`}
                          title="View Telemetry & Details"
                          className="p-1.5 rounded-lg bg-[#0b1326] border border-[#1e293b] text-[#bcc9cd] hover:text-[#06b6d4] hover:border-[#06b6d4]/40 transition-colors ml-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
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
}
