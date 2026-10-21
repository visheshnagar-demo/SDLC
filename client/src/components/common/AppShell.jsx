import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  Users,
  UserCheck,
  Calendar,
  FileText,
  LayoutDashboard,
  Search,
  Bell,
  ShieldCheck,
  HeartPulse,
  Menu,
  X,
} from "lucide-react";

export function AppShell({ children }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Patients", href: "/patients", icon: Users },
    { name: "Doctors & Schedules", href: "/doctors", icon: UserCheck },
    { name: "Appointments", href: "/appointments", icon: Calendar },
    { name: "Clinical EMR", href: "/consultations", icon: FileText },
  ];

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-slate-900 border-r border-slate-800 text-slate-100 flex-shrink-0">
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-600 text-white shadow-md">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white block">
              CarePulse OS
            </span>
            <span className="text-[11px] text-indigo-400 font-medium tracking-wide uppercase block">
              Hospital Portal
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between p-4 overflow-y-auto">
          <nav className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Clinical & Operations
            </div>
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 mt-auto border-t border-slate-800 space-y-3">
            {/* Seed Credentials / Compliance Badge */}
            <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Test Credentials</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Staff:{" "}
                <span className="text-slate-200 font-mono">
                  test@example.com
                </span>
                <br />
                Pass:{" "}
                <span className="text-slate-200 font-mono">testpassword</span>
              </p>
            </div>

            <div className="flex items-center gap-3 px-2 py-1">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                DR
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  Dr. Marcus Smith
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  Cardiology Dept (Admin)
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/80 backdrop-blur-sm">
          <div className="w-64 bg-slate-900 text-white flex flex-col p-4 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-6 h-6 text-indigo-500" />
                <span className="font-bold text-lg">CarePulse OS</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="mt-4 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative w-64 md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patients, doctors, appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
              <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>System Online</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">{currentDate}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                title="Notifications"
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default AppShell;
