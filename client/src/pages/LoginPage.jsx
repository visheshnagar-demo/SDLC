import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TopNavbar } from "../components/layout/TopNavbar";
import { Footer } from "../components/layout/Footer";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, Lock, Mail, AlertCircle } from "lucide-react";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "test@example.com",
    password: "testpassword",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(formData);
      navigate("/");
    } catch (err) {
      console.error("Login attempt failed", err);
      const msg =
        err.response?.data?.detail ||
        "Invalid authentication credentials. Please verify your email and password.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121316] text-[#F8F9FA] flex flex-col">
      <TopNavbar />

      <main className="flex-1 max-w-md w-full mx-auto px-6 py-16 flex flex-col justify-center">
        <div className="bg-[#181B22] border border-[#232733] p-8 rounded-2xl space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#896C00] via-[#D4AF37] to-[#F2CA50] flex items-center justify-center text-[#0A0B0E] font-bold mx-auto shadow-md">
              <ShieldCheck className="w-7 h-7 text-[#0A0B0E]" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#F8F9FA]">
              Collector Vault Sign In
            </h1>
            <p className="text-xs text-[#9EACB9]">
              Access certified timepiece reservation and escrow tracking.
            </p>
          </div>

          {/* Test Account Banner (Mandatory) */}
          <div className="bg-[#12141A] border border-[#D4AF37]/40 p-3 rounded-lg text-xs space-y-1 text-[#9EACB9]">
            <div className="text-[#F2CA50] font-semibold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Test Account Credentials</span>
            </div>
            <div className="font-mono text-[11px] text-[#F8F9FA]">
              Test account:{" "}
              <span className="text-[#D4AF37]">test@example.com</span> /{" "}
              <span className="text-[#D4AF37]">testpassword</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-950/60 border border-red-500/50 text-red-200 text-xs p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-xs font-semibold text-[#9EACB9] block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9EACB9]" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="test@example.com"
                  className="w-full bg-[#12141A] border border-[#232733] focus:border-[#D4AF37] rounded-lg pl-9 pr-3 py-2.5 text-sm text-[#F8F9FA] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#9EACB9] block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9EACB9]" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#12141A] border border-[#232733] focus:border-[#D4AF37] rounded-lg pl-9 pr-3 py-2.5 text-sm text-[#F8F9FA] focus:outline-none font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#D4AF37] hover:bg-[#E5C158] disabled:bg-[#896C00] text-[#0A0B0E] font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-[#D4AF37]/10"
            >
              {isLoading ? "AUTHENTICATING VAULT..." : "SIGN IN TO VAULT"}
            </button>
          </form>

          <div className="text-center text-xs text-[#9EACB9] pt-2 border-t border-[#232733]">
            Don't have a collector account?{" "}
            <Link
              to="/register"
              className="text-[#D4AF37] hover:text-[#E5C158] font-semibold"
            >
              Register for Atelier Access
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LoginPage;
