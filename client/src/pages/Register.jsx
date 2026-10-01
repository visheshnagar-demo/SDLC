import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService, profileService } from "../services/api";
import { Lock, Mail, User, Sparkles, AlertCircle } from "lucide-react";

export default function Register({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [childName, setChildName] = useState("Leo");
  const [childAge, setChildAge] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const authData = await authService.register(email, password, "parent");

      // Auto create initial child profile
      try {
        const newChild = await profileService.createChild({
          display_name: childName,
          age: parseInt(childAge, 10),
          avatar_id: "default-sprout",
        });
        profileService.setSelectedChild(newChild);
      } catch {
        // Child creation fallback
      }

      if (onLoginSuccess) {
        onLoginSuccess(authData.user);
      }
      navigate("/child-dashboard");
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Registration failed. Please check inputs.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-amber-100 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-100 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-inner">
            🌱
          </div>
          <h2 className="font-heading text-2xl font-bold text-slate-800">
            Create Parent Account
          </h2>
          <p className="text-sm text-slate-500">
            Join NutriKids to guide your child's healthy habits
          </p>
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
              Parent Email
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
              Create Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                placeholder="At least 6 characters"
              />
            </div>
          </div>

          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-emerald-900 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Child Profile Details</span>
            </h4>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Child's Name / Nickname
              </label>
              <input
                type="text"
                required
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-emerald-400"
                placeholder="e.g. Leo"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Child's Age
              </label>
              <input
                type="number"
                min="3"
                max="17"
                required
                value={childAge}
                onChange={(e) => setChildAge(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-full font-bold text-sm shadow-md transition-all transform hover:scale-[1.01]"
          >
            {loading ? "Creating Account..." : "Complete Sign Up"}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-amber-600 font-bold hover:underline"
          >
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
