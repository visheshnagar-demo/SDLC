import { describe, it, expect } from "vitest";
import * as api from "../services/api";

describe("API Services", () => {
  it("exports all expected API endpoints", () => {
    expect(typeof api.registerUser).toBe("function");
    expect(typeof api.loginUser).toBe("function");
    expect(typeof api.getCurrentUser).toBe("function");
    expect(typeof api.getEvents).toBe("function");
    expect(typeof api.getEventById).toBe("function");
    expect(typeof api.getEventTiers).toBe("function");
    expect(typeof api.createBooking).toBe("function");
    expect(typeof api.getBookingById).toBe("function");
    expect(typeof api.getMyPasses).toBe("function");
    expect(typeof api.getPassById).toBe("function");
    expect(typeof api.listAllPasses).toBe("function");
    expect(typeof api.validateGatePass).toBe("function");
    expect(typeof api.getLiveAnalytics).toBe("function");
    expect(typeof api.updatePassTier).toBe("function");
    expect(typeof api.exportAttendeesCsv).toBe("function");
  });
});
