import React from "react";
import PropTypes from "prop-types";

export const StatCard = ({
  label,
  value,
  change,
  subtext,
  status,
  icon: Icon,
}) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        {Icon && (
          <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">
          {value}
        </span>
        {change && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {change}
          </span>
        )}
      </div>
      {(subtext || status) && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          {subtext && <span>{subtext}</span>}
          {status && (
            <span className="font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
              {status}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  change: PropTypes.string,
  subtext: PropTypes.string,
  status: PropTypes.string,
  icon: PropTypes.elementType,
};

export default StatCard;
