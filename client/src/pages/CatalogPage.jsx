import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  BookOpen,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  X,
} from "lucide-react";
import BookCard from "../components/BookCard";
import CheckoutTerminal from "../components/CheckoutTerminal";
import { getBooks, getPatrons } from "../services/api";

const GENRES = [
  "All Genres",
  "Fiction",
  "Non-Fiction",
  "Science",
  "History",
  "Technology",
  "Biography",
  "Mystery",
  "Fantasy",
  "Classic",
];

export default function CatalogPage() {
  const [books, setBooks] = useState([]);
  const [patrons, setPatrons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All Genres");
  const [availableOnly, setAvailableOnly] = useState(false);

  // Modal state
  const [selectedBookForCheckout, setSelectedBookForCheckout] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [booksData, patronsData] = await Promise.all([
        getBooks(),
        getPatrons().catch(() => []),
      ]);
      setBooks(Array.isArray(booksData) ? booksData : []);
      setPatrons(Array.isArray(patronsData) ? patronsData : []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to load catalog data.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      // Search match
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (book.title && book.title.toLowerCase().includes(q)) ||
        (book.author && book.author.toLowerCase().includes(q)) ||
        (book.genre && book.genre.toLowerCase().includes(q)) ||
        (book.isbn && book.isbn.toLowerCase().includes(q));

      // Genre match
      const matchGenre =
        selectedGenre === "All Genres" ||
        (book.genre &&
          book.genre.toLowerCase() === selectedGenre.toLowerCase());

      // Availability match
      const matchAvailable = !availableOnly || (book.available_copies ?? 0) > 0;

      return matchSearch && matchGenre && matchAvailable;
    });
  }, [books, searchQuery, selectedGenre, availableOnly]);

  const totalCopiesCount = books.reduce(
    (acc, b) => acc + (b.total_copies ?? 0),
    0,
  );
  const availableCopiesCount = books.reduce(
    (acc, b) => acc + (b.available_copies ?? 0),
    0,
  );

  const handleOpenBorrow = (book) => {
    setSelectedBookForCheckout(book);
    setShowCheckoutModal(true);
  };

  const handleCheckoutSuccess = () => {
    setShowCheckoutModal(false);
    setSelectedBookForCheckout(null);
    fetchData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header & Stats Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Library Book Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse, search, and check out volumes from the campus archive.
          </p>
        </div>

        {/* Catalog Quick Stats */}
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-xs">
          <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-semibold flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span>{books.length} Titles</span>
          </div>
          <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg font-semibold flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            <span>
              {availableCopiesCount} / {totalCopiesCount} Copies Available
            </span>
          </div>
          <button
            onClick={fetchData}
            title="Refresh catalog"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <label htmlFor="catalog-search" className="sr-only">
              Search Catalog
            </label>
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="catalog-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, genre, or ISBN (e.g. Gatsby)..."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                aria-label="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Genre Dropdown */}
          <div className="md:col-span-3 relative">
            <label htmlFor="genre-select" className="sr-only">
              Filter by Genre
            </label>
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Filter className="w-4 h-4" />
            </div>
            <select
              id="genre-select"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Available Only Toggle Switch */}
          <div className="md:col-span-3 flex items-center justify-end">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none text-sm font-medium text-slate-700 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition w-full justify-center md:w-auto">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span>In-Stock Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Catalog Connection Error</h4>
            <p className="text-xs mt-0.5 text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200 p-5 h-64 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-6 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
              <div className="h-10 bg-slate-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filteredBooks.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            No matching volumes found
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Try adjusting your search query, genre selection, or availability
            filter.
          </p>
          {(searchQuery || selectedGenre !== "All Genres" || availableOnly) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedGenre("All Genres");
                setAvailableOnly(false);
              }}
              className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        /* Books Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id || book.isbn}
              book={book}
              onBorrowClick={handleOpenBorrow}
            />
          ))}
        </div>
      )}

      {/* Checkout Modal Terminal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <CheckoutTerminal
            books={books}
            patrons={patrons}
            preselectedBook={selectedBookForCheckout}
            onCheckoutSuccess={handleCheckoutSuccess}
            onClose={() => setShowCheckoutModal(false)}
          />
        </div>
      )}
    </div>
  );
}
