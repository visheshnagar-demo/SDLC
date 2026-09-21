import React from "react";
import { Plus, SlidersHorizontal, FileText, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function QuickActions({ onRefresh = () => {} }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="font-semibold text-slate-900 mb-4">
        Quick Management Actions
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => navigate("/items?action=new")}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white hover:bg-blue-700 font-medium text-sm rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Catalog Item</span>
        </button>

        <button
          onClick={() => navigate("/adjustments?action=new")}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-800 text-white hover:bg-slate-900 font-medium text-sm rounded-lg transition-colors shadow-sm"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Record Adjustment</span>
        </button>

        <button
          onClick={onRefresh}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-sm rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>
    </div>
  );
}
