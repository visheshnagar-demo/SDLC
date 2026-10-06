import React from "react";

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = "neutral", // "positive", "negative", "warning", "neutral"
  alert = false,
}) {
  const getTrendClasses = () => {
    switch (trendType) {
      case "positive":
        return "text-[#149E4D] bg-[#E7F5EE]";
      case "negative":
        return "text-[#D92929] bg-[#FDF0ED]";
      case "warning":
        return "text-[#E5941A] bg-[#FEF7EC]";
      default:
        return "text-[#6B7A73] bg-gray-100";
    }
  };

  return (
    <div
      className={`bg-white rounded-xl p-5 border ${
        alert
          ? "border-[#E76F51] bg-[#FDF0ED]/20 shadow-sm"
          : "border-[#DBE5E0]"
      } flex flex-col justify-between`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium text-[#6B7A73] uppercase tracking-wider block">
            {title}
          </span>
          <div className="text-2xl font-bold text-[#171F24] mt-1 tracking-tight">
            {value !== undefined && value !== null ? value : "--"}
          </div>
        </div>
        {Icon && (
          <div className="p-2.5 rounded-lg bg-[#E7F5EE] text-[#0D7A52]">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between text-xs">
          {subtitle && <span className="text-[#6B7A73]">{subtitle}</span>}
          {trend && (
            <span
              className={`px-2 py-0.5 rounded font-medium ${getTrendClasses()}`}
            >
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
