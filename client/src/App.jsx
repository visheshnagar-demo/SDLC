import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Header from "./components/common/Header";
import CreateReleaseModal from "./components/releases/CreateReleaseModal";
import DashboardPage from "./pages/DashboardPage";
import ReleaseDetailPage from "./pages/ReleaseDetailPage";
import DeploymentsPage from "./pages/DeploymentsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import { createRelease } from "./services/api";

function AppContent() {
  const [isGlobalCreateOpen, setIsGlobalCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleGlobalCreateRelease = async (formData) => {
    setIsSubmitting(true);
    try {
      const created = await createRelease(formData);
      setIsGlobalCreateOpen(false);
      if (created?.id) {
        navigate(`/releases/${created.id}`);
      } else {
        navigate("/releases");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Header onOpenCreateModal={() => setIsGlobalCreateOpen(true)} />

      <main className="flex-1 pb-12">
        <Routes>
          <Route path="/" element={<Navigate to="/releases" replace />} />
          <Route path="/releases" element={<DashboardPage />} />
          <Route path="/releases/:id" element={<ReleaseDetailPage />} />
          <Route path="/deployments" element={<DeploymentsPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="*" element={<Navigate to="/releases" replace />} />
        </Routes>
      </main>

      {/* Global Create Release Modal */}
      <CreateReleaseModal
        isOpen={isGlobalCreateOpen}
        onClose={() => setIsGlobalCreateOpen(false)}
        onSubmit={handleGlobalCreateRelease}
        isSubmitting={isSubmitting}
      />

      <footer className="bg-[#080d1a] border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} Software Release Tracker — Enterprise
            Engineering Platform
          </span>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Readiness Gates Active</span>
            <span>·</span>
            <span>Immutable Audit Logs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
