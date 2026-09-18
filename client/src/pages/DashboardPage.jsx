import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  DollarSign,
  Flower2,
  AlertTriangle,
  ShoppingBag,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import StatCard from "../components/common/StatCard";
import Badge from "../components/common/Badge";
import { getDashboardAnalytics, getFlowers, getOrders } from "../services/api";

export default function DashboardPage({ onOpenCreateOrder }) {
  const [analytics, setAnalytics] = useState({
    total_revenue: 0,
    total_orders: 0,
    total_flowers_in_stock: 0,
    low_stock_count: 0,
    top_selling_flowers: [],
  });
  const [flowers, setFlowers] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsData, flowersData, ordersData] = await Promise.all([
        getDashboardAnalytics(),
        getFlowers({ limit: 50 }),
        getOrders({ limit: 5 }),
      ]);

      const flowersList = Array.isArray(flowersData) ? flowersData : [];
      const ordersList = Array.isArray(ordersData) ? ordersData : [];

      setFlowers(flowersList);
      setRecentOrders(ordersList);

      const computedLowStock = flowersList.filter(
        (f) => f.stock_quantity <= (f.low_stock_threshold || 20),
      );

      const computedTotalStock = flowersList.reduce(
        (acc, f) => acc + (f.stock_quantity || 0),
        0,
      );

      const computedRevenue = ordersList.reduce(
        (acc, o) => acc + (o.total_amount || 0),
        0,
      );

      setAnalytics({
        total_revenue: analyticsData.total_revenue || computedRevenue,
        total_orders: analyticsData.total_orders || ordersList.length,
        total_flowers_in_stock:
          analyticsData.total_flowers_in_stock || computedTotalStock,
        low_stock_count:
          analyticsData.low_stock_count || computedLowStock.length,
        top_selling_flowers:
          analyticsData.top_selling_flowers || flowersList.slice(0, 3),
      });
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const lowStockItems = flowers.filter(
    (f) => f.stock_quantity <= (f.low_stock_threshold || 20),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Florist Executive Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time sales summaries, stock health, and inventory alerting.
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onOpenCreateOrder}
            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Place Order</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Daily Revenue"
          value={`$${Number(analytics.total_revenue || 0).toFixed(2)}`}
          subtitle="Total revenue generated"
          icon={DollarSign}
          trend="+12.5% vs yesterday"
          color="emerald"
        />

        <StatCard
          title="Total Orders"
          value={analytics.total_orders}
          subtitle="Active & completed orders"
          icon={ShoppingBag}
          color="indigo"
        />

        <StatCard
          title="Total Stock Stems"
          value={analytics.total_flowers_in_stock}
          subtitle={`${flowers.length} active flower species`}
          icon={Flower2}
          color="emerald"
        />

        <StatCard
          title="Low-Stock Alerts"
          value={analytics.low_stock_count}
          subtitle="Items below replenishment threshold"
          icon={AlertTriangle}
          color={analytics.low_stock_count > 0 ? "amber" : "emerald"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h2 className="font-bold text-lg text-gray-900">
                  Stock Replenishment Alerts
                </h2>
              </div>
              <Badge variant={lowStockItems.length > 0 ? "warning" : "success"}>
                {lowStockItems.length} Low-Stock Items
              </Badge>
            </div>

            {lowStockItems.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">
                All flower varieties are well stocked above threshold limits.
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-sm text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Botanical: {item.species || "Variety"} &bull; Threshold:{" "}
                        {item.low_stock_threshold || 20} stems
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-rose-600 text-sm">
                        {item.stock_quantity} stems remaining
                      </span>
                      <Link
                        to="/flowers"
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center"
                      >
                        Restock <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-gray-900">Recent Orders</h2>
              <Link
                to="/orders"
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center"
              >
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">
                No orders processed yet. Click "Place Order" to create one.
              </p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((o) => (
                  <div
                    key={o.id || o.order_number}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {o.order_number || `#ORD-${o.id?.substring(0, 6)}`}{" "}
                        &bull; {o.customer_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Status: {o.status || "Pending"}
                      </div>
                    </div>
                    <div className="font-bold text-gray-900">
                      ${Number(o.total_amount || 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-lg text-gray-900">
                Top Selling Varieties
              </h2>
            </div>

            <div className="space-y-4">
              {flowers.slice(0, 4).map((f, idx) => (
                <div
                  key={f.id || f.name}
                  className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-lg border border-emerald-100"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-emerald-800 text-sm">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-medium text-sm text-gray-900">
                        {f.name}
                      </div>
                      <div className="text-xs text-gray-500">{f.color}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-emerald-900 text-sm">
                      ${Number(f.price_per_stem || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">per stem</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
