import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Shield,
  Key,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export const LoginPage = () => {
  const { loginUser, registerUser, loading } = useAuth();
  const navigate = useNavigate();

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("testpassword");
  const [fullName, setFullName] = useState("John Farm Manager");
  const [role, setRole] = useState("farm_manager");
  const [errorMsg, setErrorMsg] = useState("");
  const [successNotice, setSuccessNotice] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessNotice("");

    try {
      if (isRegistering) {
        await registerUser({
          email,
          password,
          full_name: fullName,
          role,
        });
        setSuccessNotice("Registration successful! Logging you in...");
      }

      await loginUser(email, password);
      navigate("/dashboard");
    } catch (err) {
      setErrorMsg(
        err.message || "Authentication failed. Please verify credentials.",
      );
    }
  };

  const fillQuickAccount = (type) => {
    if (type === "manager") {
      setEmail("manager@example.com");
      setPassword("testpassword");
      setFullName("Jane Manager");
      setRole("farm_manager");
    } else {
      setEmail("worker@example.com");
      setPassword("testpassword");
      setFullName("Bob Worker");
      setRole("farm_worker");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-4xl mb-2">🐮</div>
        <h2 className="text-center text-2xl font-extrabold text-white tracking-tight">
          CattleTrack Pro
        </h2>
        <p className="mt-1 text-center text-xs text-emerald-400 font-medium">
          Livestock Cattle Management & Milk Yield Tracking
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-700">
          {/* Test Account Banner */}
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs">
            <div className="flex items-center space-x-1.5 font-bold mb-1">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span>Test Credentials Seeded:</span>
            </div>
            <p className="text-[11px] text-emerald-800">
              Email: <strong>test@example.com</strong> / Password:{" "}
              <strong>testpassword</strong>
            </p>
            <div className="mt-2 pt-2 border-t border-emerald-200 flex gap-2">
              <button
                type="button"
                onClick={() => fillQuickAccount("manager")}
                className="text-[10px] bg-white border border-emerald-300 px-2 py-0.5 rounded text-emerald-800 font-semibold hover:bg-emerald-100"
              >
                Use Manager Login
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount("worker")}
                className="text-[10px] bg-white border border-emerald-300 px-2 py-0.5 rounded text-emerald-800 font-semibold hover:bg-emerald-100"
              >
                Use Worker Login
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successNotice && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="test@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="farm_manager">
                    Farm Manager (Full Admin & CRUD)
                  </option>
                  <option value="farm_worker">
                    Farm Worker (Milking & Health Logging)
                  </option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition"
            >
              {loading
                ? "Processing..."
                : isRegistering
                  ? "Create Farm Account"
                  : "Sign In to Dashboard"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setErrorMsg("");
              }}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              {isRegistering
                ? "Already have an account? Sign in"
                : "Need a new account? Register here"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
