import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  UserPlus,
  CheckSquare,
  Building2,
  History,
  LogIn,
  LogOut,
  User,
  Activity,
  X,
  KeyRound,
} from "lucide-react";
import { authService } from "../services/api";

export default function TopNavBar({ currentUser, onUserChange }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("test@example.com");
  const [loginPassword, setLoginPassword] = useState("testpassword");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const navLinks = [
    { to: "/register", label: "Pre-Register", icon: UserPlus },
    { to: "/approvals", label: "Host Approvals", icon: CheckSquare },
    { to: "/reception", label: "Reception Desk", icon: Building2 },
    { to: "/history", label: "Audit History", icon: History },
  ];

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const data = await authService.login(loginEmail, loginPassword);
      if (onUserChange) onUserChange(data.user);
      setShowLoginModal(false);
    } catch (err) {
      setLoginError(err.message || "Authentication failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleQuickRoleSelect = (email, password) => {
    setLoginEmail(email);
    setLoginPassword(password);
  };

  const handleLogout = () => {
    authService.logout();
    if (onUserChange) onUserChange(null);
    navigate("/register");
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <Link to="/register" className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 tracking-tight block leading-tight">
                  PassVault
                </span>
                <span className="text-xs text-slate-500 font-medium tracking-wide uppercase">
                  Office Visitor Pass System
                </span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center pl-4 border-l border-slate-200 ml-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Activity className="w-3 h-3 mr-1 animate-pulse text-emerald-500" />
                System Active
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 mr-2 ${isActive ? "text-indigo-600" : "text-slate-400"}`}
                  />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User Account / Auth Actions */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800">
                    {currentUser.full_name}
                  </span>
                  <span className="text-[11px] font-medium text-indigo-600 uppercase tracking-wider">
                    {currentUser.role}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-200">
                  {currentUser.full_name ? (
                    currentUser.full_name.charAt(0).toUpperCase()
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors"
              >
                <LogIn className="w-4 h-4 mr-1.5" />
                Staff Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="flex md:hidden border-t border-slate-100 py-2 overflow-x-auto space-x-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex-shrink-0 inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5 mr-1" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Staff Portal Sign In
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
              {loginError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="name@company.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="••••••••"
                />
              </div>

              {/* Quick Role Fill Buttons for instant QA & testing */}
              <div className="pt-2 border-t border-slate-100">
                <span className="block text-xs text-slate-500 font-medium mb-2">
                  Quick-Fill Test Accounts:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickRoleSelect("test@example.com", "testpassword")
                    }
                    className="px-2 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-center"
                  >
                    Host
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickRoleSelect(
                        "receptionist@example.com",
                        "receptionistpassword",
                      )
                    }
                    className="px-2 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-center"
                  >
                    Receptionist
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickRoleSelect(
                        "admin@example.com",
                        "adminpassword",
                      )
                    }
                    className="px-2 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-center"
                  >
                    Admin
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Default: test@example.com / testpassword
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm shadow-md shadow-indigo-100 transition-colors disabled:opacity-50"
                >
                  {loginLoading ? "Authenticating..." : "Sign In"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
