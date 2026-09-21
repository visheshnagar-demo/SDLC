import React from "react";
import { Droplets, Bell, ShieldCheck, Activity } from "lucide-react";

export function TopNavBar({ alertCount = 0 }) {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-sky-600 p-2 rounded-lg flex items-center justify-center text-white shadow-md">
              <Droplets className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-cyan-200">
                HydroRain
              </span>
              <span className="hidden sm:inline-block text-xs text-slate-400 ml-2 font-medium">
                Rainwater Harvesting & Telemetry System
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 text-xs font-medium text-emerald-400">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Telemetry: Active (500 L/min Inflow)</span>
            </div>

            <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-full text-xs text-slate-300 border border-slate-700">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>Facility #1 (HQ Campus)</span>
            </div>

            <div className="relative">
              <div className="p-2 text-slate-300 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-slate-800">
                <Bell className="w-5 h-5" />
                {alertCount > 0 && (
                  <span className="absolute top-1 right-1 bg-amber-500 text-slate-950 font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {alertCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopNavBar;
