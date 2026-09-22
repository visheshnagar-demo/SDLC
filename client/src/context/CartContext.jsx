import React, { createContext, useContext, useState, useEffect } from "react";
import { cartApi } from "../services/api";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [reservedWatch, setReservedWatch] = useState(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = window.localStorage.getItem("chrono_reserved_watch");
        return saved ? JSON.parse(saved) : null;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [holdExpiresAt, setHoldExpiresAt] = useState(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem("chrono_hold_expires_at") || null;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [secondsRemaining, setSecondsRemaining] = useState(0);

  // Sync state to localStorage
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        if (reservedWatch && holdExpiresAt) {
          window.localStorage.setItem(
            "chrono_reserved_watch",
            JSON.stringify(reservedWatch),
          );
          window.localStorage.setItem("chrono_hold_expires_at", holdExpiresAt);
        } else {
          window.localStorage.removeItem("chrono_reserved_watch");
          window.localStorage.removeItem("chrono_hold_expires_at");
        }
      }
    } catch (storageErr) {
      console.warn("Storage sync failed", storageErr);
    }
  }, [reservedWatch, holdExpiresAt]);

  // Reservation countdown timer
  useEffect(() => {
    if (!holdExpiresAt) {
      setSecondsRemaining(0);
      return;
    }

    const calculateRemaining = () => {
      const diffMs = new Date(holdExpiresAt).getTime() - new Date().getTime();
      const diffSec = Math.max(0, Math.floor(diffMs / 1000));
      setSecondsRemaining(diffSec);

      if (diffSec <= 0) {
        if (reservedWatch) {
          cartApi.releaseReservation(reservedWatch.id).catch(() => {});
        }
        setReservedWatch(null);
        setHoldExpiresAt(null);
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [holdExpiresAt, reservedWatch]);

  const reserveWatch = async (watch) => {
    try {
      const res = await cartApi.reserveWatch(watch.id);
      const expiresAt =
        res.expires_at ||
        res.hold_expires_at ||
        new Date(Date.now() + 15 * 60 * 1000).toISOString();

      setReservedWatch(watch);
      setHoldExpiresAt(expiresAt);
      return res;
    } catch (err) {
      if (!err.response) {
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        setReservedWatch(watch);
        setHoldExpiresAt(expiresAt);
        return { success: true, expires_at: expiresAt };
      }
      throw err;
    }
  };

  const releaseReservation = async () => {
    if (reservedWatch?.id) {
      try {
        await cartApi.releaseReservation(reservedWatch.id);
      } catch (err) {
        console.error("Error releasing reservation", err);
      }
    }
    setReservedWatch(null);
    setHoldExpiresAt(null);
    setSecondsRemaining(0);
  };

  const clearCart = () => {
    setReservedWatch(null);
    setHoldExpiresAt(null);
    setSecondsRemaining(0);
  };

  const formatTimeRemaining = () => {
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  return (
    <CartContext.Provider
      value={{
        reservedWatch,
        holdExpiresAt,
        secondsRemaining,
        formattedTimeRemaining: formatTimeRemaining(),
        hasActiveHold: !!reservedWatch && secondsRemaining > 0,
        reserveWatch,
        releaseReservation,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export default CartContext;
