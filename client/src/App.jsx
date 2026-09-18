import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/common/Navbar";
import CreateOrderDrawer from "./components/orders/CreateOrderDrawer";
import DashboardPage from "./pages/DashboardPage";
import FlowersPage from "./pages/FlowersPage";
import OrdersPage from "./pages/OrdersPage";
import SuppliersPage from "./pages/SuppliersPage";
import { getFlowers, createOrder } from "./services/api";

export default function App() {
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false);
  const [flowers, setFlowers] = useState([]);

  const loadFlowersForDrawer = async () => {
    try {
      const data = await getFlowers({ limit: 100 });
      setFlowers(data);
    } catch (err) {
      console.error("Failed to fetch flowers for drawer:", err);
    }
  };

  const handleOpenOrderDrawer = () => {
    loadFlowersForDrawer();
    setIsOrderDrawerOpen(true);
  };

  const handleCreateOrder = async (orderData) => {
    try {
      await createOrder(orderData);
      setIsOrderDrawerOpen(false);
      window.location.reload();
    } catch (err) {
      alert(
        "Error creating order: " + (err.response?.data?.detail || err.message),
      );
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <Navbar onOpenCreateOrder={handleOpenOrderDrawer} />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route
              path="/"
              element={
                <DashboardPage onOpenCreateOrder={handleOpenOrderDrawer} />
              }
            />
            <Route path="/flowers" element={<FlowersPage />} />
            <Route
              path="/orders"
              element={<OrdersPage onOpenCreateOrder={handleOpenOrderDrawer} />}
            />
            <Route path="/suppliers" element={<SuppliersPage />} />
          </Routes>
        </main>

        <footer className="bg-surface border-t border-gray-200 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center text-xs text-text-secondary">
            &copy; {new Date().getFullYear()} Blossom Manager &bull; Flowers
            Management System
          </div>
        </footer>

        <CreateOrderDrawer
          isOpen={isOrderDrawerOpen}
          onClose={() => setIsOrderDrawerOpen(false)}
          onCreateOrder={handleCreateOrder}
          flowers={flowers}
        />
      </div>
    </Router>
  );
}
