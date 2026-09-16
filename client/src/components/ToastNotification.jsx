import React, { useEffect } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

export default function ToastNotification({ toast, onDismiss }) {
  if (!toast) return null;

  const { type, message, title } = toast;

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 6000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const styles = {
    error: {
      bg: "bg-red-50 border-red-300 text-red-900",
      icon: <XCircle className="w-5 h-5 text-red-600 shrink-0" />,
      badge: "bg-red-600 text-white",
      defaultTitle: "403 Forbidden / Authorization Error",
    },
    success: {
      bg: "bg-emerald-50 border-emerald-300 text-emerald-900",
      icon: <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />,
      badge: "bg-emerald-600 text-white",
      defaultTitle: "Success",
    },
    warning: {
      bg: "bg-amber-50 border-amber-300 text-amber-900",
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
      badge: "bg-amber-600 text-white",
      defaultTitle: "Warning",
    },
    info: {
      bg: "bg-blue-50 border-blue-300 text-blue-900",
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
      badge: "bg-blue-600 text-white",
      defaultTitle: "Notification",
    },
  };

  const style = styles[type] || styles.info;

  return (
    <div
      role="alert"
      className={`fixed bottom-5 right-5 max-w-md w-full p-4 rounded-xl border shadow-xl transition-all duration-300 z-50 flex items-start gap-3 ${style.bg}`}
    >
      {style.icon}

      <div className="flex-1 pr-2">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${style.badge}`}
          >
            {type}
          </span>
          <h4 className="text-sm font-bold">{title || style.defaultTitle}</h4>
        </div>
        <p className="text-xs leading-relaxed opacity-90">{message}</p>
      </div>

      <button
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
        title="Dismiss Notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
