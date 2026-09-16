import React, { useEffect } from "react";
import { ShieldX, CheckCircle2, AlertTriangle, X } from "lucide-react";

export const ToastNotification = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 8000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isError403 = toast.type === "error_403";
  const isError = toast.type === "error" || isError403;

  return (
    <div
      role="alert"
      className={`fixed top-5 right-6 z-50 max-w-md w-full shadow-2xl rounded-xl p-4 transition-all transform duration-300 animate-slide-in ${
        isError403
          ? "border border-red-500/40 bg-red-950 text-white"
          : isError
            ? "border border-rose-200 bg-rose-900 text-white"
            : "border border-emerald-200 bg-emerald-900 text-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          {isError403 ? (
            <div className="p-2 bg-red-900/80 rounded-lg text-red-300 shrink-0">
              <ShieldX className="w-5 h-5" />
            </div>
          ) : isError ? (
            <div className="p-2 bg-rose-800 rounded-lg text-rose-200 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          ) : (
            <div className="p-2 bg-emerald-800 rounded-lg text-emerald-200 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          )}

          <div>
            <h4 className="font-bold text-sm text-white">
              {toast.title ||
                (isError403
                  ? "🚫 403 Forbidden: Action Denied"
                  : "Notification")}
            </h4>
            <p className="text-xs mt-1 text-slate-200 leading-relaxed">
              {toast.message}
            </p>
            {isError403 && (
              <p className="text-[10px] text-red-300 mt-2 font-mono border-t border-red-800/60 pt-1">
                Policy Violation: Dual-Control Section 4A UCC • Segregation of
                Duties
              </p>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ToastNotification;
