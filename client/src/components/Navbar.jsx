import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Tv,
  Radio,
  Calendar,
  FileText,
  Clock,
  Shield,
  UserCheck,
} from "lucide-react";

export default function Navbar({ currentUser, onRoleChange }) {
  const location = useLocation();
  const [utcTime, setUtcTime] = useState("");
  const [estTime, setEstTime] = useState("");

  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + " UTC");
      setEstTime(
        now.toLocaleTimeString("en-US", {
          timeZone: "America/New_York",
          hour12: false,
        }) + " EST",
      );
    };
    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { path: "/", label: "Master Control", icon: Tv },
    { path: "/channels", label: "Channels & Programs", icon: Radio },
    { path: "/schedule", label: "Rundown Scheduler", icon: Calendar },
    { path: "/editorial", label: "Editorial Desk", icon: FileText },
  ];

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-slate-100 px-6 py-3 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Branding & Logo */}
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-mono font-semibold tracking-wider text-blue-400">
              GLOBAL NEWS NETWORK
            </div>
            <div className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              MASTER CONTROL CENTER
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
                LIVE
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-blue-600 text-white shadow border border-blue-500/50"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Clocks & Role/User Info */}
        <div className="flex items-center space-x-4">
          <div className="hidden lg:flex items-center space-x-3 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-blue-300 font-semibold">{utcTime}</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-300">{estTime}</span>
          </div>

          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <Shield className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <div className="font-semibold text-slate-200 leading-none">
                {currentUser?.full_name || "Operator Admin"}
              </div>
              <div className="text-[10px] text-amber-400 font-mono uppercase mt-0.5">
                ROLE: {currentUser?.role || "News Manager"}
              </div>
            </div>
            {onRoleChange && (
              <select
                value={currentUser?.role || "News Manager"}
                onChange={(e) => onRoleChange(e.target.value)}
                className="ml-2 bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded px-1 py-0.5 focus:outline-none"
              >
                <option value="Admin">Admin</option>
                <option value="News Manager">News Manager</option>
                <option value="Editor">Editor</option>
                <option value="Journalist">Journalist</option>
                <option value="Operator">Operator</option>
              </select>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
