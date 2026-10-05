import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  AlertTriangle,
  Check,
  X,
  ShieldAlert,
} from "lucide-react";
import { checkoutBook } from "../services/api";

export default function CheckoutTerminal({
  books = [],
  patrons = [],
  preselectedBook = null,
  preselectedPatron = null,
  onCheckoutSuccess,
  onClose,
}) {
  const [selectedPatronId, setSelectedPatronId] = useState(
    preselectedPatron?.id || "",
  );
  const [selectedBookId, setSelectedBookId] = useState(
    preselectedBook?.id || "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (preselectedBook?.id) setSelectedBookId(preselectedBook.id);
  }, [preselectedBook]);

  useEffect(() => {
    if (preselectedPatron?.id) setSelectedPatronId(preselectedPatron.id);
  }, [preselectedPatron]);

  const selectedPatron = patrons.find(
    (p) => String(p.id) === String(selectedPatronId),
  );
  const selectedBook = books.find(
    (b) => String(b.id) === String(selectedBookId),
  );

  const isPatronAtLimit =
    selectedPatron &&
    (selectedPatron.active_loans_count ?? 0) >=
      (selectedPatron.max_borrow_limit ?? 5);

  const isBookUnavailable =
    selectedBook && (selectedBook.available_copies ?? 0) <= 0;

  // Auto 14-day loan date preview
  const checkoutDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  const formatDate = (d) =>
    d.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const handleCheckout = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!selectedPatronId) {
      setErrorMsg("Please select a patron.");
      return;
    }
    if (!selectedBookId) {
      setErrorMsg("Please select a book to checkout.");
      return;
    }
    if (isBookUnavailable) {
      setErrorMsg("Selected volume has zero available copies.");
      return;
    }
    if (isPatronAtLimit) {
      setErrorMsg(
        "Patron has reached their maximum borrowing limit (5 books).",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await checkoutBook({
        patron_id: selectedPatronId,
        book_id: selectedBookId,
      });
      setSuccessMsg(
        "Book checkout completed successfully! Due date set to 14 days from today.",
      );
      if (onCheckoutSuccess) {
        setTimeout(() => {
          onCheckoutSuccess(result);
        }, 1200);
      }
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Failed to process checkout transaction.";
      setErrorMsg(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 max-w-2xl w-full">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Circulation Checkout Terminal
            </h2>
            <p className="text-xs text-slate-500">
              Issue book loan to registered patron
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleCheckout} className="space-y-4">
        {/* Patron Selector */}
        <div>
          <label
            htmlFor="checkout-patron"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
          >
            Select Patron <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              id="checkout-patron"
              value={selectedPatronId}
              onChange={(e) => setSelectedPatronId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose a Patron --</option>
              {patrons.map((p) => {
                const activeCount = p.active_loans_count ?? 0;
                const limit = p.max_borrow_limit ?? 5;
                return (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.email}) — [{activeCount}/{limit} books]
                  </option>
                );
              })}
            </select>
          </div>
          {isPatronAtLimit && (
            <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Patron has reached
              maximum borrowing limit ({selectedPatron?.max_borrow_limit ?? 5}{" "}
              books).
            </p>
          )}
        </div>

        {/* Book Selector */}
        <div>
          <label
            htmlFor="checkout-book"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
          >
            Select Book Title <span className="text-rose-500">*</span>
          </label>
          <select
            id="checkout-book"
            value={selectedBookId}
            onChange={(e) => setSelectedBookId(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Choose a Book --</option>
            {books.map((b) => (
              <option
                key={b.id}
                value={b.id}
                disabled={(b.available_copies ?? 0) <= 0}
              >
                {b.title} by {b.author} (ISBN: {b.isbn}) — [{b.available_copies}{" "}
                available / {b.total_copies} total]
              </option>
            ))}
          </select>
          {isBookUnavailable && (
            <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> This book is currently
              out of stock.
            </p>
          )}
        </div>

        {/* Loan Terms & Policy Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-4 h-4 text-slate-500" /> Checkout Date:
            </span>
            <span className="font-semibold text-slate-800">
              {formatDate(checkoutDate)}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-4 h-4 text-blue-600" /> Loan Due Date (14
              Days):
            </span>
            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {formatDate(dueDate)}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-500 pt-2 border-t border-slate-200">
            <span>Standard Overdue Fee Rate:</span>
            <span className="font-mono font-medium text-slate-700">
              $0.50 / day late
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={
              isSubmitting ||
              !selectedPatronId ||
              !selectedBookId ||
              isBookUnavailable ||
              isPatronAtLimit
            }
            className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg shadow-sm transition flex items-center gap-2"
          >
            {isSubmitting ? (
              "Processing Loan..."
            ) : (
              <>
                <span>Confirm & Issue Loan</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
