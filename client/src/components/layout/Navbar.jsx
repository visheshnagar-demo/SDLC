import React from "react";
import { NavLink } from "react-router-dom";
import {
  Shield,
  LayoutDashboard,
  Layers,
  ArrowRightLeft,
  FileText,
  Activity,
} from "lucide-react";

export const Navbar = () => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              ChipsLedger Pro
            </span>
            <span className="text-xs text-slate-400 block font-mono">
              ACID Inventory & Ledger
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                isActive
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </NavLink>

          <NavLink
            to="/inventory"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                isActive
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`
            }
          >
            <Layers className="w-4 h-4" />
            Inventory
          </NavLink>

          <NavLink
            to="/transfers"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                isActive
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`
            }
          >
            <ArrowRightLeft className="w-4 h-4" />
            Transfers
          </NavLink>

          <NavLink
            to="/audit"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                isActive
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`
            }
          >
            <FileText className="w-4 h-4" />
            Audit Trail
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-mono">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>ACID Engine: Active</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
