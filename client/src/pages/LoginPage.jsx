import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Activity,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Stethoscope,
  ShieldAlert,
  AlertCircle,
  KeyRound,
} from "lucide-react";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, switchRole, authError } = useAuth();

  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("testpassword");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLocalError(null);

    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      navigate("/");
    } else {
      setLocalError(
        res.error || "Authentication failed. Please verify credentials.",
      );
    }
  };

  const handleQuickRoleSelect = (role, emailVal) => {
    setEmail(emailVal);
    setPassword("testpassword");
    switchRole(role);
    navigate("/");
  };

  return (
    <div className="min-h-[calc(100vh-57px)] flex items-center justify-center p-6 bg-slate-950 text-slate-100">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-sky-600 text-white rounded-2xl shadow-lg">
            <Activity className="w-8 h-8 text-sky-200 animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            MediCare Core Platform
          </h2>
          <p className="text-xs text-slate-400">
            Hospital Management System &amp; Patient Care Portal
          </p>
          <div className="flex justify-center pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" /> HIPAA Compliant
              Authentication
            </span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>
            </div>

            {/* Test Account Banner */}
            <div className="p-3 bg-sky-950/80 border border-sky-800 rounded-lg text-xs text-sky-200">
              <p className="font-bold flex items-center gap-1.5 text-sky-300">
                <KeyRound className="w-3.5 h-3.5" /> Test account:
                test@example.com / testpassword
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pre-filled credentials for automated QA and development testing.
              </p>
            </div>

            {(localError || authError) && (
              <div className="p-3 bg-rose-950 border border-rose-800 rounded-lg text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{localError || authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg text-sm shadow-md transition-colors cursor-pointer disabled:bg-slate-700"
            >
              {loading ? "Authenticating..." : "Sign In to Portal"}
            </button>
          </form>

          {/* 1-Click Role Switcher for QA / Testing */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
              1-Click Role Access (Development &amp; Demo)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleQuickRoleSelect("PATIENT", "test@example.com")
                }
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold text-center border border-slate-700"
              >
                Patient
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickRoleSelect("DOCTOR", "doctor@example.com")
                }
                className="p-2 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-[11px] font-semibold text-center border border-slate-700"
              >
                Doctor / MD
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickRoleSelect("ADMIN", "admin@example.com")
                }
                className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-[11px] font-semibold text-center border border-slate-700"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
