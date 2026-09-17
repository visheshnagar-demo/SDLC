import React, { useState } from "react";
import Dashboard from "./components/Dashboard";
import InventoryManager from "./components/InventoryManager";
import TransferModal from "./components/TransferModal";
import AuditLogTable from "./components/AuditLogTable";
import AccountList from "./components/AccountList";
import {
  Layers,
  Package,
  ArrowLeftRight,
  ShieldCheck,
  Users,
  Search,
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferInitialMode, setTransferInitialMode] = useState("transfer");

  const openTransferModal = (mode = "transfer") => {
    setTransferInitialMode(mode);
    setIsTransferModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setActiveTab("dashboard")}
          >
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <Layers className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">
                ChipsLedger <span className="text-cyan-400">Pro</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-mono">
                v1.0.0
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition ${
                activeTab === "dashboard"
                  ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab("inventory")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition ${
                activeTab === "inventory"
                  ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Inventory</span>
            </button>

            <button
              onClick={() => openTransferModal("transfer")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition text-slate-400 hover:text-white hover:bg-slate-800/60`}
            >
              <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
              <span>Transfers</span>
            </button>

            <button
              onClick={() => setActiveTab("accounts")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition ${
                activeTab === "accounts"
                  ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Accounts</span>
            </button>

            <button
              onClick={() => setActiveTab("audit")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition ${
                activeTab === "audit"
                  ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Audit Trail</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === "dashboard" && (
          <Dashboard onOpenTransfer={openTransferModal} />
        )}
        {activeTab === "inventory" && <InventoryManager />}
        {activeTab === "accounts" && (
          <AccountList onTriggerTransfer={openTransferModal} />
        )}
        {activeTab === "audit" && <AuditLogTable />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-2">
          <span>
            ChipsLedger Pro &copy; 2026. Centralized Chips Management & Audit
            Compliance System.
          </span>
          <span className="font-mono text-cyan-500/80">
            ACID Ledger Engine &bull; PostgreSQL &bull; React 18
          </span>
        </div>
      </footer>

      {/* Global Transfer Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        initialMode={transferInitialMode}
        onSuccess={() => {
          // Trigger refresh on active tab
        }}
      />
    </div>
  );
}
