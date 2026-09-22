import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Heart, Box } from "lucide-react";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";

export const WatchCard = ({ watch }) => {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { reserveWatch } = useCart();

  const isFavorited = isInWishlist(watch.id);
  const isAvailable = watch.status === "AVAILABLE" || !watch.status;
  const isReserved = watch.status === "RESERVED";
  const isSold = watch.status === "SOLD";

  const primaryImage =
    watch.image_urls && watch.image_urls.length > 0
      ? watch.image_urls[0]
      : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80";

  const handleQuickReserve = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAvailable) return;
    try {
      await reserveWatch(watch);
      navigate("/checkout");
    } catch {
      navigate(`/watches/${watch.id}`);
    }
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(watch);
  };

  return (
    <div className="group bg-[#12141A] border border-[#232733] hover:border-[#D4AF37] rounded-xl p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-[#D4AF37]/5">
      <div>
        {/* Image Container with Badges */}
        <div className="relative h-64 bg-[#0A0B0E] rounded-lg overflow-hidden flex items-center justify-center p-4 border border-[#232733]/50">
          <img
            src={primaryImage}
            alt={`${watch.brand} ${watch.model}`}
            className="h-full w-full object-contain transform group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80";
            }}
          />

          {/* Top Left: Authentic Certificate Badge */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            <span className="bg-[#12141A]/90 backdrop-blur border border-[#D4AF37] text-[#F2CA50] text-[10px] uppercase font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow">
              <ShieldCheck className="w-3 h-3 text-[#D4AF37]" />
              Certified
            </span>
            {watch.box_included && watch.papers_included && (
              <span className="bg-[#181B22]/90 backdrop-blur border border-[#232733] text-[#9EACB9] text-[9px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1">
                <Box className="w-2.5 h-2.5" /> Full Set
              </span>
            )}
          </div>

          {/* Top Right: Condition Pill & Wishlist Button */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
            <span className="bg-[#181B22]/95 border border-[#232733] text-[#F8F9FA] text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow">
              {watch.condition_score
                ? `${watch.condition_score} / 10`
                : "9.8 / Mint"}
            </span>
            <button
              onClick={handleWishlistClick}
              className="p-1.5 rounded-full bg-[#12141A]/80 border border-[#232733] hover:border-[#D4AF37] text-[#9EACB9] hover:text-[#D4AF37] transition-colors"
              title={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  isFavorited ? "fill-[#D4AF37] text-[#D4AF37]" : ""
                }`}
              />
            </button>
          </div>

          {/* Status Overlay if Reserved/Sold */}
          {isSold && (
            <div className="absolute inset-0 bg-[#0A0B0E]/80 backdrop-blur-sm flex items-center justify-center">
              <span className="border-2 border-red-500/80 text-red-400 font-serif font-bold uppercase tracking-widest px-4 py-1.5 rounded text-sm rotate-[-12deg]">
                Sold to Collector
              </span>
            </div>
          )}
          {isReserved && !isSold && (
            <div className="absolute inset-0 bg-[#0A0B0E]/70 backdrop-blur-sm flex items-center justify-center">
              <span className="border-2 border-[#D4AF37]/80 text-[#F2CA50] font-serif font-bold uppercase tracking-widest px-3 py-1 rounded text-xs rotate-[-8deg] animate-pulse">
                In Vault Escrow Hold
              </span>
            </div>
          )}
        </div>

        {/* Watch Information */}
        <div className="mt-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#9EACB9] font-mono">
            <span className="uppercase tracking-wider font-semibold text-[#D4AF37]">
              {watch.brand}
            </span>
            <span>
              {watch.reference_number
                ? `Ref. ${watch.reference_number}`
                : `Year ${watch.year_of_manufacture || 2022}`}
            </span>
          </div>

          <Link
            to={`/watches/${watch.id}`}
            className="block font-serif text-lg text-[#F8F9FA] font-semibold hover:text-[#D4AF37] transition-colors line-clamp-1"
          >
            {watch.model}
          </Link>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xl font-bold text-[#F2CA50] font-mono">
              ${(watch.price || 0).toLocaleString()}{" "}
              <span className="text-xs text-[#9EACB9] font-sans font-normal">
                USD
              </span>
            </div>
            <div className="text-[11px] text-[#9EACB9] font-mono">
              {watch.year_of_manufacture && `${watch.year_of_manufacture} · `}
              {watch.case_size_mm ? `${watch.case_size_mm}mm` : "41mm"}
            </div>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="mt-4 pt-3 border-t border-[#232733] flex gap-2">
        <Link
          to={`/watches/${watch.id}`}
          className="flex-1 text-center bg-[#1F1F23] hover:bg-[#2A2E39] border border-[#4D4635] text-[#F8F9FA] text-xs font-semibold py-2.5 rounded transition-colors uppercase tracking-wider"
        >
          Inspect Details
        </Link>
        {isAvailable ? (
          <button
            onClick={handleQuickReserve}
            className="flex-1 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A0B0E] font-bold py-2.5 rounded text-xs uppercase tracking-wider transition-colors shadow-md shadow-[#D4AF37]/10"
          >
            Vault Hold
          </button>
        ) : (
          <button
            disabled
            className="flex-1 bg-[#181B22] text-[#9EACB9] border border-[#232733] font-semibold py-2.5 rounded text-xs uppercase tracking-wider cursor-not-allowed opacity-60"
          >
            Unavailable
          </button>
        )}
      </div>
    </div>
  );
};

export default WatchCard;
