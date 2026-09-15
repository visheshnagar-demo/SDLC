import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  UserCheck,
  UserPlus,
  Send,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { visitorService } from "../services/api";

export default function VisitorRegistrationForm({ onFormChange, onSuccess }) {
  const [hosts, setHosts] = useState([]);
  const [hostsLoading, setHostsLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    company: "",
    purpose: "Business Meeting / Collaboration",
    scheduled_start_time: "",
    host_id: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registeredVisit, setRegisteredVisit] = useState(null);

  useEffect(() => {
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setFormData((prev) => {
      const updated = { ...prev, scheduled_start_time: localIso };
      if (onFormChange) onFormChange(updated);
      return updated;
    });

    const fetchHosts = async () => {
      try {
        setHostsLoading(true);
        const data = await visitorService.getHosts();
        setHosts(data || []);
        if (data && data.length > 0) {
          setFormData((prev) => {
            const updated = { ...prev, host_id: data[0].id };
            if (onFormChange) onFormChange(updated);
            return updated;
          });
        }
      } catch (err) {
        setError("Failed to load host employee directory: " + err.message);
      } finally {
        setHostsLoading(false);
      }
    };

    fetchHosts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    if (onFormChange) {
      onFormChange(updated);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const isoDateTime = new Date(formData.scheduled_start_time).toISOString();
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        company: formData.company ? formData.company.trim() : null,
        purpose: formData.purpose.trim(),
        scheduled_start_time: isoDateTime,
        host_id: formData.host_id,
      };

      const result = await visitorService.register(payload);
      setRegisteredVisit(result);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      setError(
        err.message || "Registration failed. Please check your information.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRegisteredVisit(null);
    setError("");
    setFormData((prev) => ({
      ...prev,
      full_name: "",
      email: "",
      phone: "",
      company: "",
      purpose: "Business Meeting / Collaboration",
    }));
  };

  if (registeredVisit) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
          Request Submitted Successfully
        </span>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">
          Pre-Registration Awaiting Host Approval
        </h3>
        <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
          A notification has been dispatched to{" "}
          <strong className="text-slate-900">
            {registeredVisit.host?.full_name || "your host"}
          </strong>
          . Once approved, you will receive an entry pass code via email.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-md mx-auto mb-6 text-left space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Visitor:</span>
            <span className="font-semibold text-slate-800">
              {registeredVisit.visitor?.full_name}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Email:</span>
            <span className="font-semibold text-slate-800">
              {registeredVisit.visitor?.email}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Visit Status:</span>
            <span className="font-bold text-amber-600 uppercase">
              {registeredVisit.status}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Tracking Reference:</span>
            <span className="font-mono font-bold text-indigo-600">
              {registeredVisit.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Register Another Visitor
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
        <div className="flex items-center space-x-3 mb-1">
          <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-300">
            <UserPlus className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold">Visitor Pre-Registration</h2>
        </div>
        <p className="text-slate-300 text-xs">
          Provide your details to request access to the building and receive
          your digital pass.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold">Registration Issue</h4>
              <p className="text-xs text-rose-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Section 1: Personal Details */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            1. Personal & Contact Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Name *
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g. Alex Johnson"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Address *
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="alex.johnson@example.com"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Phone Number *
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 019-2834"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Company / Organization
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Acme Corp / Independent"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Visit Details & Host Selection */}
        <div className="pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            2. Host & Visit Schedule
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Host Employee to Visit *
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <select
                  name="host_id"
                  required
                  disabled={hostsLoading}
                  value={formData.host_id}
                  onChange={handleChange}
                  className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  {hostsLoading ? (
                    <option value="">Loading host directory...</option>
                  ) : hosts.length === 0 ? (
                    <option value="">No active hosts available</option>
                  ) : (
                    hosts.map((host) => (
                      <option key={host.id} value={host.id}>
                        {host.full_name} ({host.department || "General Staff"} —{" "}
                        {host.email})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Scheduled Date & Arrival Time *
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="datetime-local"
                  name="scheduled_start_time"
                  required
                  value={formData.scheduled_start_time}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Purpose of Visit *
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Clock className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="purpose"
                  required
                  value={formData.purpose}
                  onChange={handleChange}
                  placeholder="e.g. Vendor Pitch / Client Review"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            * All required fields must be completed.
          </div>
          <button
            type="submit"
            disabled={loading || hostsLoading}
            className="inline-flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-100 transition-all disabled:opacity-50"
          >
            {loading ? (
              "Submitting Request..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Pre-Registration
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
