import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Ticket,
  ShieldCheck,
  BarChart3,
  Calendar,
  LogIn,
  UserPlus,
  LogOut,
  User,
} from "lucide-react";

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, isSecurity, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-md border-b border-[#F59E0B]/20 px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/events" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#BE185D] to-[#F59E0B] p-0.5 shadow-lg shadow-[#F59E0B]/20">
            <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center group-hover:bg-transparent transition-colors">
              <span className="text-xl">🪔</span>
            </div>
          </div>
          <div>
            <div className="font-display font-extrabold text-xl tracking-tight bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#BE185D] bg-clip-text text-transparent">
              GarbaFest
            </div>
            <div className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">
              Management Portal
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <Link
            to="/events"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              isActive("/events") || isActive("/")
                ? "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30"
                : "text-slate-300 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Browse Events</span>
          </Link>

          {isAuthenticated && (
            <Link
              to="/my-passes"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                isActive("/my-passes")
                  ? "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>My Passes</span>
            </Link>
          )}

          {isSecurity && (
            <Link
              to="/scanner"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                isActive("/scanner")
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Gate Scanner</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin/dashboard"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                isActive("/admin/dashboard") || isActive("/admin")
                  ? "bg-[#BE185D]/10 text-[#F43F5E] border border-[#BE185D]/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Admin Console</span>
            </Link>
          )}
        </nav>

        {/* User Profile / Auth Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2.5 bg-slate-900 border border-slate-700/60 rounded-full py-1.5 px-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#F59E0B] to-[#BE185D] flex items-center justify-center text-xs font-bold text-white">
                  {user?.full_name
                    ? user.full_name.charAt(0).toUpperCase()
                    : "U"}
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 block leading-none">
                    {user?.full_name || user?.email}
                  </span>
                  <span className="text-[10px] text-[#F59E0B] font-mono leading-none">
                    {user?.role || "ATTENDEE"}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-800/60 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 bg-gradient-to-r from-[#F59E0B] to-[#BE185D] hover:opacity-95 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-[#F59E0B]/20 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
