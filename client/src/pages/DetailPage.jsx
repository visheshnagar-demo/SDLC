import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import emailService from "../services/api";
import EmailDetailViewer from "../components/EmailDetailViewer";
import ManualOverrideModal from "../components/ManualOverrideModal";

export function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);

  const fetchEmail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await emailService.getEmailById(id);
      setEmail(data);
    } catch (err) {
      const errMsg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to load email details.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEmail();
  }, [fetchEmail]);

  const handleOverrideSaved = (updatedEmail) => {
    setEmail(updatedEmail);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">
            Loading email details...
          </p>
        </div>
      ) : error ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Unable to Load Email
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">{error}</p>
          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <button
              onClick={fetchEmail}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          <EmailDetailViewer
            email={email}
            onOverrideClick={() => setIsOverrideOpen(true)}
            onBack={() => navigate("/")}
          />

          <ManualOverrideModal
            isOpen={isOverrideOpen}
            email={email}
            onClose={() => setIsOverrideOpen(false)}
            onSaved={handleOverrideSaved}
          />
        </>
      )}
    </div>
  );
}

export default DetailPage;
