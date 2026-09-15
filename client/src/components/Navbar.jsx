import React from "react";
import {
  Mail,
  Sparkles,
  LayoutDashboard,
  Shield,
  Activity,
} from "lucide-react";

export const Navbar = ({ activeTab, onTabChange, apiStatus }) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Email Classifier AI
              </span>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
                v1.0.0
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Intelligent Categorization &amp; Review Studio
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => onTabChange("studio")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
              activeTab === "studio"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Classify Studio</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange("dashboard")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
              activeTab === "dashboard"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Review Dashboard</span>
          </button>
        </nav>

        {/* System & API Status */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
            <Activity
              className={`h-3.5 w-3.5 ${
                apiStatus === "online"
                  ? "text-emerald-500 animate-pulse"
                  : apiStatus === "offline"
                    ? "text-rose-500"
                    : "text-amber-500"
              }`}
            />
            <span>
              API:{" "}
              {apiStatus === "online"
                ? "Connected"
                : apiStatus === "offline"
                  ? "Disconnected"
                  : "Checking..."}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Shield className="h-3.5 w-3.5 text-indigo-500" />
            <span>AI Powered</span>
          </div>
        </div>
      </div>
    </header>
  );
};
