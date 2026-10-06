import React from "react";

export default function Badge({
  variant = "default",
  children,
  className = "",
}) {
  const getVariantStyles = () => {
    switch (variant.toLowerCase()) {
      case "success":
      case "lactating":
      case "normal":
      case "confirmed pregnant":
      case "pregnant":
        return "bg-[#E7F5EE] text-[#149E4D] border-[#149E4D]/20";
      case "warning":
      case "in heat":
      case "inseminated":
      case "low stock":
        return "bg-[#FEF7EC] text-[#E5941A] border-[#E5941A]/20";
      case "danger":
      case "error":
      case "withheld":
      case "active withholding":
      case "variance alert":
      case "sick":
        return "bg-[#FDF0ED] text-[#D92929] border-[#D92929]/20 font-semibold";
      case "info":
      case "dry":
      case "dry period":
      case "heifer":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-[#6B7A73] border-gray-200";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getVariantStyles()} ${className}`}
    >
      {children}
    </span>
  );
}
