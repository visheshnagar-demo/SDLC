import React from "react";
import { ShieldCheck, Landmark } from "lucide-react";

export const Navbar = () => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">
                VelocityGuard Banking
              </span>
              <span className="ml-2 text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full font-mono">
                ACH Engine v1.0
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>AML Velocity Rules Active</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>API Live</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
