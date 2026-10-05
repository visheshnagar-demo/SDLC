import React, { useState, useEffect } from "react";
import {
  UserPlus,
  Users,
  Search,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  BookOpen,
  DollarSign,
  UserCheck,
  X,
  Clock,
  ShieldCheck,
} from "lucide-react";
import PatronForm from "../components/PatronForm";
import { getPatrons, createPatron, getPatronLoans } from "../services/api";

export default function PatronsPage() {
  const [patrons, setPatrons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  // Form toggle
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Patron loans drawer/modal
  const [selectedPatronForLoans, setSelectedPatronForLoans] = useState(null);
  const [patronLoans, setPatronLoans] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(false);

  const fetchPatrons = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPatrons();
      setPatrons(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || "Failed to fetch patrons.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatrons();
  }, []);

  const handleRegisterPatron = async (formData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await createPatron(formData);
      setSuccessNotice(
        `Patron "${formData.full_name}" registered successfully.`,
      );
      setShowRegisterForm(false);
      fetchPatrons();
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to register patron.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewPatronLoans = async (patron) => {
    setSelectedPatronForLoans(patron);
    setLoadingLoans(true);
    try {
      const loans = await getPatronLoans(patron.id);
      setPatronLoans(Array.isArray(loans) ? loans : []);
    } catch {
      setPatronLoans([]);
    } finally {
      setLoadingLoans(false);
    }
  };

  // Metrics
  const totalPatrons = patrons.length;
  const activeBorrowers = patrons.filter(
    (p) => (p.active_loans_count ?? 0) > 0,
  ).length;
  const totalFinesDue = patrons.reduce(
    (sum, p) => sum + (p.total_fines_due ?? 0),
    0,
  );

  const filteredPatrons = patrons.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.full_name && p.full_name.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.id && String(p.id).toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Register CTA */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Patron Management Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage library membership profiles, enforce 5-book concurrent borrow
            limits, and monitor fines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPatrons}
            title="Refresh"
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg shadow-sm transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowRegisterForm(!showRegisterForm)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Patron</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Registered Patrons
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {totalPatrons}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Borrowers
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">
            {activeBorrowers}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Fines Accrued
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">
            ${totalFinesDue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Notifications */}
      {successNotice && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold">Patron Operation Error</h4>
            <p className="text-xs mt-0.5 text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {/* Registration Form Card */}
      {showRegisterForm && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-md p-6 mb-8">
          <PatronForm
            onSubmit={handleRegisterPatron}
            onCancel={() => setShowRegisterForm(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {/* Patrons Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>Patron Accounts Ledger</span>
            <span className="text-xs bg-slate-200 text-slate-700 font-mono px-2 py-0.5 rounded-full">
              {filteredPatrons.length} patrons
            </span>
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Loading patron profiles...
          </div>
        ) : filteredPatrons.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No matching patron profiles found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Patron Name & Contact</th>
                  <th className="py-3.5 px-4">Patron UUID</th>
                  <th className="py-3.5 px-4 text-center">Quota Utilization</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Fines Due</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPatrons.map((patron) => {
                  const activeCount = patron.active_loans_count ?? 0;
                  const limit = patron.max_borrow_limit ?? 5;
                  const fines = patron.total_fines_due ?? 0;
                  const isSuspended =
                    patron.account_status === "suspended" || fines > 10;

                  return (
                    <tr
                      key={patron.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {patron.full_name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {patron.email}
                        </div>
                        {patron.phone_number && (
                          <div className="text-[11px] text-slate-400">
                            {patron.phone_number}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                        {patron.id
                          ? `${String(patron.id).slice(0, 8)}...`
                          : "N/A"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              activeCount >= limit
                                ? "bg-rose-100 text-rose-700"
                                : activeCount > 0
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {activeCount} / {limit} books
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            isSuspended
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          {isSuspended ? "Suspended" : "Active"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-semibold text-xs ${
                            fines > 0 ? "text-amber-600" : "text-slate-600"
                          }`}
                        >
                          ${fines.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleViewPatronLoans(patron)}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition inline-flex items-center gap-1.5"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>View Loans</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Patron Loans Modal */}
      {selectedPatronForLoans && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Loan History: {selectedPatronForLoans.full_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedPatronForLoans.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatronForLoans(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingLoans ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                Loading patron loan records...
              </div>
            ) : patronLoans.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                No loans currently on file for this patron.
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {patronLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900">
                        {loan.book_title || `Book ID: ${loan.book_id}`}
                      </div>
                      <div className="text-slate-500 flex items-center gap-2 mt-1">
                        <span>
                          Checked out:{" "}
                          {loan.checkout_date
                            ? loan.checkout_date.split("T")[0]
                            : "N/A"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-700 font-medium">
                          <Clock className="w-3 h-3 text-slate-400" /> Due:{" "}
                          {loan.due_date ? loan.due_date.split("T")[0] : "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-semibold text-[11px] mb-1 ${
                          loan.status === "returned"
                            ? "bg-slate-200 text-slate-700"
                            : loan.status === "overdue"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {loan.status}
                      </span>
                      {(loan.fine_amount ?? 0) > 0 && (
                        <div className="text-rose-600 font-bold">
                          Fine: ${loan.fine_amount.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedPatronForLoans(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
