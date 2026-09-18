import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Smartphone, Lock, Mail, ShieldAlert } from "lucide-react";
import { login } from "../services/api";

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("testpassword");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await login({ email, password });
      if (onLoginSuccess) {
        onLoginSuccess(data.user || { email, role: "admin" });
      }
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Authentication failed. Please verify credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/30">
            <Smartphone className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Mobile Management System
          </h1>
          <p className="text-xs text-slate-400">
            Sign in with IT Administrator credentials to manage fleet devices
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 bg-rose-900/40 border border-rose-500/50 rounded-lg text-rose-300 text-xs flex items-center space-x-2"
          >
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-700/80 rounded-lg text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-blue-400">Test Account:</span>
            <p>
              Email:{" "}
              <code className="text-white font-mono">test@example.com</code>
            </p>
            <p>
              Password:{" "}
              <code className="text-white font-mono">testpassword</code>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In to Console"}
          </button>
        </form>
      </div>
    </div>
  );
}
