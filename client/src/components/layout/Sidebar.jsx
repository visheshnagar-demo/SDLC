import React from "react";
import { NavLink } from "react-router-dom";
import {
  Shield,
  LayoutDashboard,
  Package,
  ShieldCheck,
  Wrench,
  FileText,
  LogOut,
} from "lucide-react";

export default function Sidebar({ user, onLogout }) {
  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Products", path: "/products", icon: Package },
    { name: "Warranties", path: "/warranties", icon: ShieldCheck },
    { name: "Claims", path: "/claims", icon: Wrench },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0 min-h-screen">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              WarrantyVault
            </h1>
            <p className="text-xs text-slate-400">Personal Warranty Manager</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5" aria-label="Sidebar Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon className="w-5 h-5 text-slate-300" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="p-3 bg-slate-800/60 rounded-lg mb-3">
          <div className="text-xs text-slate-400">Signed in as</div>
          <div className="text-sm font-semibold text-white truncate">
            {user?.full_name || user?.email || "Alex Morgan"}
          </div>
          <div className="text-xs text-indigo-400 truncate">
            {user?.email || "test@example.com"}
          </div>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </aside>
  );
}
