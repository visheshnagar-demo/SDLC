import React from "react";
import { Users, HardDrive, Zap, AlertTriangle } from "lucide-react";

export const QuotaTelemetryMeters = ({ tenant }) => {
  if (!tenant) return null;

  // Simulated consumption telemetry metrics
  const activeUsers = Math.min(
    tenant.max_users,
    Math.round(tenant.max_users * 0.68),
  );
  const usedStorage = Math.min(
    tenant.storage_limit_gb,
    Math.round(tenant.storage_limit_gb * 0.45),
  );
  const currentRpm = Math.min(
    tenant.rate_limit_rpm,
    Math.round(tenant.rate_limit_rpm * 0.22),
  );

  const usersPercentage = Math.round((activeUsers / tenant.max_users) * 100);
  const storagePercentage = Math.round(
    (usedStorage / tenant.storage_limit_gb) * 100,
  );
  const rpmPercentage = Math.round((currentRpm / tenant.rate_limit_rpm) * 100);

  const getMeterColor = (pct) => {
    if (pct >= 90) return "bg-rose-500";
    if (pct >= 75) return "bg-amber-500";
    return "bg-indigo-600";
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Quota Telemetry & Consumption
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Resource usage telemetry against assigned subscription limits
          </p>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono bg-slate-100 text-slate-700 font-medium">
          Tier: {tenant.tier}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Seats Meter */}
        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-800">
                User Seats
              </span>
            </div>
            <span className="text-xs font-bold text-slate-700">
              {usersPercentage}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all ${getMeterColor(usersPercentage)}`}
              style={{ width: `${usersPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-slate-600 font-mono">
            <span>Allocated: {activeUsers}</span>
            <span>Limit: {tenant.max_users} seats</span>
          </div>
          {usersPercentage >= 90 && (
            <div className="flex items-center text-xs text-rose-600 font-medium pt-1">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Approaching max
              seat quota!
            </div>
          )}
        </div>

        {/* Storage Allocation Meter */}
        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-800">
                Storage Usage
              </span>
            </div>
            <span className="text-xs font-bold text-slate-700">
              {storagePercentage}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all ${getMeterColor(storagePercentage)}`}
              style={{ width: `${storagePercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-slate-600 font-mono">
            <span>Used: {usedStorage} GB</span>
            <span>Limit: {tenant.storage_limit_gb} GB</span>
          </div>
        </div>

        {/* API Rate Limit Meter */}
        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-800">
                API Velocity
              </span>
            </div>
            <span className="text-xs font-bold text-slate-700">
              {rpmPercentage}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all ${getMeterColor(rpmPercentage)}`}
              style={{ width: `${rpmPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-slate-600 font-mono">
            <span>Peak: {currentRpm} RPM</span>
            <span>Rate Cap: {tenant.rate_limit_rpm} RPM</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotaTelemetryMeters;
