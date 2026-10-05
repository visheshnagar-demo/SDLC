import React, { useState, useEffect } from "react";
import { PlusCircle, Save, X, AlertCircle } from "lucide-react";

const GENRES = [
  "Fiction",
  "Non-Fiction",
  "Science",
  "History",
  "Technology",
  "Biography",
  "Mystery",
  "Fantasy",
  "Poetry",
  "Philosophy",
  "Classic",
];

export default function BookAdminForm({
  initialData = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) {
  const isEditing = Boolean(initialData && initialData.id);

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    genre: "Fiction",
    publication_year: new Date().getFullYear(),
    total_copies: 1,
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        author: initialData.author || "",
        isbn: initialData.isbn || "",
        genre: initialData.genre || "Fiction",
        publication_year:
          initialData.publication_year || new Date().getFullYear(),
        total_copies: initialData.total_copies ?? 1,
      });
    } else {
      setFormData({
        title: "",
        author: "",
        isbn: "",
        genre: "Fiction",
        publication_year: new Date().getFullYear(),
        total_copies: 1,
      });
    }
    setFormErrors({});
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number" ? (value === "" ? "" : parseInt(value, 10)) : value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = "Title is required";
    if (!formData.author.trim()) errors.author = "Author is required";
    if (!formData.isbn.trim()) {
      errors.isbn = "ISBN is required";
    } else {
      const cleanIsbn = formData.isbn.replace(/[-\s]/g, "");
      if (cleanIsbn.length !== 10 && cleanIsbn.length !== 13) {
        errors.isbn = "ISBN should be 10 or 13 digits (e.g. 9780743273565)";
      }
    }
    if (!formData.genre) errors.genre = "Genre is required";
    if (
      !formData.publication_year ||
      formData.publication_year < 1000 ||
      formData.publication_year > 2100
    ) {
      errors.publication_year = "Enter a valid year between 1000 and 2100";
    }
    if (!formData.total_copies || formData.total_copies < 1) {
      errors.total_copies = "Total copies must be at least 1";
    }
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          {isEditing ? (
            <Save className="w-5 h-5 text-blue-600" />
          ) : (
            <PlusCircle className="w-5 h-5 text-blue-600" />
          )}
          {isEditing ? "Update Book Volume" : "Add New Book Volume"}
        </h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
        >
          Book Title <span className="text-rose-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g. The Great Gatsby"
          className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
            formErrors.title
              ? "border-rose-400 bg-rose-50/30"
              : "border-slate-300 bg-white"
          }`}
        />
        {formErrors.title && (
          <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {formErrors.title}
          </p>
        )}
      </div>

      {/* Author & ISBN Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="author"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
          >
            Author <span className="text-rose-500">*</span>
          </label>
          <input
            id="author"
            name="author"
            type="text"
            value={formData.author}
            onChange={handleChange}
            placeholder="e.g. F. Scott Fitzgerald"
            className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
              formErrors.author
                ? "border-rose-400 bg-rose-50/30"
                : "border-slate-300 bg-white"
            }`}
          />
          {formErrors.author && (
            <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {formErrors.author}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="isbn"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
          >
            ISBN <span className="text-rose-500">*</span>
          </label>
          <input
            id="isbn"
            name="isbn"
            type="text"
            value={formData.isbn}
            onChange={handleChange}
            placeholder="e.g. 9780743273565"
            className={`w-full px-3 py-2 text-sm font-mono rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
              formErrors.isbn
                ? "border-rose-400 bg-rose-50/30"
                : "border-slate-300 bg-white"
            }`}
          />
          {formErrors.isbn && (
            <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {formErrors.isbn}
            </p>
          )}
        </div>
      </div>

      {/* Genre, Publication Year, Copies Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="genre"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
          >
            Genre <span className="text-rose-500">*</span>
          </label>
          <select
            id="genre"
            name="genre"
            value={formData.genre}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="publication_year"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
          >
            Pub. Year <span className="text-rose-500">*</span>
          </label>
          <input
            id="publication_year"
            name="publication_year"
            type="number"
            min="1000"
            max="2100"
            value={formData.publication_year}
            onChange={handleChange}
            className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formErrors.publication_year
                ? "border-rose-400 bg-rose-50/30"
                : "border-slate-300 bg-white"
            }`}
          />
          {formErrors.publication_year && (
            <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {formErrors.publication_year}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="total_copies"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
          >
            Total Copies <span className="text-rose-500">*</span>
          </label>
          <input
            id="total_copies"
            name="total_copies"
            type="number"
            min="1"
            value={formData.total_copies}
            onChange={handleChange}
            className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formErrors.total_copies
                ? "border-rose-400 bg-rose-50/30"
                : "border-slate-300 bg-white"
            }`}
          />
          {formErrors.total_copies && (
            <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {formErrors.total_copies}
            </p>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg shadow-sm transition flex items-center gap-2"
        >
          {isEditing ? (
            <Save className="w-4 h-4" />
          ) : (
            <PlusCircle className="w-4 h-4" />
          )}
          {isSubmitting
            ? "Saving..."
            : isEditing
              ? "Update Volume"
              : "Add Book to Catalog"}
        </button>
      </div>
    </form>
  );
}
