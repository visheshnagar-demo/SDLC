import React, { useState } from "react";
import {
  Search,
  ShoppingBag,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
} from "lucide-react";
import Badge from "../common/Badge";

export default function OrderTable({
  orders = [],
  onUpdateStatus,
  onOpenCreateOrder,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      order.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const s = (status || "Pending").toLowerCase();
    if (s === "completed") {
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle className="w-3 h-3" /> Completed
        </Badge>
      );
    }
    if (s === "processing") {
      return (
        <Badge variant="info" className="gap-1">
          <RefreshCw className="w-3 h-3 animate-spin" /> Processing
        </Badge>
      );
    }
    if (s === "cancelled") {
      return (
        <Badge variant="danger" className="gap-1">
          <XCircle className="w-3 h-3" /> Cancelled
        </Badge>
      );
    }
    return (
      <Badge variant="warning" className="gap-1">
        <Clock className="w-3 h-3" /> Pending
      </Badge>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search order # or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {onOpenCreateOrder && (
          <button
            onClick={onOpenCreateOrder}
            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Place New Order</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Order # & Date</th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Line Items</th>
              <th className="py-3.5 px-4">Total Amount</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Update Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-500">
                  No orders found.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr
                  key={order.id || order.order_number}
                  className="hover:bg-gray-50/50"
                >
                  <td className="py-3.5 px-4 font-medium text-gray-900">
                    <div>
                      {order.order_number ||
                        `#ORD-${order.id?.substring(0, 6)}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString()
                        : "Today"}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-gray-900">
                      {order.customer_name || "Guest Customer"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.customer_email || "no-email@example.com"}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-600">
                    {order.order_items && order.order_items.length > 0 ? (
                      <span className="text-xs">
                        {order.order_items.length} item(s) &bull;{" "}
                        {order.order_items
                          .map((i) => i.flower_name || "Flower")
                          .join(", ")}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">
                        Standard Arrangement
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-gray-900">
                    ${Number(order.total_amount || 0).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {onUpdateStatus && (
                      <select
                        value={order.status || "Pending"}
                        onChange={(e) =>
                          onUpdateStatus(order.id, e.target.value)
                        }
                        className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
