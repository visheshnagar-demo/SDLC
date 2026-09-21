import React, { useState, useEffect } from "react";
import IntakeForm from "../components/IntakeForm.jsx";
import { createInmate, getInmates } from "../services/api.js";
import { Users, Search, RefreshCw, ShieldCheck } from "lucide-react";

export default function IntakePage() {
  const [inmates, setInmates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchInmateList = async () => {
    setLoading(true);
    try {
      const data = await getInmates({ search: searchTerm });
      setInmates(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      console.warn("API fallback to sample inmate data:", err);
      // Fallback sample data if backend not active
      setInmates([
        {
          id: "inmate-101",
          first_name: "Marcus",
          last_name: "Vance",
          booking_number: "BK-2026-0001",
          security_level: "Maximum",
          gang_affiliation: "Northside Syndicate",
          status: "Booked",
        },
        {
          id: "inmate-102",
          first_name: "Damian",
          last_name: "Reed",
          booking_number: "BK-2026-0002",
          security_level: "Medium",
          gang_affiliation: "Eastside Kings",
          status: "Booked",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInmateList();
  }, []);

  const handleInmateSubmit = async (formData) => {
    const res = await createInmate(formData);
    await fetchInmateList();
    return res;
  };

  const filteredInmates = inmates.filter((i) =>
    `${i.first_name} ${i.last_name} ${i.booking_number}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight">
          Inmate Intake & Booking Dashboard
        </h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Automated booking workflow with duplicate SSN checks, risk
          classification & charge registry
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-7">
          <IntakeForm onSubmitInmate={handleInmateSubmit} />
        </div>

        {/* Right Column: Inmate Directory */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-6 shadow-xl text-[#F8FAFC]">
            <div className="flex justify-between items-center pb-4 border-b border-[#334155] mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-[#2563EB]">
                <Users className="w-5 h-5" /> Recent Facility Inmates (
                {filteredInmates.length})
              </h2>
              <button
                onClick={fetchInmateList}
                className="p-1.5 bg-[#1E293B] hover:bg-[#334155] rounded text-slate-300"
                title="Refresh list"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            <div className="mb-4 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search inmate name or booking #..."
                className="w-full bg-[#090D16] border border-[#334155] rounded-lg pl-9 pr-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredInmates.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No inmates match search filter.
                </div>
              ) : (
                filteredInmates.map((i) => (
                  <div
                    key={i.id || i.booking_number}
                    className="p-3 bg-[#090D16] border border-[#334155] rounded-lg hover:border-[#2563EB] transition-colors flex justify-between items-start text-xs"
                  >
                    <div>
                      <div className="font-bold text-white text-sm">
                        {i.first_name} {i.last_name}
                      </div>
                      <div className="text-[#94A3B8] font-mono mt-0.5">
                        Booking #:{" "}
                        <span className="text-[#38BDF8] font-semibold">
                          {i.booking_number || "BK-2026-XXXX"}
                        </span>
                      </div>
                      <div className="text-slate-400 mt-1">
                        Gang: {i.gang_affiliation || "None"}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 bg-blue-900/50 text-blue-300 border border-blue-500/30 rounded text-[10px] font-bold">
                        {i.security_level || "Medium"}
                      </span>
                      <div className="text-[10px] text-emerald-400 font-semibold mt-2 flex items-center gap-1 justify-end">
                        <ShieldCheck className="w-3 h-3" />{" "}
                        {i.status || "Active"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
