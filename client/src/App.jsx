import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { EmailInputForm } from "./components/EmailInputForm";
import { ClassificationDashboard } from "./components/ClassificationDashboard";
import { CategoryOverrideModal } from "./components/CategoryOverrideModal";
import { checkHealth } from "./services/api";
import { Sparkles, CheckCircle2 } from "lucide-react";

export const App = () => {
  const [activeTab, setActiveTab] = useState("studio"); // 'studio' | 'dashboard'
  const [apiStatus, setApiStatus] = useState("checking"); // 'online' | 'offline' | 'checking'
  const [inspectingEmail, setInspectingEmail] = useState(null);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [toastMessage, setToastMessage] = useState("");

  const triggerRefresh = () => {
    setRefreshSignal((prev) => prev + 1);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  };

  useEffect(() => {
    let isMounted = true;
    const verifyApiConnection = async () => {
      try {
        await checkHealth();
        if (isMounted) setApiStatus("online");
      } catch (err) {
        if (isMounted) setApiStatus("offline");
      }
    };

    verifyApiConnection();
    const interval = setInterval(verifyApiConnection, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleClassificationSuccess = (email) => {
    triggerRefresh();
    showToast(
      `Email classified successfully as ${email.classification?.primary_category || "Work"}!`,
    );
  };

  const handleOverrideSuccess = (updatedEmail) => {
    triggerRefresh();
    showToast(
      `Category updated to ${updatedEmail.classification?.primary_category}!`,
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        apiStatus={apiStatus}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl animate-in slide-in-from-bottom-5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab Header Banner */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              {activeTab === "studio" ? (
                <>
                  <Sparkles className="h-6 w-6 text-indigo-600" />
                  <span>Email Ingestion &amp; Classification Studio</span>
                </>
              ) : (
                <span>Email Review &amp; Classification Dashboard</span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {activeTab === "studio"
                ? "Enter email content, upload RFC 822/PDF/TXT files, and inspect real-time AI category confidence."
                : "Filter, inspect, and manually review or override AI categories (Work, Personal, Urgent, Promotional)."}
            </p>
          </div>
        </div>

        {/* Content View */}
        {activeTab === "studio" ? (
          <EmailInputForm
            onClassificationSuccess={handleClassificationSuccess}
            onOpenDashboard={() => setActiveTab("dashboard")}
          />
        ) : (
          <ClassificationDashboard
            onInspectEmail={setInspectingEmail}
            refreshSignal={refreshSignal}
          />
        )}
      </main>

      {/* Inspection & Override Modal */}
      {inspectingEmail && (
        <CategoryOverrideModal
          email={inspectingEmail}
          onClose={() => setInspectingEmail(null)}
          onOverrideSuccess={handleOverrideSuccess}
        />
      )}

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        Email Classification System &bull; Powered by React 18 &amp; FastAPI AI
        Categorization
      </footer>
    </div>
  );
};

export default App;
