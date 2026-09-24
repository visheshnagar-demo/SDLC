import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Briefcase,
  Building2,
  Users,
  Settings,
  Bell,
  Shield,
  User,
  ChevronDown,
} from "lucide-react";

export default function AppLayout({ children, userRole, setUserRole }) {
  const location = useLocation();

  const navItems = [
    { name: "Jobs", path: "/jobs", icon: Briefcase },
    { name: "Departments", path: "/departments", icon: Building2 },
    { name: "Candidates", path: "/candidates", icon: Users },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Banner / Test Credentials Notice */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center space-x-2 max-w-7xl mx-auto w-full justify-between">
          <span className="flex items-center space-x-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>
              <strong>TalentFlow Jobs Management System</strong> &mdash; Test
              account:{" "}
              <code className="bg-slate-800 px-1.5 py-0.5 rounded text-blue-300">
                test@example.com
              </code>{" "}
              /{" "}
              <code className="bg-slate-800 px-1.5 py-0.5 rounded text-blue-300">
                testpassword
              </code>
            </span>
          </span>
          <div className="flex items-center space-x-3">
            <span className="text-slate-400">Current Role:</span>
            <select
              value={userRole || "admin"}
              onChange={(e) => setUserRole && setUserRole(e.target.value)}
              className="bg-slate-800 text-slate-200 text-xs px-2 py-0.5 rounded border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-label="Select User Role"
            >
              <option value="admin">Manager / Admin (Full Access)</option>
              <option value="guest">Public Guest (Published Only)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Header / Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/jobs" className="flex items-center space-x-2.5">
                <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  T
                </div>
                <span className="text-xl font-bold text-slate-900 tracking-tight">
                  TalentFlow
                </span>
              </Link>

              <nav className="hidden md:flex space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-600 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`}
                      />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full"></span>
              </button>

              <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs border border-blue-200">
                  HM
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-900">
                    Hiring Manager
                  </div>
                  <div className="text-[11px] text-slate-500 capitalize">
                    {userRole || "admin"} Mode
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <p>
            © {new Date().getFullYear()} TalentFlow Jobs Management. All rights
            reserved.
          </p>
          <div className="flex space-x-4 text-slate-400">
            <span>Status: Operational</span>
            <span>API: /api/v1/jobs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
