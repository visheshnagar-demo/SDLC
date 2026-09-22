import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TopNavbar } from "../components/layout/TopNavbar";
import { Footer } from "../components/layout/Footer";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, Lock, Mail, User, AlertCircle } from "lucide-react";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      await register({
        full_name: formData.fullName,
        email: formData.email,
        password: formData.password,
      });
      navigate("/");
    } catch (err) {
      console.error("Registration error", err);
      const msg =
        err.response?.data?.detail ||
        "Registration could not be completed. Please try another email address.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121316] text-[#F8F9FA] flex flex-col">
      <TopNavbar />

      <main className="flex-1 max-w-md w-full mx-auto px-6 py-14 flex flex-col justify-center">
        <div className="bg-[#181B22] border border-[#232733] p-8 rounded-2xl space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#896C00] via-[#D4AF37] to-[#F2CA50] flex items-center justify-center text-[#0A0B0E] font-bold mx-auto shadow-md">
              <ShieldCheck className="w-7 h-7 text-[#0A0B0E]" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#F8F9FA]">
              Create Collector Account
            </h1>
            <p className="text-xs text-[#9EACB9]">
              Join the certified pre-owned luxury horology marketplace.
            </p>
          </div>

          {error && (
            <div className="bg-red-950/60 border border-red-500/50 text-red-200 text-xs p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="text-xs font-semibold text-[#9EACB9] block mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9EACB9]" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Alex Mercer"
                  className="w-full bg-[#12141A] border border-[#232733] focus:border-[#D4AF37] rounded-lg pl-9 pr-3 py-2.5 text-sm text-[#F8F9FA] focus:outline-none"
                />
              </div>
            </div>

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
                  placeholder="alex.mercer@example.com"
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

            <div>
              <label className="text-xs font-semibold text-[#9EACB9] block mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9EACB9]" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
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
              className="w-full bg-[#D4AF37] hover:bg-[#E5C158] disabled:bg-[#896C00] text-[#0A0B0E] font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-[#D4AF37]/10 mt-2"
            >
              {isLoading ? "REGISTERING COLLECTOR..." : "COMPLETE REGISTRATION"}
            </button>
          </form>

          <div className="text-center text-xs text-[#9EACB9] pt-2 border-t border-[#232733]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#D4AF37] hover:text-[#E5C158] font-semibold"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RegisterPage;
