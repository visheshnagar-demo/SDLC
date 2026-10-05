import React, { useState } from "react";
import { UserPlus, X, AlertCircle, Info } from "lucide-react";

export default function PatronForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    max_borrow_limit: 5,
  });

  const [formErrors, setFormErrors] = useState({});

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
    if (!formData.full_name.trim()) errors.full_name = "Full name is required";
    if (!formData.email.trim()) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Enter a valid email address";
    }
    if (!formData.max_borrow_limit || formData.max_borrow_limit < 1) {
      errors.max_borrow_limit = "Borrow limit must be at least 1 book";
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
          <UserPlus className="w-5 h-5 text-blue-600" />
          Register New Patron
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <span>
          New patrons are automatically assigned a unique UUID identifier and
          standard 5-book concurrent borrowing quota.
        </span>
      </div>

      {/* Full Name */}
      <div>
        <label
          htmlFor="full_name"
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
        >
          Full Name <span className="text-rose-500">*</span>
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          value={formData.full_name}
          onChange={handleChange}
          placeholder="e.g. Jane Doe"
          className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
            formErrors.full_name
              ? "border-rose-400 bg-rose-50/30"
              : "border-slate-300 bg-white"
          }`}
        />
        {formErrors.full_name && (
          <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {formErrors.full_name}
          </p>
        )}
      </div>

      {/* Email & Phone Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
          >
            Email Address <span className="text-rose-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="e.g. jane.doe@example.com"
            className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
              formErrors.email
                ? "border-rose-400 bg-rose-50/30"
                : "border-slate-300 bg-white"
            }`}
          />
          {formErrors.email && (
            <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {formErrors.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="phone_number"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
          >
            Phone Number{" "}
            <span className="text-slate-400 text-[10px]">(Optional)</span>
          </label>
          <input
            id="phone_number"
            name="phone_number"
            type="tel"
            value={formData.phone_number}
            onChange={handleChange}
            placeholder="e.g. +1 (555) 019-2834"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Borrowing Limit */}
      <div>
        <label
          htmlFor="max_borrow_limit"
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
        >
          Concurrent Borrowing Quota <span className="text-rose-500">*</span>
        </label>
        <input
          id="max_borrow_limit"
          name="max_borrow_limit"
          type="number"
          min="1"
          max="20"
          value={formData.max_borrow_limit}
          onChange={handleChange}
          className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            formErrors.max_borrow_limit
              ? "border-rose-400 bg-rose-50/30"
              : "border-slate-300 bg-white"
          }`}
        />
        {formErrors.max_borrow_limit && (
          <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {formErrors.max_borrow_limit}
          </p>
        )}
      </div>

      {/* Action Buttons */}
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
          <UserPlus className="w-4 h-4" />
          {isSubmitting ? "Registering..." : "Register Patron"}
        </button>
      </div>
    </form>
  );
}
