import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldAlert, Sliders, FileText, Activity } from "lucide-react";

export default function AppNavbar() {
  const location = useLocation();

  const navLinks = [
    { path: "/", label: "Alerts Dashboard", icon: ShieldAlert },
    { path: "/rules", label: "Rule Engine", icon: Sliders },
    { path: "/audit", label: "Audit Logs", icon: FileText },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-3.5 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white font-bold shadow-sm">
              N
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 text-lg tracking-tight">
                NexusGuard AML
              </span>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono uppercase tracking-wider font-medium">
                Compliance Ops
              </span>
            </div>
          </Link>

          <div className="flex space-x-1 sm:space-x-4">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === "/"
                  ? location.pathname === "/" ||
                    location.pathname.startsWith("/alerts")
                  : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "text-blue-700 bg-blue-50/80 font-semibold border-b-2 border-blue-700 rounded-b-none"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
            <Activity className="w-3 h-3 mr-1" />
            Engine Active
          </span>
          <div className="flex items-center space-x-2.5 text-sm text-slate-700 border-l border-slate-200 pl-4">
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shadow-inner">
              SJ
            </div>
            <div className="hidden sm:block">
              <span className="font-medium text-slate-800 block text-xs">
                Sarah Jenkins
              </span>
              <span className="text-[10px] text-slate-500 block">
                Lead Compliance Analyst
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
