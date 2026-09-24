import React from "react";
import { NavLink } from "react-router-dom";
import {
  Layers,
  Rocket,
  ShieldAlert,
  GitPullRequest,
  PlusCircle,
  History,
} from "lucide-react";

export const Header = ({ onOpenCreateModal }) => {
  return (
    <header className="bg-[#0b1326] border-b border-slate-800 sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-8">
        <NavLink to="/releases" className="flex items-center gap-3 group">
          <div className="bg-gradient-to-tr from-indigo-600 to-indigo-500 p-2 rounded-xl text-white shadow-indigo-500/20 shadow-lg group-hover:scale-105 transition-transform">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-[#c0c1ff] tracking-tight">
                ReleaseTracker
              </span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono px-1.5 py-0.5 rounded border border-indigo-500/30">
                PROD
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium block">
              Software Release & Readiness Hub
            </span>
          </div>
        </NavLink>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink
            to="/releases"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600/20 text-[#c0c1ff] border border-indigo-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`
            }
          >
            <Layers className="w-4 h-4" />
            <span>Releases</span>
          </NavLink>

          <NavLink
            to="/deployments"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600/20 text-[#c0c1ff] border border-indigo-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`
            }
          >
            <GitPullRequest className="w-4 h-4" />
            <span>Deployments</span>
          </NavLink>

          <NavLink
            to="/audit-logs"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600/20 text-[#c0c1ff] border border-indigo-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`
            }
          >
            <History className="w-4 h-4" />
            <span>Audit Trail</span>
          </NavLink>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {onOpenCreateModal && (
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Release</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
