import React, { useEffect } from "react";
import { AlertTriangle, CheckCircle2, XCircle, Info, X } from "lucide-react";

export function ToastNotification({ toast, onClose }) {
  if (!toast) return null;

  const { type = "error", title, message } = toast;

  const styles =
    {
      error: {
        bg: "bg-red-50 border-red-500 text-red-900",
        iconBg: "bg-red-500 text-white",
        icon: AlertTriangle,
        titleColor: "text-red-900",
        textColor: "text-red-700",
      },
      success: {
        bg: "bg-emerald-50 border-emerald-500 text-emerald-900",
        iconBg: "bg-emerald-500 text-white",
        icon: CheckCircle2,
        titleColor: "text-emerald-900",
        textColor: "text-emerald-700",
      },
      warning: {
        bg: "bg-amber-50 border-amber-500 text-amber-900",
        iconBg: "bg-amber-500 text-white",
        icon: AlertTriangle,
        titleColor: "text-amber-900",
        textColor: "text-amber-700",
      },
      info: {
        bg: "bg-blue-50 border-blue-500 text-blue-900",
        iconBg: "bg-blue-500 text-white",
        icon: Info,
        titleColor: "text-blue-900",
        textColor: "text-blue-700",
      },
    }[type] || styles.error;

  const IconComponent = styles.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 7000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full animate-bounce-once">
      <div
        className={`border-2 rounded-lg p-4 shadow-xl flex items-start space-x-3 transition-all ${styles.bg}`}
        role="alert"
      >
        <div className={`p-1.5 rounded-full flex-shrink-0 ${styles.iconBg}`}>
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="flex-1 pr-2">
          <h3 className={`text-sm font-bold ${styles.titleColor}`}>
            {title ||
              (type === "error"
                ? "HTTP 403 Forbidden - Action Denied"
                : "Notification")}
          </h3>
          <p className={`text-xs mt-1 leading-relaxed ${styles.textColor}`}>
            {message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default ToastNotification;
