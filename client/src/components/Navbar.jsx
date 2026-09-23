import React from "react";
import { NavLink } from "react-router-dom";
import { Mail, Upload, LayoutDashboard, Cpu } from "lucide-react";

export function Navbar() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-8">
        <NavLink to="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:bg-indigo-700 transition-colors">
            <Mail className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            EmailAI<span className="text-indigo-600">Classifier</span>
          </span>
        </NavLink>
        <nav className="hidden md:flex space-x-1" aria-label="Main Navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/upload"
            className={({ isActive }) =>
              `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`
            }
          >
            <Upload className="w-4 h-4" />
            <span>Upload Email</span>
          </NavLink>
        </nav>
      </div>

      <div className="flex items-center space-x-4">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
          <Cpu className="w-3.5 h-3.5 mr-1 text-emerald-600 inline" />
          Model: v2.4-LLM Active
        </span>
        <div
          className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-700 border border-slate-300"
          title="Logged in as Business User (AM)"
        >
          AM
        </div>
      </div>
    </header>
  );
}

export default Navbar;
