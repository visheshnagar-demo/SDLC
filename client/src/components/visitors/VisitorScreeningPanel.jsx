import React, { useState, useEffect } from "react";
import {
  UserCheck,
  ShieldAlert,
  AlertOctagon,
  CheckCircle2,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  getVisitorLogs,
  checkInVisitor,
  checkOutVisitor,
  getInmates,
} from "../../services/api";

export function VisitorScreeningPanel({ userRole = "ADMIN" }) {
  const [visitorLogs, setVisitorLogs] = useState([]);
  const [inmates, setInmates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check-in form state
  const [visitorIdNumber, setVisitorIdNumber] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [selectedInmateId, setSelectedInmateId] = useState("");
  const [relationship, setRelationship] = useState("FAMILY");
  const [submitting, setSubmitting] = useState(false);
  const [screeningResult, setScreeningResult] = useState(null);

  const fetchLogsAndInmates = async () => {
    setLoading(true);
    setError(null);
    try {
      const [logsData, inmatesData] = await Promise.all([
        getVisitorLogs().catch(() => []),
        getInmates().catch(() => []),
      ]);
      setVisitorLogs(Array.isArray(logsData) ? logsData : logsData.items || []);
      setInmates(
        Array.isArray(inmatesData) ? inmatesData : inmatesData.items || [],
      );
    } catch (err) {
      setError(err.message || "Failed to fetch visitor logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogsAndInmates();
  }, []);

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setScreeningResult(null);

    const payload = {
      visitor_id_number: visitorIdNumber,
      visitor_name: visitorName,
      inmate_id: selectedInmateId,
      relationship: relationship,
    };

    try {
      const result = await checkInVisitor(payload);
      setScreeningResult({
        status: "APPROVED",
        message:
          result.message ||
          "Visitor screened & check-in approved. Access granted.",
        data: result,
      });
      setVisitorIdNumber("");
      setVisitorName("");
      setSelectedInmateId("");
      fetchLogsAndInmates();
    } catch (err) {
      const isBlacklisted =
        err.response?.status === 403 ||
        err.response?.data?.detail?.toLowerCase().includes("blacklisted") ||
        err.response?.data?.detail?.toLowerCase().includes("banned");
      setScreeningResult({
        status: isBlacklisted ? "DENIED_BLACKLISTED" : "ERROR",
        message:
          err.response?.data?.detail || err.message || "Check-in failed.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async (logId) => {
    try {
      await checkOutVisitor(logId);
      fetchLogsAndInmates();
    } catch (err) {
      alert(
        "Failed to check out visitor: " +
          (err.response?.data?.detail || err.message),
      );
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded">
        <div>
          <h2 className="text-lg font-bold text-cyan-400 font-mono flex items-center gap-2">
            <UserCheck className="w-5 h-5" /> VISITOR SCREENING & ACCESS CONTROL
            TERMINAL
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            AUTOMATED BLACKLIST SCREENING & REAL-TIME ENTRY LOG
          </p>
        </div>
        <button
          onClick={fetchLogsAndInmates}
          className="p-2 bg-slate-950 text-slate-400 hover:text-cyan-400 rounded border border-slate-800 flex items-center gap-1.5 text-xs font-mono"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Terminal
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visitor Check-In Terminal Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded space-y-4">
          <h3 className="text-md font-bold text-cyan-400 font-mono border-b border-slate-800 pb-2">
            VISITOR CHECK-IN DESK
          </h3>

          {/* Screening Banner Alerts */}
          {screeningResult && (
            <div
              className={`p-3.5 rounded border text-xs font-mono space-y-1 ${
                screeningResult.status === "APPROVED"
                  ? "bg-emerald-950/80 border-emerald-800 text-emerald-300"
                  : screeningResult.status === "DENIED_BLACKLISTED"
                    ? "bg-rose-950/90 border-rose-800 text-rose-300"
                    : "bg-amber-950/80 border-amber-800 text-amber-300"
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {screeningResult.status === "APPROVED" ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>ACCESS GRANTED</span>
                  </>
                ) : screeningResult.status === "DENIED_BLACKLISTED" ? (
                  <>
                    <AlertOctagon className="w-5 h-5 text-rose-400" />
                    <span>ACCESS DENIED - BLACKLISTED VISITOR</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                    <span>SCREENING ERROR</span>
                  </>
                )}
              </div>
              <p>{screeningResult.message}</p>
            </div>
          )}

          <form
            onSubmit={handleCheckInSubmit}
            className="space-y-4 text-xs font-mono"
          >
            <div>
              <label className="block text-slate-400 mb-1">
                Visitor Government ID Number
              </label>
              <input
                type="text"
                value={visitorIdNumber}
                onChange={(e) => setVisitorIdNumber(e.target.value)}
                required
                placeholder="e.g. DL-982143-CA"
                className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Visitor Full Name
              </label>
              <input
                type="text"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                required
                placeholder="e.g. Sarah Connor"
                className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Select Inmate To Visit
              </label>
              <select
                value={selectedInmateId}
                onChange={(e) => setSelectedInmateId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- Choose Inmate --</option>
                {inmates.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.inmate_number || i.id?.slice(0, 8)} - {i.first_name}{" "}
                    {i.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Relationship / Visit Type
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="FAMILY">FAMILY MEMBER</option>
                <option value="LEGAL">LEGAL COUNSEL / ATTORNEY</option>
                <option value="OFFICIAL">GOVERNMENT / LAW ENFORCEMENT</option>
                <option value="FRIEND">FRIEND / PERSONAL</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded shadow flex items-center justify-center gap-2"
            >
              {submitting
                ? "Screening Blacklist Database..."
                : "Run Blacklist Check & Process Check-In"}
            </button>
          </form>
        </div>

        {/* Active Visitor Entry Log Table */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-5 rounded space-y-4">
          <h3 className="text-md font-bold text-white font-mono border-b border-slate-800 pb-2 flex items-center justify-between">
            <span>ACTIVE VISITOR LOGS</span>
            <span className="text-xs text-cyan-400 font-mono">
              {
                visitorLogs.filter(
                  (v) => !v.check_out_time || v.status === "CHECKED_IN",
                ).length
              }{" "}
              Active On-Site
            </span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Visitor Name</th>
                  <th className="p-3">Gov ID</th>
                  <th className="p-3">Inmate ID</th>
                  <th className="p-3">Check In Time</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-slate-500">
                      Loading active visitor logs...
                    </td>
                  </tr>
                ) : visitorLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-slate-500">
                      No active visitor logs recorded today.
                    </td>
                  </tr>
                ) : (
                  visitorLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-semibold text-white">
                        {log.visitor_name}
                      </td>
                      <td className="p-3 text-slate-400">
                        {log.visitor_id_number}
                      </td>
                      <td className="p-3 text-cyan-400">
                        {log.inmate_id?.slice(0, 8)}
                      </td>
                      <td className="p-3 text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {log.check_in_time
                          ? new Date(log.check_in_time).toLocaleTimeString()
                          : "Just now"}
                      </td>
                      <td className="p-3 text-right">
                        {!log.check_out_time && log.status !== "COMPLETED" ? (
                          <button
                            onClick={() => handleCheckOut(log.id)}
                            className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 text-amber-400 rounded border border-amber-800 text-[11px] font-semibold"
                          >
                            Check Out
                          </button>
                        ) : (
                          <span className="text-slate-600 italic">
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VisitorScreeningPanel;
