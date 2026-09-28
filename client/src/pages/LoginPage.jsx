import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LogIn,
  Lock,
  Mail,
  AlertCircle,
  Sparkles,
  Loader2,
} from "lucide-react";

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("testpassword");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to authenticate. Please verify credentials.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full bg-[#1E293B] border border-slate-700/80 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/20">
            <LogIn size={24} />
          </div>
          <h1 className="text-2xl font-black text-white">
            Sign In to NeuroLearn
          </h1>
          <p className="text-xs text-slate-400">
            Access your AI/ML tracks, code snippets, and learning dashboard.
          </p>
        </div>

        {/* Test Account Helper Callout */}
        <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-xs text-indigo-200 flex items-start gap-2.5">
          <Sparkles size={16} className="text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Test Account: </span>
            <span className="font-mono text-cyan-300">
              test@example.com
            </span> /{" "}
            <span className="font-mono text-cyan-300">testpassword</span>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <LogIn size={16} />
            )}
            <span>{isSubmitting ? "Signing In..." : "Sign In"}</span>
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-700/60">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
