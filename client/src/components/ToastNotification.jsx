import React, { useEffect } from "react";

export default function ToastNotification({ toast, onClose }) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === "error";

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full animate-slide-in">
      <div
        className={`p-4 rounded-lg shadow-xl border flex items-start space-x-3 text-white ${
          isError
            ? "bg-red-600 border-red-700"
            : "bg-emerald-600 border-emerald-700"
        }`}
      >
        <span className="text-xl" role="img" aria-label="alert-icon">
          {isError ? "🚨" : "✅"}
        </span>
        <div className="flex-1">
          <h4 className="font-bold text-sm leading-tight">{toast.title}</h4>
          <p className="text-xs mt-1 text-slate-100 opacity-95 leading-relaxed">
            {toast.message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-slate-200 text-lg font-bold leading-none focus:outline-none"
          aria-label="Close notification"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
