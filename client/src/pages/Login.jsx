import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/api";
import { Lock, Mail, Sparkles, AlertCircle } from "lucide-react";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("testpassword");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await authService.login(email, password);
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
      navigate("/child-dashboard");
    } catch (err) {
      // In case backend is mocked or returns error, provide informative error without fabricating fake success
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Login failed. Please verify credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestDemo = () => {
    // Demo login for quick exploration
    const demoUser = {
      email: "demo@nutrikids.local",
      role: "parent",
      name: "Demo Parent",
    };
    localStorage.setItem("nutrikids_token", "demo-jwt-token-12345");
    localStorage.setItem("nutrikids_user", JSON.stringify(demoUser));
    if (onLoginSuccess) {
      onLoginSuccess(demoUser);
    }
    navigate("/child-dashboard");
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-amber-100 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-amber-100 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-inner">
            🌱
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-slate-800">
            Welcome to NutriKids
          </h2>
          <p className="text-sm text-slate-500">
            Track healthy eating habits and earn awesome rewards!
          </p>
        </div>

        {/* Test Credentials Helper Card */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start space-x-2">
          <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold">Test Account Pre-filled:</p>
            <p className="text-amber-800 mt-0.5">
              Email:{" "}
              <code className="bg-white/80 px-1 py-0.5 rounded font-mono">
                test@example.com
              </code>{" "}
              | Password:{" "}
              <code className="bg-white/80 px-1 py-0.5 rounded font-mono">
                testpassword
              </code>
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                placeholder="parent@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-full font-bold text-sm shadow-md transition-all transform hover:scale-[1.01]"
          >
            {loading ? "Logging in..." : "Sign In to Portal"}
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-xs text-slate-400 uppercase font-bold">
            Or
          </span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <button
          onClick={handleGuestDemo}
          type="button"
          className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 py-2.5 rounded-full font-bold text-xs shadow-sm transition-colors"
        >
          🎮 Explore as Guest / Demo Mode
        </button>

        <div className="text-center text-xs text-slate-500">
          Don't have an account yet?{" "}
          <Link
            to="/register"
            className="text-amber-600 font-bold hover:underline"
          >
            Register Parent Account
          </Link>
        </div>
      </div>
    </div>
  );
}
