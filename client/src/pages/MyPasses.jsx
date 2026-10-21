import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyPasses } from "../services/api";
import { useAuth } from "../context/AuthContext";
import DigitalPassCard from "../components/DigitalPassCard";
import {
  Ticket,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Calendar,
} from "lucide-react";

export const MyPasses = () => {
  const { isAuthenticated, user } = useAuth();
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPasses = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getMyPasses();
      setPasses(data || []);
    } catch (err) {
      setError("Unable to load passes. Please ensure you are logged in.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPasses();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B]">
          <Ticket className="w-8 h-8" />
        </div>
        <h2 className="font-display font-extrabold text-2xl text-slate-100">
          Sign In to Access Your Wallet
        </h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Please log in to view your encrypted digital QR passes, check entry
          status, and present them at gate checkpoints.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#BE185D] text-slate-950 font-bold text-xs shadow-lg shadow-[#F59E0B]/20"
        >
          <span>Sign In to Portal</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#F59E0B] uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Digital Pass Wallet</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-slate-100 mt-1">
            My Garba Passes
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically signed with HMAC SHA-256 for instantaneous gate
            entry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPasses}
            disabled={loading}
            className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
          <Link
            to="/events"
            className="py-2 px-4 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#BE185D] hover:opacity-95 text-slate-950 text-xs font-bold shadow-md shadow-[#F59E0B]/15 transition-all"
          >
            + Book Another Pass
          </Link>
        </div>
      </div>

      {error && (
        <div
          className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-2xl text-rose-300 text-xs flex items-center gap-2"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Passes Grid */}
      {loading ? (
        <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#F59E0B] animate-spin mx-auto" />
          <p className="text-xs text-slate-400">
            Loading your digital wallet passes...
          </p>
        </div>
      ) : passes.length === 0 ? (
        <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-16 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="font-display font-bold text-lg text-slate-200">
            No Passes Found in Your Wallet
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You haven't booked any Garba nights yet. Browse available events and
            secure your digital entry passes.
          </p>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-[#F59E0B] text-slate-950 font-bold text-xs"
          >
            <Calendar className="w-4 h-4" />
            <span>Browse Events & Book Now</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {passes.map((pass) => (
            <DigitalPassCard
              key={pass.id}
              pass={pass}
              eventTitle={pass.event_title || "GarbaFest Night"}
              tierName={pass.tier_name || "FESTIVAL PASS"}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPasses;
