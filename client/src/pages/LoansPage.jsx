import React, { useState, useEffect, useMemo } from "react";
import {
  PlusCircle,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Search,
  BookOpen,
  DollarSign,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import CheckoutTerminal from "../components/CheckoutTerminal";
import { getLoans, returnBook, getBooks, getPatrons } from "../services/api";

export default function LoansPage() {
  const [loans, setLoans] = useState([]);
  const [books, setBooks] = useState([]);
  const [patrons, setPatrons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  // Filter state
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'active', 'overdue', 'returned'
  const [searchQuery, setSearchQuery] = useState("");

  // Checkout modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);

  const fetchCirculationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [loansData, booksData, patronsData] = await Promise.all([
        getLoans(),
        getBooks().catch(() => []),
        getPatrons().catch(() => []),
      ]);
      setLoans(Array.isArray(loansData) ? loansData : []);
      setBooks(Array.isArray(booksData) ? booksData : []);
      setPatrons(Array.isArray(patronsData) ? patronsData : []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to fetch circulation records.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCirculationData();
  }, []);

  const handleProcessReturn = async (loan) => {
    try {
      setIsProcessingReturn(true);
      setError(null);
      const result = await returnBook(loan.id);
      const fineMsg =
        (result?.fine_amount ?? 0) > 0
          ? ` (Overdue fine accrued: $${result.fine_amount.toFixed(2)})`
          : " (Returned on time with $0 fine)";
      setSuccessNotice(`Book return processed successfully!${fineMsg}`);
      fetchCirculationData();
      setTimeout(() => setSuccessNotice(null), 5000);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to process book return.",
      );
    } finally {
      setIsProcessingReturn(false);
    }
  };

  // Helper mapping
  const booksMap = useMemo(() => {
    const map = {};
    books.forEach((b) => {
      map[b.id] = b;
    });
    return map;
  }, [books]);

  const patronsMap = useMemo(() => {
    const map = {};
    patrons.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [patrons]);

  // Derived loan statistics
  const today = new Date();

  const enrichedLoans = useMemo(() => {
    return loans.map((loan) => {
      const book = booksMap[loan.book_id] || {};
      const patron = patronsMap[loan.patron_id] || {};

      const dueDate = loan.due_date ? new Date(loan.due_date) : null;

      const isReturned =
        Boolean(loan.return_date) || loan.status === "returned";
      const isOverdue =
        !isReturned &&
        (loan.status === "overdue" || (dueDate && dueDate < today));

      // Calculate fine dynamically if overdue
      let computedFine = loan.fine_amount ?? 0;
      if (isOverdue && dueDate && computedFine === 0) {
        const diffTime = today - dueDate;
        const diffDays = Math.max(
          0,
          Math.ceil(diffTime / (1000 * 60 * 60 * 24)),
        );
        computedFine = diffDays * 0.5;
      }

      return {
        ...loan,
        bookTitle: loan.book_title || book.title || `Book #${loan.book_id}`,
        bookAuthor: book.author || "",
        patronName:
          loan.patron_name || patron.full_name || `Patron #${loan.patron_id}`,
        patronEmail: patron.email || "",
        isReturned,
        isOverdue,
        computedFine,
      };
    });
  }, [loans, booksMap, patronsMap, today]);

  const activeLoansCount = enrichedLoans.filter((l) => !l.isReturned).length;
  const overdueLoansCount = enrichedLoans.filter((l) => l.isOverdue).length;
  const returnedLoansCount = enrichedLoans.filter((l) => l.isReturned).length;
  const totalFinesDue = enrichedLoans.reduce(
    (sum, l) => sum + (l.computedFine || 0),
    0,
  );

  // Tab & search filtering
  const filteredLoans = useMemo(() => {
    return enrichedLoans.filter((l) => {
      if (activeTab === "active" && l.isReturned) return false;
      if (activeTab === "overdue" && !l.isOverdue) return false;
      if (activeTab === "returned" && !l.isReturned) return false;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        l.bookTitle.toLowerCase().includes(q) ||
        l.patronName.toLowerCase().includes(q) ||
        (l.patronEmail && l.patronEmail.toLowerCase().includes(q)) ||
        String(l.id).toLowerCase().includes(q)
      );
    });
  }, [enrichedLoans, activeTab, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & New Loan CTA */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Circulation Desk & Loans
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Issue book checkouts, monitor loan due dates (14-day policy),
            calculate $0.50/day overdue fines, and process returns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCirculationData}
            title="Refresh loans"
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg shadow-sm transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCheckoutModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Issue New Loan</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Loans
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {activeLoansCount}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Overdue Loans
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">
            {overdueLoansCount}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Returned Volumes
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">
            {returnedLoansCount}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Accrued Fines
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
            <h4 className="font-semibold">Circulation Error</h4>
            <p className="text-xs mt-0.5 text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {/* Tab Navigation & Search */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === "all"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
              }`}
            >
              All Loans ({enrichedLoans.length})
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === "active"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
              }`}
            >
              Active ({activeLoansCount})
            </button>
            <button
              onClick={() => setActiveTab("overdue")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === "overdue"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200"
              }`}
            >
              Overdue ({overdueLoansCount})
            </button>
            <button
              onClick={() => setActiveTab("returned")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === "returned"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
              }`}
            >
              Returned ({returnedLoansCount})
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search loan by title, patron, or ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Loans Table */}
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Loading circulation ledger...
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No loan records found for current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Book Title</th>
                  <th className="py-3.5 px-4">Patron Profile</th>
                  <th className="py-3.5 px-4">Checkout Date</th>
                  <th className="py-3.5 px-4">Due Date (14d)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Fine Amount</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredLoans.map((loan) => (
                  <tr
                    key={loan.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {loan.bookTitle}
                      </div>
                      {loan.bookAuthor && (
                        <div className="text-xs text-slate-500">
                          by {loan.bookAuthor}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {loan.patronName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {loan.patronEmail}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {loan.checkout_date
                        ? loan.checkout_date.split("T")[0]
                        : "N/A"}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium">
                      <span
                        className={
                          loan.isOverdue
                            ? "text-rose-600 font-bold flex items-center gap-1"
                            : "text-slate-700"
                        }
                      >
                        {loan.isOverdue && (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        {loan.due_date ? loan.due_date.split("T")[0] : "N/A"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          loan.isReturned
                            ? "bg-slate-100 text-slate-600 border border-slate-200"
                            : loan.isOverdue
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {loan.isReturned
                          ? "Returned"
                          : loan.isOverdue
                            ? "Overdue"
                            : "Active"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`font-semibold text-xs ${
                          loan.computedFine > 0
                            ? "text-rose-600"
                            : "text-slate-500"
                        }`}
                      >
                        ${loan.computedFine.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!loan.isReturned ? (
                        <button
                          type="button"
                          onClick={() => handleProcessReturn(loan)}
                          disabled={isProcessingReturn}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 rounded-lg shadow-sm transition inline-flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Return Book</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Returned
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <CheckoutTerminal
            books={books}
            patrons={patrons}
            onCheckoutSuccess={() => {
              setShowCheckoutModal(false);
              fetchCirculationData();
            }}
            onClose={() => setShowCheckoutModal(false)}
          />
        </div>
      )}
    </div>
  );
}
