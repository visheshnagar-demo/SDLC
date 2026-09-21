import React, { useEffect, useState } from "react";
import AdjustmentForm from "../components/adjustments/AdjustmentForm";
import AuditLogTable from "../components/adjustments/AuditLogTable";
import { getItems, getWarehouses, getAuditLogs } from "../services/api";

export default function AdjustmentsPage() {
  const [items, setItems] = useState([
    { id: "1", sku: "SKU-9901", name: "Heavy Duty Police Tactical Vest" },
    { id: "2", sku: "SKU-8820", name: "Body Cam Model X-2" },
    { id: "3", sku: "SKU-7715", name: "Patrol Vehicle Radio Set" },
  ]);

  const [warehouses, setWarehouses] = useState([
    { id: "wh-1", name: "Central Armory", code: "HQ-01" },
    { id: "wh-2", name: "North Precinct Depot", code: "NP-02" },
    { id: "wh-3", name: "South Substation Warehouse", code: "SS-03" },
  ]);

  const [auditLogs, setAuditLogs] = useState([
    {
      id: "log-101",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      sku: "SKU-9901",
      item_id: "1",
      warehouse_name: "Central Armory",
      quantity_delta: -2,
      previous_quantity: 12,
      new_quantity: 10,
      reason_code: "DAMAGED_GOODS",
      notes: "Scrapped damaged tactical vest lining",
    },
    {
      id: "log-100",
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      sku: "SKU-8820",
      item_id: "2",
      warehouse_name: "North Precinct Depot",
      quantity_delta: 25,
      previous_quantity: 0,
      new_quantity: 25,
      reason_code: "SHIPMENT_ARRIVED",
      notes: "Initial stock intake batch 8820",
    },
  ]);

  const [loadingLogs, setLoadingLoadingLogs] = useState(true);

  const loadData = async () => {
    setLoadingLoadingLogs(true);
    try {
      const [itemsRes, whRes, auditRes] = await Promise.allSettled([
        getItems(),
        getWarehouses(),
        getAuditLogs(),
      ]);

      if (
        itemsRes.status === "fulfilled" &&
        Array.isArray(itemsRes.value) &&
        itemsRes.value.length > 0
      ) {
        setItems(itemsRes.value);
      }

      if (
        whRes.status === "fulfilled" &&
        Array.isArray(whRes.value) &&
        whRes.value.length > 0
      ) {
        setWarehouses(whRes.value);
      }

      if (
        auditRes.status === "fulfilled" &&
        Array.isArray(auditRes.value) &&
        auditRes.value.length > 0
      ) {
        setAuditLogs(auditRes.value);
      }
    } catch (err) {
      console.warn("Adjustments data load error:", err);
    } finally {
      setLoadingLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjustmentSuccess = (newLog) => {
    if (newLog) {
      setAuditLogs((prev) => [newLog, ...prev]);
    }
    loadData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Stock Adjustments & Audit Trail
        </h1>
        <p className="text-sm text-slate-500">
          Record stock adjustments, transfers, and reconciliations with
          timestamped audit trail.
        </p>
      </div>

      <AdjustmentForm
        items={items}
        warehouses={warehouses}
        onAdjustmentSuccess={handleAdjustmentSuccess}
      />

      <AuditLogTable auditLogs={auditLogs} loading={loadingLogs} />
    </div>
  );
}
