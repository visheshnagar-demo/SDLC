import React, { createContext, useContext, useState, useEffect } from "react";
import { wishlistApi } from "../services/api";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = window.localStorage.getItem("chrono_wishlist");
        return saved ? JSON.parse(saved) : [];
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(
          "chrono_wishlist",
          JSON.stringify(wishlist),
        );
      }
    } catch (storageErr) {
      console.warn("Storage sync failed", storageErr);
    }
  }, [wishlist]);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await wishlistApi.getWishlist();
        if (Array.isArray(res)) {
          setWishlist(res);
        }
      } catch (err) {
        console.error("Failed to load wishlist from server", err);
      }
    };
    fetchWishlist();
  }, [isAuthenticated]);

  const isInWishlist = (watchId) => {
    return wishlist.some(
      (item) => (item.id || item.watch_id || item) === watchId,
    );
  };

  const toggleWishlist = async (watch) => {
    const watchId = watch.id || watch;
    const exists = isInWishlist(watchId);

    if (exists) {
      setWishlist((prev) =>
        prev.filter((item) => (item.id || item.watch_id || item) !== watchId),
      );
    } else {
      setWishlist((prev) => [...prev, watch]);
    }

    if (isAuthenticated) {
      try {
        await wishlistApi.toggleWishlist(watchId);
      } catch (err) {
        console.error("Error toggling wishlist on backend", err);
      }
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        isInWishlist,
        toggleWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};

export default WishlistContext;
