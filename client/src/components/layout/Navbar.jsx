import React from "react";
import { NavLink } from "react-router-dom";
import {
  Package,
  LayoutDashboard,
  ListFilter,
  ClipboardList,
} from "lucide-react";

export default function Navbar() {
  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Items Catalog", path: "/items", icon: ListFilter },
    { name: "Adjustments & Audit", path: "/adjustments", icon: ClipboardList },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Package className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl text-blue-600 tracking-tight">
                InventoryPro
              </span>
            </div>

            <nav className="flex space-x-1 sm:space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    className={({ isActive }) =>
                      `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              System Online
            </span>
            <div className="text-xs text-slate-500 hidden sm:block">
              Role: Inventory Manager
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
