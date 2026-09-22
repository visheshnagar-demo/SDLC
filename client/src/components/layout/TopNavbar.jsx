import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Heart, Clock, User, LogOut, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";

export const TopNavbar = ({ searchQuery, setSearchQuery }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { hasActiveHold, formattedTimeRemaining } = useCart();
  const { wishlistCount } = useWishlist();

  const handleSearchChange = (e) => {
    if (setSearchQuery) {
      setSearchQuery(e.target.value);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#232733] bg-[#12141A]/95 backdrop-blur px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#896C00] via-[#D4AF37] to-[#F2CA50] flex items-center justify-center text-[#0A0B0E] font-bold shadow-md shadow-[#D4AF37]/10">
            <ShieldCheck className="w-5 h-5 text-[#0A0B0E]" />
          </div>
          <div>
            <span className="text-xl font-serif text-[#F2CA50] font-bold tracking-wider group-hover:text-[#E5C158] transition-colors">
              CHRONO CERTIFIED
            </span>
            <span className="block text-[9px] uppercase tracking-widest text-[#9EACB9] font-mono -mt-1">
              Geneva Vault & Atelier
            </span>
          </div>
        </Link>

        {/* Global Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9EACB9]" />
          <input
            type="text"
            placeholder="Search reference, model, brand..."
            value={searchQuery || ""}
            onChange={handleSearchChange}
            className="w-full bg-[#1F1F23] border border-[#4D4635] focus:border-[#D4AF37] rounded-lg pl-9 pr-4 py-2 text-sm text-[#F8F9FA] placeholder-[#9EACB9] focus:outline-none transition-all shadow-inner"
          />
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center gap-4 text-sm">
          <Link
            to="/"
            className="text-[#9EACB9] hover:text-[#F8F9FA] transition-colors font-medium px-2 py-1"
          >
            Catalog
          </Link>

          <Link
            to="/orders"
            className="text-[#9EACB9] hover:text-[#F8F9FA] transition-colors font-medium px-2 py-1"
          >
            Tracking
          </Link>

          {/* Wishlist Link */}
          <Link
            to="/profile"
            className="flex items-center gap-1 text-[#D4AF37] hover:text-[#E5C158] transition-colors font-medium px-2 py-1"
          >
            <Heart className="w-4 h-4" />
            <span>Wishlist ({wishlistCount})</span>
          </Link>

          {/* Active 15-Min Vault Hold Badge */}
          {hasActiveHold ? (
            <Link
              to="/checkout"
              className="flex items-center gap-1.5 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A0B0E] font-bold px-3 py-1.5 rounded text-xs uppercase tracking-wider transition-all animate-pulse shadow-md shadow-[#D4AF37]/20"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>VAULT HOLD · {formattedTimeRemaining}</span>
            </Link>
          ) : (
            <Link
              to="/checkout"
              className="text-[#9EACB9] hover:text-[#F8F9FA] transition-colors font-medium text-xs border border-[#232733] px-3 py-1.5 rounded"
            >
              Cart
            </Link>
          )}

          {/* User Profile / Auth */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3 pl-2 border-l border-[#232733]">
              <Link
                to="/profile"
                className="flex items-center gap-1.5 text-xs text-[#F8F9FA] hover:text-[#D4AF37] transition-colors"
              >
                <User className="w-4 h-4 text-[#D4AF37]" />
                <span className="hidden sm:inline font-mono">
                  {user?.full_name || user?.email?.split("@")[0] || "Account"}
                </span>
              </Link>
              <button
                onClick={logout}
                title="Log out"
                className="text-[#9EACB9] hover:text-red-400 transition-colors p-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0B0E] text-xs font-semibold px-3 py-1.5 rounded transition-all tracking-wider uppercase"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
