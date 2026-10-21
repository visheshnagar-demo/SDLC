import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, Mail, LogIn, Sparkles, Shield, UserCheck } from "lucide-react";

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("testpassword");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fillTestCredentials = (testEmail, testPass) => {
    setEmail(testEmail);
    setPassword(testPass);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ email, password });
      navigate("/events");
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        "Invalid email or password. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md bg-[#0F172A] border border-[#F59E0B]/30 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#BE185D]/20 to-[#F59E0B]/10 rounded-full blur-3xl -z-10" />

        <div className="text-center space-y-2 mb-8">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-[#BE185D] to-[#F59E0B] p-0.5 shadow-lg shadow-[#F59E0B]/20 flex items-center justify-center">
            <span className="text-2xl">🪔</span>
          </div>
          <h2 className="text-2xl font-extrabold font-display text-slate-100">
            Welcome to GarbaFest
          </h2>
          <p className="text-xs text-slate-400">
            Sign in to access your digital passes and manage bookings
          </p>
        </div>

        {/* Quick Test Login Chips */}
        <div className="mb-6 p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
          <span className="text-[11px] font-bold text-[#F59E0B] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Quick Fill Test Accounts
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                fillTestCredentials("test@example.com", "testpassword")
              }
              className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 border border-slate-700 transition-all flex items-center justify-center gap-1"
            >
              <UserCheck className="w-3 h-3 text-emerald-400" />
              <span>Attendee</span>
            </button>
            <button
              type="button"
              onClick={() =>
                fillTestCredentials("admin@example.com", "adminpassword")
              }
              className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 border border-slate-700 transition-all flex items-center justify-center gap-1"
            >
              <Shield className="w-3 h-3 text-[#BE185D]" />
              <span>Admin / Security</span>
            </button>
          </div>
        </div>

        {error && (
          <div
            className="mb-6 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs font-medium"
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-display font-extrabold text-sm bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#BE185D] hover:opacity-95 text-slate-950 shadow-lg shadow-[#F59E0B]/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? "Authenticating..." : "Sign In to Portal"}</span>
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-[#F59E0B] hover:underline font-semibold"
          >
            Create an Attendee Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
