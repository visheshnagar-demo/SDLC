import React, { useState, useEffect } from "react";
import OrderTable from "../components/orders/OrderTable";
import { getOrders, updateOrderStatus } from "../services/api";

export default function OrdersPage({ onOpenCreateOrder }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrders({ limit: 100 });
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      loadOrders();
    } catch (err) {
      alert("Error updating order status: " + (err.message || "Failed"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Order Processing &amp; Tracking
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track customer orders, update order fulfillment status, and
            calculate total order costs.
          </p>
        </div>
      </div>

      <OrderTable
        orders={orders}
        onUpdateStatus={handleUpdateStatus}
        onOpenCreateOrder={onOpenCreateOrder}
      />
    </div>
  );
}
