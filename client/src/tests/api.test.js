import { describe, it, expect } from "vitest";
import api, {
  apiClient,
  loginUser,
  registerUser,
  getEvents,
  getEventTiers,
  createBooking,
  getPass,
  getUserPasses,
  validateGatePass,
  getLiveAnalytics,
  updatePassTier,
  exportAttendees,
} from "../services/api";

describe("API Service", () => {
  it("exports an axios apiClient instance with default configurations", () => {
    expect(apiClient).toBeDefined();
    expect(apiClient.defaults.baseURL).toBeDefined();
    expect(apiClient.defaults.headers["Content-Type"]).toBe("application/json");
  });

  it("exports all expected API contract service functions", () => {
    expect(typeof loginUser).toBe("function");
    expect(typeof registerUser).toBe("function");
    expect(typeof getEvents).toBe("function");
    expect(typeof getEventTiers).toBe("function");
    expect(typeof createBooking).toBe("function");
    expect(typeof getPass).toBe("function");
    expect(typeof getUserPasses).toBe("function");
    expect(typeof validateGatePass).toBe("function");
    expect(typeof getLiveAnalytics).toBe("function");
    expect(typeof updatePassTier).toBe("function");
    expect(typeof exportAttendees).toBe("function");
  });

  it("exports a default object containing all service methods", () => {
    expect(api).toBeDefined();
    expect(typeof api.getEvents).toBe("function");
    expect(typeof api.createBooking).toBe("function");
    expect(typeof api.validateGatePass).toBe("function");
  });
});
