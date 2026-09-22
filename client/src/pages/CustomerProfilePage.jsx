import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TopNavbar } from "../components/layout/TopNavbar";
import { Footer } from "../components/layout/Footer";
import { WatchCard } from "../components/catalog/WatchCard";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { ordersApi } from "../services/api";
import { MOCK_WATCHES } from "./CatalogPage";
import { User, Heart, Package, MapPin, Plus } from "lucide-react";

export const CustomerProfilePage = () => {
  const { user } = useAuth();
  const { wishlist } = useWishlist();

  const [activeTab, setActiveTab] = useState("wishlist");
  const [orders, setOrders] = useState([]);

  // Address state
  const [addresses, setAddresses] = useState([
    {
      id: "addr-1",
      name: "Primary Residence",
      recipient: user?.full_name || "Alex Mercer",
      street: "450 Park Avenue, Suite 2800",
      city: "New York",
      state: "NY",
      zip: "10022",
      country: "United States",
      isDefault: true,
    },
  ]);

  const [newAddr, setNewAddr] = useState({
    name: "",
    recipient: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
  });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await ordersApi.getOrders();
        if (Array.isArray(data) && data.length > 0) {
          setOrders(data);
        } else {
          setOrders([
            {
              id: "ORD-99281-CH",
              order_number: "ORD-99281-CH",
              watch_name: "Rolex Submariner Date 41mm",
              total_amount: 15000.0,
              fulfillment_status: "COURIER_DISPATCH",
              tracking_number: "FG-709882-GEN",
              created_at: "2026-09-22T14:30:00Z",
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to load orders", err);
        setOrders([
          {
            id: "ORD-99281-CH",
            order_number: "ORD-99281-CH",
            watch_name: "Rolex Submariner Date 41mm",
            total_amount: 15000.0,
            fulfillment_status: "COURIER_DISPATCH",
            tracking_number: "FG-709882-GEN",
            created_at: "2026-09-22T14:30:00Z",
          },
        ]);
      }
    };

    fetchOrders();
  }, []);

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!newAddr.street || !newAddr.city) return;
    setAddresses([
      ...addresses,
      {
        id: `addr-${Date.now()}`,
        ...newAddr,
        recipient: newAddr.recipient || user?.full_name || "Alex Mercer",
        isDefault: addresses.length === 0,
      },
    ]);
    setNewAddr({
      name: "",
      recipient: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "United States",
    });
    setShowAddForm(false);
  };

  const wishlistWatches = wishlist.map((item) => {
    if (typeof item === "object" && item.brand) return item;
    const watchId = typeof item === "object" ? item.watch_id || item.id : item;
    return (
      MOCK_WATCHES.find((w) => w.id === watchId) || {
        id: watchId,
        brand: "Rolex",
        model: "Submariner Date 41mm",
        reference_number: "126610LN",
        price: 14850,
        condition_score: 9.8,
        status: "AVAILABLE",
      }
    );
  });

  return (
    <div className="min-h-screen bg-[#121316] text-[#F8F9FA] flex flex-col">
      <TopNavbar />

      {/* User Header */}
      <section className="bg-[#0A0B0E] border-b border-[#232733] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#181B22] border-2 border-[#D4AF37] flex items-center justify-center text-[#F2CA50]">
              <User className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl font-bold text-[#F8F9FA]">
                  {user?.full_name || "Alex Mercer"}
                </h1>
                <span className="bg-[#D4AF37]/20 border border-[#D4AF37] text-[#F2CA50] text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded">
                  Verified Collector
                </span>
              </div>
              <div className="text-xs text-[#9EACB9] font-mono mt-0.5">
                {user?.email || "alex.mercer@horology.com"} · Member since 2024
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/orders/ORD-99281-CH"
              className="bg-[#1F1F23] hover:bg-[#2A2E39] border border-[#4D4635] text-[#F8F9FA] text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Package className="w-4 h-4 text-[#D4AF37]" />
              <span>Active Order Tracking</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Profile Main Tabs */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-6">
        <div className="flex border-b border-[#232733] gap-8 text-sm">
          <button
            onClick={() => setActiveTab("wishlist")}
            className={`pb-3 font-semibold flex items-center gap-2 transition-all ${
              activeTab === "wishlist"
                ? "border-b-2 border-[#D4AF37] text-[#F2CA50]"
                : "text-[#9EACB9] hover:text-[#F8F9FA]"
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Favorited Timepieces ({wishlistWatches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`pb-3 font-semibold flex items-center gap-2 transition-all ${
              activeTab === "orders"
                ? "border-b-2 border-[#D4AF37] text-[#F2CA50]"
                : "text-[#9EACB9] hover:text-[#F8F9FA]"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Escrow Orders &amp; Receipts ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("addresses")}
            className={`pb-3 font-semibold flex items-center gap-2 transition-all ${
              activeTab === "addresses"
                ? "border-b-2 border-[#D4AF37] text-[#F2CA50]"
                : "text-[#9EACB9] hover:text-[#F8F9FA]"
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Armored Delivery Address Book</span>
          </button>
        </div>

        {activeTab === "wishlist" && (
          <div className="space-y-6">
            {wishlistWatches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistWatches.map((w) => (
                  <WatchCard key={w.id} watch={w} />
                ))}
              </div>
            ) : (
              <div className="bg-[#181B22] border border-[#232733] rounded-xl p-12 text-center space-y-3">
                <Heart className="w-10 h-10 text-[#D4AF37] mx-auto opacity-70" />
                <h3 className="font-serif text-lg font-bold text-[#F8F9FA]">
                  Your wishlist is empty
                </h3>
                <p className="text-xs text-[#9EACB9] max-w-sm mx-auto">
                  Click the heart icon on any certified watch card to save
                  timepieces for future inspection.
                </p>
                <Link
                  to="/"
                  className="inline-block bg-[#D4AF37] text-[#0A0B0E] font-bold px-5 py-2 rounded-lg text-xs uppercase tracking-wider mt-2"
                >
                  Explore Catalog
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-[#181B22] border border-[#232733] hover:border-[#4D4635] p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-base text-[#F8F9FA]">
                      {ord.order_number || ord.id}
                    </span>
                    <span className="bg-[#D4AF37]/20 border border-[#D4AF37] text-[#F2CA50] text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
                      {ord.fulfillment_status?.replace(/_/g, " ") ||
                        "COURIER DISPATCH"}
                    </span>
                  </div>
                  <div className="text-xs text-[#9EACB9]">
                    {ord.watch_name || "Rolex Submariner Date 41mm"} · Total
                    Escrow:{" "}
                    <strong className="text-[#F8F9FA] font-mono">
                      ${(ord.total_amount || 15000).toLocaleString()} USD
                    </strong>
                  </div>
                  <div className="text-[11px] font-mono text-[#D4AF37]">
                    Courier Tracking: {ord.tracking_number || "FG-709882-GEN"}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <Link
                    to={`/orders/${ord.id}`}
                    className="flex-1 md:flex-none text-center bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A0B0E] font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-colors"
                  >
                    Track Shipment
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "addresses" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-lg font-bold text-[#F8F9FA]">
                Saved Delivery Destinations
              </h3>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 bg-[#1F1F23] border border-[#4D4635] text-[#F8F9FA] text-xs font-semibold px-3 py-1.5 rounded-lg hover:border-[#D4AF37] transition-colors"
              >
                <Plus className="w-4 h-4 text-[#D4AF37]" />
                <span>{showAddForm ? "Cancel" : "Add New Destination"}</span>
              </button>
            </div>

            {showAddForm && (
              <form
                onSubmit={handleAddAddress}
                className="bg-[#181B22] border border-[#232733] p-6 rounded-xl space-y-4 max-w-2xl"
              >
                <h4 className="font-serif font-bold text-sm text-[#F8F9FA]">
                  New Insured Delivery Address
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="col-span-2">
                    <label className="text-[#9EACB9] block mb-1">
                      Address Label
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Penthouse / Executive Office"
                      value={newAddr.name}
                      onChange={(e) =>
                        setNewAddr({ ...newAddr, name: e.target.value })
                      }
                      required
                      className="w-full bg-[#12141A] border border-[#232733] p-2.5 rounded text-[#F8F9FA] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[#9EACB9] block mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      placeholder="Street address & suite"
                      value={newAddr.street}
                      onChange={(e) =>
                        setNewAddr({ ...newAddr, street: e.target.value })
                      }
                      required
                      className="w-full bg-[#12141A] border border-[#232733] p-2.5 rounded text-[#F8F9FA] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="text-[#9EACB9] block mb-1">City</label>
                    <input
                      type="text"
                      placeholder="City"
                      value={newAddr.city}
                      onChange={(e) =>
                        setNewAddr({ ...newAddr, city: e.target.value })
                      }
                      required
                      className="w-full bg-[#12141A] border border-[#232733] p-2.5 rounded text-[#F8F9FA] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="text-[#9EACB9] block mb-1">
                      State / Zip
                    </label>
                    <input
                      type="text"
                      placeholder="State, Zip"
                      value={newAddr.zip}
                      onChange={(e) =>
                        setNewAddr({ ...newAddr, zip: e.target.value })
                      }
                      required
                      className="w-full bg-[#12141A] border border-[#232733] p-2.5 rounded text-[#F8F9FA] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A0B0E] font-bold px-4 py-2 rounded text-xs uppercase tracking-wider"
                >
                  Save Address
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-[#181B22] border border-[#232733] p-5 rounded-xl space-y-2 relative"
                >
                  {addr.isDefault && (
                    <span className="absolute top-4 right-4 text-[10px] bg-[#D4AF37]/10 text-[#F2CA50] border border-[#D4AF37]/30 px-2 py-0.5 rounded uppercase font-mono font-bold">
                      Default Delivery Destination
                    </span>
                  )}
                  <div className="font-serif font-bold text-base text-[#F8F9FA]">
                    {addr.name || "Primary Residence"}
                  </div>
                  <div className="text-xs text-[#9EACB9] leading-relaxed">
                    <strong className="text-[#F8F9FA] block">
                      {addr.recipient}
                    </strong>
                    {addr.street}
                    <br />
                    {addr.city}, {addr.state} {addr.zip}
                    <br />
                    {addr.country}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CustomerProfilePage;
