import { describe, it, expect } from "vitest";
import {
  authApi,
  watchesApi,
  cartApi,
  ordersApi,
  wishlistApi,
} from "../services/api";

describe("API Service client exports", () => {
  it("exports all required API methods", () => {
    expect(typeof authApi.login).toBe("function");
    expect(typeof authApi.register).toBe("function");
    expect(typeof authApi.getProfile).toBe("function");

    expect(typeof watchesApi.getWatches).toBe("function");
    expect(typeof watchesApi.getWatchById).toBe("function");

    expect(typeof cartApi.reserveWatch).toBe("function");
    expect(typeof cartApi.releaseReservation).toBe("function");

    expect(typeof ordersApi.checkout).toBe("function");
    expect(typeof ordersApi.getOrders).toBe("function");
    expect(typeof ordersApi.getOrderById).toBe("function");

    expect(typeof wishlistApi.getWishlist).toBe("function");
    expect(typeof wishlistApi.toggleWishlist).toBe("function");
  });
});
