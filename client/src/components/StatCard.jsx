import React from "react";
import PropTypes from "prop-types";

export default function StatCard({
  label,
  value,
  subtext,
  colorScheme = "slate",
}) {
  const colorMap = {
    slate: {
      value: "text-slate-900",
      badge: "text-slate-600 bg-slate-100",
    },
    indigo: {
      value: "text-indigo-600",
      badge: "text-indigo-600 bg-indigo-50",
    },
    emerald: {
      value: "text-emerald-600",
      badge: "text-emerald-600 bg-emerald-50",
    },
  };

  const scheme = colorMap[colorScheme] || colorMap.slate;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-baseline justify-between mt-2">
        <span className={`text-3xl font-extrabold ${scheme.value}`}>
          {value}
        </span>
        {subtext ? (
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${scheme.badge}`}
          >
            {subtext}
          </span>
        ) : null}
      </div>
    </div>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtext: PropTypes.string,
  colorScheme: PropTypes.oneOf(["slate", "indigo", "emerald"]),
};
