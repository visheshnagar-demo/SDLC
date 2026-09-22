import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { TopNavbar } from "../components/layout/TopNavbar";
import { Footer } from "../components/layout/Footer";
import { WatchDetailGallery } from "../components/detail/WatchDetailGallery";
import { ConditionScorecard } from "../components/detail/ConditionScorecard";
import { watchesApi } from "../services/api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { MOCK_WATCHES } from "./CatalogPage";
import {
  ShieldCheck,
  Heart,
  Lock,
  Truck,
  ArrowLeft,
  CheckCircle,
  Clock,
} from "lucide-react";

export const WatchDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { reserveWatch } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [watch, setWatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReserving, setIsReserving] = useState(false);
  const [reserveError, setReserveError] = useState("");

  useEffect(() => {
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const data = await watchesApi.getWatchById(id);
        if (data && data.id) {
          setWatch(data);
        } else {
          // Fallback to mock item
          const found =
            MOCK_WATCHES.find((w) => w.id === id) || MOCK_WATCHES[0];
          setWatch(found);
        }
      } catch (err) {
        console.error("Failed to load from backend, using fallback mock", err);
        const found = MOCK_WATCHES.find((w) => w.id === id) || MOCK_WATCHES[0];
        setWatch(found);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const handleReserveAndCheckout = async () => {
    if (!watch) return;
    setIsReserving(true);
    setReserveError("");
    try {
      await reserveWatch(watch);
      navigate("/checkout");
    } catch (err) {
      console.error("Reservation error", err);
      const msg =
        err.response?.data?.detail ||
        "This timepiece is currently held in another collector's reservation vault. Please try again shortly.";
      setReserveError(msg);
    } finally {
      setIsReserving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121316] text-[#F8F9FA] flex flex-col">
        <TopNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Clock className="w-8 h-8 text-[#D4AF37] animate-spin" />
            <span className="text-xs font-mono text-[#9EACB9]">
              Loading Horological Vault Data...
            </span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!watch) {
    return (
      <div className="min-h-screen bg-[#121316] text-[#F8F9FA] flex flex-col">
        <TopNavbar />
        <div className="flex-1 max-w-4xl mx-auto px-6 py-20 text-center space-y-4">
          <h2 className="font-serif text-2xl font-bold">Timepiece not found</h2>
          <p className="text-xs text-[#9EACB9]">
            The requested watch reference is not registered in our Geneva vault.
          </p>
          <Link
            to="/"
            className="inline-block bg-[#D4AF37] text-[#0A0B0E] font-bold px-6 py-2 rounded text-xs"
          >
            Return to Catalog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isFavorited = isInWishlist(watch.id);
  const isAvailable = watch.status === "AVAILABLE" || !watch.status;

  return (
    <div className="min-h-screen bg-[#121316] text-[#F8F9FA] flex flex-col">
      <TopNavbar />

      {/* Breadcrumb & Navigation */}
      <div className="border-b border-[#232733] bg-[#0A0B0E]/60 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-[#9EACB9] hover:text-[#D4AF37] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Certified Catalog</span>
          </Link>
          <div className="text-[11px] font-mono text-[#9EACB9]">
            <span>Vault Registry: </span>
            <strong className="text-[#D4AF37]">
              {watch.brand} · Ref. {watch.reference_number || "126610LN"}
            </strong>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 grid grid-cols-12 gap-10">
        {/* Left Column (7 cols): Macro Gallery */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          <WatchDetailGallery watch={watch} />

          {/* Technical Specifications Table */}
          <div className="bg-[#181B22] p-6 rounded-xl border border-[#232733] space-y-4 shadow-md">
            <h3 className="font-serif text-lg font-bold text-[#F8F9FA] border-b border-[#232733] pb-3">
              Comprehensive Horological Specifications
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-[#12141A] p-3 rounded-lg border border-[#232733]/50">
                <span className="text-[#9EACB9] block text-[10px] uppercase font-mono">
                  Maison / Brand
                </span>
                <strong className="text-[#F8F9FA] text-sm">
                  {watch.brand}
                </strong>
              </div>
              <div className="bg-[#12141A] p-3 rounded-lg border border-[#232733]/50">
                <span className="text-[#9EACB9] block text-[10px] uppercase font-mono">
                  Model &amp; Ref
                </span>
                <strong className="text-[#F8F9FA] text-sm">
                  {watch.model} ({watch.reference_number || "N/A"})
                </strong>
              </div>
              <div className="bg-[#12141A] p-3 rounded-lg border border-[#232733]/50">
                <span className="text-[#9EACB9] block text-[10px] uppercase font-mono">
                  Year of Manufacture
                </span>
                <strong className="text-[#F8F9FA] text-sm">
                  {watch.year_of_manufacture || 2022}
                </strong>
              </div>
              <div className="bg-[#12141A] p-3 rounded-lg border border-[#232733]/50">
                <span className="text-[#9EACB9] block text-[10px] uppercase font-mono">
                  Caliber Movement
                </span>
                <strong className="text-[#F8F9FA] text-sm">
                  {watch.movement_type || "Automatic Self-Winding"}
                </strong>
              </div>
              <div className="bg-[#12141A] p-3 rounded-lg border border-[#232733]/50">
                <span className="text-[#9EACB9] block text-[10px] uppercase font-mono">
                  Case Diameter &amp; Material
                </span>
                <strong className="text-[#F8F9FA] text-sm">
                  {watch.case_size_mm ? `${watch.case_size_mm}mm` : "41mm"} ·{" "}
                  {watch.bezel_material || "Oystersteel"}
                </strong>
              </div>
              <div className="bg-[#12141A] p-3 rounded-lg border border-[#232733]/50">
                <span className="text-[#9EACB9] block text-[10px] uppercase font-mono">
                  Dial &amp; Strap
                </span>
                <strong className="text-[#F8F9FA] text-sm">
                  {watch.dial_color || "Black"} Dial ·{" "}
                  {watch.strap_material || "Oystersteel"}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Atelier Info, Scorecard & Concurrency Reservation */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          {/* Header */}
          <div className="border-b border-[#232733] pb-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#D4AF37] uppercase tracking-widest font-bold">
                {watch.brand} GENÈVE
              </span>
              <button
                onClick={() => toggleWishlist(watch)}
                className="flex items-center gap-1.5 text-xs text-[#9EACB9] hover:text-[#D4AF37] transition-colors"
              >
                <Heart
                  className={`w-4 h-4 ${
                    isFavorited ? "fill-[#D4AF37] text-[#D4AF37]" : ""
                  }`}
                />
                <span>
                  {isFavorited ? "Saved to Wishlist" : "Add to Wishlist"}
                </span>
              </button>
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#F8F9FA]">
              {watch.model}
            </h1>
            <div className="text-xs text-[#9EACB9] font-mono">
              Ref. {watch.reference_number || "126610LN"} · Serial:{" "}
              {watch.serial_number || "884J921X"} · Year{" "}
              {watch.year_of_manufacture || 2022}
            </div>
          </div>

          {/* Condition Scorecard */}
          <ConditionScorecard watch={watch} />

          {/* Pricing Box & Armored Transit Guarantee */}
          <div className="bg-[#181B22] border border-[#232733] p-6 rounded-xl space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-[#9EACB9] block">
                  Escrow Acquisition Price
                </span>
                <div className="text-3xl font-bold font-mono text-[#F2CA50]">
                  ${(watch.price || 0).toLocaleString()}{" "}
                  <span className="text-sm font-sans font-normal text-[#9EACB9]">
                    USD
                  </span>
                </div>
              </div>
              <span className="bg-[#12141A] text-emerald-400 border border-emerald-500/30 text-[10px] uppercase font-bold px-2.5 py-1 rounded flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> In Stock (1-of-1)
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#9EACB9] border-t border-[#232733] pt-3">
              <Truck className="w-4 h-4 text-[#D4AF37]" />
              <span>
                Complimentary Armored Courier Delivery &amp; Insurance
              </span>
            </div>

            {/* Error banner if reservation conflict */}
            {reserveError && (
              <div className="bg-red-950/60 border border-red-500/50 text-red-200 text-xs p-3 rounded-lg">
                {reserveError}
              </div>
            )}

            {/* Concurrency Reservation CTA */}
            {isAvailable ? (
              <button
                onClick={handleReserveAndCheckout}
                disabled={isReserving}
                className="w-full bg-[#D4AF37] hover:bg-[#E5C158] disabled:bg-[#896C00] text-[#0A0B0E] font-bold py-4 rounded-xl text-base uppercase tracking-wider shadow-lg shadow-[#D4AF37]/20 transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {isReserving
                    ? "LOCKING VAULT RESERVATION..."
                    : "RESERVE TIMEPIECE & ESCROW CHECKOUT"}
                </span>
              </button>
            ) : (
              <button
                disabled
                className="w-full bg-[#181B22] text-[#9EACB9] border border-[#232733] font-bold py-4 rounded-xl text-sm uppercase tracking-wider cursor-not-allowed opacity-60"
              >
                Timepiece Unavailable
              </button>
            )}

            <div className="text-[11px] text-center text-[#9EACB9] leading-relaxed">
              * Locking this timepiece creates an exclusive 15-minute
              concurrency hold in the Geneva vault, preventing duplicate
              purchases.
            </div>
          </div>

          {/* Buyer Protection Badges */}
          <div className="grid grid-cols-2 gap-3 text-xs text-[#9EACB9]">
            <div className="bg-[#12141A] border border-[#232733] p-3 rounded-lg flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>2-Year Atelier Warranty Included</span>
            </div>
            <div className="bg-[#12141A] border border-[#232733] p-3 rounded-lg flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>100% Secure Swiss Escrow</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default WatchDetailPage;
