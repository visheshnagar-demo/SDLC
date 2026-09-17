import React from "react";

export const Badge = ({ variant = "default", children, className = "" }) => {
  const variantStyles = {
    default: "bg-slate-100 text-slate-800 border-slate-200",
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    suspended: "bg-amber-50 text-amber-700 border-amber-200",
    archived: "bg-rose-50 text-rose-700 border-rose-200",
    free: "bg-slate-100 text-slate-700 border-slate-200",
    pro: "bg-indigo-50 text-indigo-700 border-indigo-200",
    enterprise: "bg-purple-50 text-purple-700 border-purple-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
  };

  const style = variantStyles[variant.toLowerCase()] || variantStyles.default;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
