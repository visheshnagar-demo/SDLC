import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Users,
  Calendar,
  Heart,
  Package,
  Landmark,
  Sparkles,
} from "lucide-react";

export default function Navbar() {
  const location = useLocation();

  const navItems = [
    { path: "/devotees", label: "Devotee Directory", icon: Users },
    { path: "/poojas", label: "Pooja Booking", icon: Calendar },
    { path: "/donations", label: "e-Hundi Donations", icon: Heart },
    { path: "/inventory", label: "Inventory & Vault", icon: Package },
    { path: "/finance", label: "Finance & Audit", icon: Landmark },
  ];

  return (
    <header className="bg-orange-900 text-amber-50 shadow-md border-b-2 border-amber-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500 p-2.5 rounded-full text-orange-950 font-bold text-xl shadow">
              🛕
            </div>
            <div>
              <Link
                to="/devotees"
                className="text-xl font-serif font-bold text-amber-100 hover:text-amber-200"
              >
                Ganesh Temple Management
              </Link>
              <div className="flex items-center text-xs text-amber-300 font-medium mt-0.5">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400" />
                <span>Panchanga: Vinayaka Chaturthi • Shukla Paksha</span>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (location.pathname === "/" && item.path === "/devotees");
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-amber-600 text-white shadow-inner font-semibold"
                      : "text-amber-100 hover:bg-orange-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center space-x-2">
            <div className="bg-orange-800 px-3 py-1.5 rounded-lg border border-amber-600/50 text-right text-xs">
              <div className="font-semibold text-amber-200">Temple Admin</div>
              <div className="text-amber-400">Shift #104 Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden flex overflow-x-auto bg-orange-950 px-2 py-2 space-x-1 border-t border-orange-800">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 py-1.5 rounded text-xs whitespace-nowrap ${
                isActive
                  ? "bg-amber-600 text-white font-semibold"
                  : "text-amber-200 hover:bg-orange-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5 mr-1.5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
