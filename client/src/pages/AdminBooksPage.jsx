import React, { useState, useEffect } from "react";
import {
  Plus,
  BookMarked,
  Edit2,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Library,
  BookCheck,
  BookX,
} from "lucide-react";
import BookAdminForm from "../components/BookAdminForm";
import { getBooks, createBook, updateBook, deleteBook } from "../services/api";

export default function AdminBooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Table search
  const [tableSearch, setTableSearch] = useState("");

  // Delete confirmation modal state
  const [bookToDelete, setBookToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBooks();
      setBooks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to fetch inventory.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleCreateBook = async (formData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await createBook(formData);
      setSuccessNotice(
        `Successfully added "${formData.title}" to library catalog.`,
      );
      setShowAddForm(false);
      fetchBooks();
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to create book record.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBook = async (formData) => {
    if (!editingBook?.id) return;
    try {
      setIsSubmitting(true);
      setError(null);
      await updateBook(editingBook.id, formData);
      setSuccessNotice(
        `Successfully updated volume details for "${formData.title}".`,
      );
      setEditingBook(null);
      fetchBooks();
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || "Failed to update book.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!bookToDelete) return;
    try {
      setIsDeleting(true);
      setError(null);
      await deleteBook(bookToDelete.id);
      setSuccessNotice(
        `Book "${bookToDelete.title}" has been deleted from catalog.`,
      );
      setBookToDelete(null);
      fetchBooks();
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to delete book record.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats calculation
  const totalTitles = books.length;
  const totalCopies = books.reduce((sum, b) => sum + (b.total_copies ?? 0), 0);
  const availableCopies = books.reduce(
    (sum, b) => sum + (b.available_copies ?? 0),
    0,
  );
  const borrowedCopies = totalCopies - availableCopies;

  const filteredBooks = books.filter((b) => {
    const q = tableSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (b.title && b.title.toLowerCase().includes(q)) ||
      (b.author && b.author.toLowerCase().includes(q)) ||
      (b.isbn && b.isbn.toLowerCase().includes(q)) ||
      (b.genre && b.genre.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Add CTA */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Inventory & Catalog Administration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Add new volumes, manage ISBN registry, replenish copy counts, and
            maintain library inventory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBooks}
            title="Refresh"
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg shadow-sm transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setEditingBook(null);
              setShowAddForm(!showAddForm);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Book</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Titles
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookMarked className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {totalTitles}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Copies
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Library className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {totalCopies}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Available On Shelf
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BookCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">
            {availableCopies}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              In Circulation
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <BookX className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">
            {borrowedCopies}
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
            <h4 className="font-semibold">Inventory Operation Error</h4>
            <p className="text-xs mt-0.5 text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {/* Add / Edit Form Card */}
      {(showAddForm || editingBook) && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-md p-6 mb-8">
          <BookAdminForm
            initialData={editingBook}
            onSubmit={editingBook ? handleUpdateBook : handleCreateBook}
            onCancel={() => {
              setShowAddForm(false);
              setEditingBook(null);
            }}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {/* Inventory Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Top Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>Catalog Volume Ledger</span>
            <span className="text-xs bg-slate-200 text-slate-700 font-mono px-2 py-0.5 rounded-full">
              {filteredBooks.length} items
            </span>
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Filter inventory records..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Loading catalog inventory...
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No matching book entries found in catalog.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Book Title & Author</th>
                  <th className="py-3.5 px-4">ISBN</th>
                  <th className="py-3.5 px-4">Genre</th>
                  <th className="py-3.5 px-4">Year</th>
                  <th className="py-3.5 px-4 text-center">Available / Total</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredBooks.map((book) => {
                  const isAvailable = (book.available_copies ?? 0) > 0;
                  return (
                    <tr
                      key={book.id || book.isbn}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {book.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {book.author}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                        {book.isbn}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {book.genre || "General"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        {book.publication_year || "N/A"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                            isAvailable
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {book.available_copies} / {book.total_copies}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setShowAddForm(false);
                              setEditingBook(book);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition"
                            title="Edit Volume"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setBookToDelete(book)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition"
                            title="Delete Book"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {bookToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Confirm Deletion
              </h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to remove{" "}
              <strong className="text-slate-900">"{bookToDelete.title}"</strong>{" "}
              (ISBN: {bookToDelete.isbn}) from the library catalog? This action
              cannot be undone if there are no active loans.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setBookToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 rounded-lg transition"
              >
                {isDeleting ? "Deleting..." : "Delete Book"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
