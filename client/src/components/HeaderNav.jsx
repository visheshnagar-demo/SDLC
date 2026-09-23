import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Compass, Sparkles, Globe } from "lucide-react";

export function HeaderNav() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-primary-600 hover:text-primary-700 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-primary-700 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                WanderAI
              </span>
              <span className="hidden sm:inline-block ml-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-100 text-primary-800 border border-primary-200">
                AI Planner
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 sm:space-x-4">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/"
                  ? "bg-primary-50 text-primary-700 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Plan Trip
            </Link>
            <a
              href="#saved-trips"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Saved Trips
            </a>
            <a
              href="#explore"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Explore Destinations
            </a>
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
              <Globe className="w-4 h-4 text-slate-500" />
              <span>Multi-Currency</span>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-sm transition-all shadow-primary-500/25 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">New Itinerary</span>
              <span className="sm:hidden">New</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default HeaderNav;
