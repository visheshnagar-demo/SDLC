import React from "react";
import { NavLink } from "react-router-dom";
import {
  PiggyBank,
  CreditCard,
  RefreshCw,
  BarChart3,
  ShieldCheck,
  Landmark,
} from "lucide-react";

export const Navbar = () => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-inner flex items-center justify-center">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white block leading-none">
              NexusBank{" "}
              <span className="text-blue-400 font-normal text-xs ml-1">
                Mobile
              </span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
              Retail Banking Portal
            </span>
          </div>
        </div>

        <nav className="flex items-center space-x-1 sm:space-x-2">
          <NavLink
            to="/open-fd"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600/30 text-blue-300 border border-blue-500/50"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <PiggyBank className="w-4 h-4 text-emerald-400" />
            <span>Open Fixed Deposit</span>
          </NavLink>

          <NavLink
            to="/checkout"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600/30 text-blue-300 border border-blue-500/50"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Checkout</span>
          </NavLink>

          <NavLink
            to="/refunds"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600/30 text-blue-300 border border-blue-500/50"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refunds</span>
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600/30 text-blue-300 border border-blue-500/50"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Analytics</span>
          </NavLink>
        </nav>

        <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>FDIC Insured</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
