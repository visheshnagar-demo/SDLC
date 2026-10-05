import React from "react";
import { Book, CheckCircle, XCircle, Calendar, Hash, Tag } from "lucide-react";

export default function BookCard({ book, onBorrowClick }) {
  const isAvailable = (book?.available_copies ?? 0) > 0;

  const getGenreColor = (genre) => {
    switch ((genre || "").toLowerCase()) {
      case "fiction":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "science":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "history":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "technology":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "biography":
        return "bg-rose-100 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
      <div>
        {/* Genre Pill & Stock Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1 ${getGenreColor(
              book.genre,
            )}`}
          >
            <Tag className="w-3 h-3" />
            {book.genre || "General"}
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 border ${
              isAvailable
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            {isAvailable ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{book.available_copies} Available</span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Out of Stock</span>
              </>
            )}
          </span>
        </div>

        {/* Book Title & Author */}
        <h3 className="text-lg font-bold text-slate-900 line-clamp-2 mb-1 title-case">
          {book.title}
        </h3>
        <p className="text-sm text-slate-600 mb-4 font-medium">
          by {book.author}
        </p>

        {/* Meta details: ISBN, Year, Total copies */}
        <div className="space-y-1.5 text-xs text-slate-500 bg-slate-50 rounded-lg p-3 border border-slate-100 mb-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-slate-600">
              <Hash className="w-3.5 h-3.5 text-slate-400" /> ISBN:
            </span>
            <span className="font-mono font-medium text-slate-800">
              {book.isbn}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Published:
            </span>
            <span className="font-medium text-slate-800">
              {book.publication_year || "N/A"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-slate-600">
              <Book className="w-3.5 h-3.5 text-slate-400" /> Total Inventory:
            </span>
            <span className="font-medium text-slate-800">
              {book.total_copies} copies
            </span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        disabled={!isAvailable}
        onClick={() => onBorrowClick && onBorrowClick(book)}
        className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 ${
          isAvailable
            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
        }`}
      >
        <Book className="w-4 h-4" />
        {isAvailable ? "Borrow / Check Out" : "Unavailable"}
      </button>
    </div>
  );
}
