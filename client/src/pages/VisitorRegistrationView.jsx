import React, { useState, useEffect } from "react";
import VisitorRegistrationForm from "../components/VisitorRegistrationForm";
import DigitalPassPreviewCard from "../components/DigitalPassPreviewCard";
import { visitorService } from "../services/api";
import {
  Sparkles,
  ShieldCheck,
  Building2,
  UserCheck,
  Clock,
} from "lucide-react";

export default function VisitorRegistrationView() {
  const [formData, setFormData] = useState({});
  const [hosts, setHosts] = useState([]);
  const [selectedHostName, setSelectedHostName] = useState("");

  useEffect(() => {
    const fetchHosts = async () => {
      try {
        const data = await visitorService.getHosts();
        setHosts(data || []);
      } catch {
        // Silently handled by form component
      }
    };
    fetchHosts();
  }, []);

  useEffect(() => {
    if (formData.host_id && hosts.length > 0) {
      const match = hosts.find((h) => h.id === formData.host_id);
      setSelectedHostName(match ? match.full_name : "");
    }
  }, [formData.host_id, hosts]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8 text-center sm:text-left">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Self-Service Visitor Portal</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome to the Office Visitor Pass System
        </h1>
        <p className="text-slate-600 text-sm mt-1 max-w-2xl">
          Register your upcoming visit to receive building pre-clearance and
          automated host approval notifications.
        </p>
      </div>

      {/* Grid Layout: Form on Left, Live Digital Pass Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7">
          <VisitorRegistrationForm
            onFormChange={(data) => setFormData(data)}
            onSuccess={() => {}}
          />
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
          <DigitalPassPreviewCard
            formData={formData}
            hostName={selectedHostName}
          />

          {/* Guidelines Box */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-indigo-600" />
              Visitor Entry Protocol
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-xs font-bold text-slate-800">
                  1. Register
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Submit details
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-xs font-bold text-slate-800">
                  2. Host Approves
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Receive pass code
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-xs font-bold text-slate-800">
                  3. Check-In
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Front desk badge
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
