import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import IngestionPanel from "../components/IngestionPanel";

export function UploadPage() {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Email Ingestion & Batch Ingest
          </h1>
          <p className="text-sm text-slate-500">
            Paste raw email text or upload email files (.eml, .msg, .txt up to
            10MB limit) for instant AI classification
          </p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Main Dual Ingestion Panel */}
      <IngestionPanel />
    </div>
  );
}

export default UploadPage;
