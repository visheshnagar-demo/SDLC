import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  Sparkles,
  Ticket,
  QrCode,
  ShieldAlert,
  BarChart3,
  Menu,
  X,
  User,
} from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Browse Events", path: "/events", icon: Sparkles },
    { name: "My Passes", path: "/my-passes", icon: Ticket },
    { name: "Gate Scanner", path: "/scanner", icon: QrCode },
    { name: "Admin Console", path: "/admin", icon: BarChart3 },
  ];

  return (
    <header className="bg-[#0f172a] border-b border-[#f59e0b]/20 sticky top-0 z-50 shadow-lg backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/events" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f59e0b] to-[#be185d] flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <span className='font-["Syne"] text-xl font-bold bg-gradient-to-r from-[#f59e0b] via-[#ffc174] to-[#f43f5e] bg-clip-text text-transparent'>
                GarbaFest 2026
              </span>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase -mt-1">
                Pass & Gate Management
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 shadow-sm"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right side test info & status */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#0b1326] border border-amber-500/20 px-3 py-1.5 rounded-full text-xs text-amber-200/90">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>HMAC SHA-256 Secured</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-full text-xs text-slate-300">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono">test@example.com</span>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0f172a] border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium ${
                    isActive
                      ? "bg-[#f59e0b]/20 text-[#f59e0b]"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </header>
  );
}

export default Navbar;
