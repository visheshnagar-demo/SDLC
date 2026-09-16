import React, { useEffect } from "react";
import { AlertOctagon, CheckCircle, Info, X } from "lucide-react";

export default function ToastNotification({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 6000); // 6 seconds auto-dismiss
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const { type, title, message } = toast;

  let bgClasses = "bg-slate-900 text-white border-slate-700";
  let icon = <Info className="w-5 h-5 text-blue-400" />;

  if (type === "error") {
    bgClasses = "bg-red-900/95 text-red-50 border-red-700 shadow-red-950/20";
    icon = <AlertOctagon className="w-6 h-6 text-red-400 flex-shrink-0" />;
  } else if (type === "success") {
    bgClasses =
      "bg-emerald-900/95 text-emerald-50 border-emerald-700 shadow-emerald-950/20";
    icon = <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />;
  } else if (type === "info") {
    bgClasses =
      "bg-blue-900/95 text-blue-50 border-blue-700 shadow-blue-950/20";
    icon = <Info className="w-6 h-6 text-blue-400 flex-shrink-0" />;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-bounce-in">
      <div
        className={`p-4 rounded-xl shadow-2xl border flex items-start space-x-3 ${bgClasses}`}
      >
        {icon}
        <div className="flex-1 pr-2">
          {title && (
            <h3 className="font-bold text-sm tracking-tight mb-0.5">{title}</h3>
          )}
          <p className="text-xs leading-relaxed opacity-95">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-300 hover:text-white p-1 rounded-md transition hover:bg-white/10"
          aria-label="Close Toast"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
