import React from "react";

export default function ErrorToast({
  title = "403 Forbidden: Policy Violation",
  message,
  onDismiss,
}) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg text-red-800 shadow-md flex justify-between items-center transition-all animate-fade-in"
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg
            className="h-5 w-5 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div>
          <p className="font-bold text-sm">{title}</p>
          <p className="text-xs mt-0.5">{message}</p>
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-600 hover:text-red-800 font-bold text-sm px-2 py-1 rounded hover:bg-red-100 transition-colors ml-4"
          aria-label="Dismiss error"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
