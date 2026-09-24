import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReleaseDetailHeader from "../components/releases/ReleaseDetailHeader";
import BlockerAlert from "../components/releases/BlockerAlert";
import ReadinessGauge from "../components/releases/ReadinessGauge";
import LinkedItemsTable from "../components/releases/LinkedItemsTable";
import DeploymentHistoryTable from "../components/releases/DeploymentHistoryTable";
import AuditLogLedger from "../components/releases/AuditLogLedger";
import CreateReleaseModal from "../components/releases/CreateReleaseModal";
import AddItemModal from "../components/releases/AddItemModal";
import TriggerDeploymentModal from "../components/releases/TriggerDeploymentModal";
import {
  getRelease,
  updateRelease,
  deleteRelease,
  getReleaseItems,
  addReleaseItem,
  updateReleaseItem,
  deleteReleaseItem,
  getReleaseReadiness,
  getDeployments,
  createDeployment,
  getAuditLogs,
} from "../services/api";
import { Layers, GitPullRequest, History, AlertCircle } from "lucide-react";

export const ReleaseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [release, setRelease] = useState(null);
  const [items, setItems] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("items"); // "items" | "deployments" | "audit"

  // Modals state
  const [isEditReleaseOpen, setIsEditReleaseOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isTriggerDeployOpen, setIsTriggerDeployOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReleaseData = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);

      const [releaseRes, itemsRes, readinessRes, deploymentsRes, logsRes] =
        await Promise.allSettled([
          getRelease(id),
          getReleaseItems(id),
          getReleaseReadiness(id),
          getDeployments(id),
          getAuditLogs(id),
        ]);

      if (releaseRes.status === "fulfilled") {
        setRelease(releaseRes.value);
      } else {
        throw new Error(
          releaseRes.reason?.response?.data?.detail || "Release not found.",
        );
      }

      setItems(
        itemsRes.status === "fulfilled"
          ? Array.isArray(itemsRes.value)
            ? itemsRes.value
            : itemsRes.value?.items || []
          : [],
      );

      setReadiness(
        readinessRes.status === "fulfilled" ? readinessRes.value : null,
      );

      setDeployments(
        deploymentsRes.status === "fulfilled"
          ? Array.isArray(deploymentsRes.value)
            ? deploymentsRes.value
            : deploymentsRes.value?.items || []
          : [],
      );

      setAuditLogs(
        logsRes.status === "fulfilled"
          ? Array.isArray(logsRes.value)
            ? logsRes.value
            : logsRes.value?.items || []
          : [],
      );
    } catch (err) {
      setError(err.message || "Failed to load release workspace.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReleaseData();
  }, [loadReleaseData]);

  // Release Handlers
  const handleUpdateRelease = async (formData) => {
    setIsSubmitting(true);
    try {
      await updateRelease(id, formData);
      await loadReleaseData();
      setIsEditReleaseOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRelease = async () => {
    if (!window.confirm("Are you sure you want to delete this release?"))
      return;
    try {
      await deleteRelease(id);
      navigate("/releases");
    } catch (err) {
      alert(err.response?.data?.detail || err.message || "Failed to delete.");
    }
  };

  // Item Handlers
  const handleOpenAddItem = () => {
    setEditingItem(null);
    setIsAddItemOpen(true);
  };

  const handleOpenEditItem = (item) => {
    setEditingItem(item);
    setIsAddItemOpen(true);
  };

  const handleSaveItem = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateReleaseItem(id, editingItem.id, formData);
      } else {
        await addReleaseItem(id, formData);
      }
      await loadReleaseData();
      setIsAddItemOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateItemStatus = async (itemId, resolution_status) => {
    try {
      await updateReleaseItem(id, itemId, { resolution_status });
      await loadReleaseData();
    } catch (err) {
      alert(
        err.response?.data?.detail ||
          err.message ||
          "Failed to update item status.",
      );
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Unlink this item from the release?")) return;
    try {
      await deleteReleaseItem(id, itemId);
      await loadReleaseData();
    } catch (err) {
      alert(err.response?.data?.detail || err.message || "Failed to unlink.");
    }
  };

  // Deployment Handler
  const handleRecordDeployment = async (formData) => {
    setIsSubmitting(true);
    try {
      await createDeployment(id, formData);
      await loadReleaseData();
      setIsTriggerDeployOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate blocker list for BlockerAlert
  const blockerItems = items.filter(
    (item) =>
      (item.priority?.toUpperCase() === "BLOCKER" ||
        item.priority?.toUpperCase() === "CRITICAL") &&
      item.resolution_status?.toUpperCase() !== "RESOLVED" &&
      item.resolution_status?.toUpperCase() !== "CLOSED",
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {error && (
        <div
          role="alert"
          className="p-4 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadReleaseData}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded text-xs font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Release Header */}
      <ReleaseDetailHeader
        release={release}
        onOpenAddItem={handleOpenAddItem}
        onOpenDeploy={() => setIsTriggerDeployOpen(true)}
        onEditRelease={() => setIsEditReleaseOpen(true)}
        onDeleteRelease={handleDeleteRelease}
      />

      {/* Blocker Alert Banner (if blockers exist) */}
      <BlockerAlert
        unresolvedBlockers={
          readiness?.unresolved_blockers ?? blockerItems.length
        }
        blockerItems={blockerItems}
        onScrollToItems={() => setActiveTab("items")}
      />

      {/* Readiness Gauge & Score Card */}
      <ReadinessGauge
        readiness={
          readiness || {
            total_items: items.length,
            completed_items: items.filter(
              (i) =>
                i.resolution_status === "Resolved" ||
                i.resolution_status === "Closed",
            ).length,
            readiness_percentage:
              items.length > 0
                ? (items.filter(
                    (i) =>
                      i.resolution_status === "Resolved" ||
                      i.resolution_status === "Closed",
                  ).length /
                    items.length) *
                  100
                : 0,
            unresolved_blockers: blockerItems.length,
            risk_level: blockerItems.length > 0 ? "HIGH" : "LOW",
            is_ready_for_deployment:
              items.length > 0 &&
              blockerItems.length === 0 &&
              items.every(
                (i) =>
                  i.resolution_status === "Resolved" ||
                  i.resolution_status === "Closed",
              ),
          }
        }
      />

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab("items")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "items"
              ? "border-indigo-500 text-[#c0c1ff]"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Features & Bugs ({items.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("deployments")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "deployments"
              ? "border-indigo-500 text-[#c0c1ff]"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <GitPullRequest className="w-4 h-4" />
          <span>Deployments ({deployments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "audit"
              ? "border-indigo-500 text-[#c0c1ff]"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "items" && (
        <LinkedItemsTable
          items={items}
          isLoading={isLoading}
          onOpenAddItem={handleOpenAddItem}
          onEditItem={handleOpenEditItem}
          onDeleteItem={handleDeleteItem}
          onUpdateStatus={handleUpdateItemStatus}
        />
      )}

      {activeTab === "deployments" && (
        <DeploymentHistoryTable
          deployments={deployments}
          isLoading={isLoading}
          onOpenTriggerDeploy={() => setIsTriggerDeployOpen(true)}
        />
      )}

      {activeTab === "audit" && (
        <AuditLogLedger logs={auditLogs} isLoading={isLoading} />
      )}

      {/* Modals */}
      <CreateReleaseModal
        isOpen={isEditReleaseOpen}
        onClose={() => setIsEditReleaseOpen(false)}
        onSubmit={handleUpdateRelease}
        initialData={release}
        isSubmitting={isSubmitting}
      />

      <AddItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        onSubmit={handleSaveItem}
        initialData={editingItem}
        isSubmitting={isSubmitting}
      />

      <TriggerDeploymentModal
        isOpen={isTriggerDeployOpen}
        onClose={() => setIsTriggerDeployOpen(false)}
        onSubmit={handleRecordDeployment}
        release={release}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default ReleaseDetailPage;
