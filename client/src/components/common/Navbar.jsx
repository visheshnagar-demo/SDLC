import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Flower2,
  LayoutDashboard,
  ShoppingBag,
  Users,
  Plus,
} from "lucide-react";

export default function Navbar({ onOpenCreateOrder }) {
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Flower Catalog", path: "/flowers", icon: Flower2 },
    { name: "Orders", path: "/orders", icon: ShoppingBag },
    { name: "Suppliers", path: "/suppliers", icon: Users },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3">
              <div className="bg-emerald-600 text-white p-2 rounded-lg shadow-sm">
                <Flower2 className="w-6 h-6" />
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">
                Blossom Manager
              </span>
            </Link>

            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onOpenCreateOrder}
              className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Order</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
