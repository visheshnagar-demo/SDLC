import { describe, it, expect } from "vitest";
import { api } from "../services/api";

describe("API Service Layer Contracts", () => {
  it("exports all mandatory analytics endpoints", () => {
    expect(typeof api.getDashboardAnalytics).toBe("function");
  });

  it("exports all mandatory room management endpoints", () => {
    expect(typeof api.getRooms).toBe("function");
    expect(typeof api.getRoomById).toBe("function");
    expect(typeof api.createRoom).toBe("function");
    expect(typeof api.updateRoomStatus).toBe("function");
  });

  it("exports all mandatory guest endpoints", () => {
    expect(typeof api.getGuests).toBe("function");
    expect(typeof api.getGuestById).toBe("function");
    expect(typeof api.createGuest).toBe("function");
  });

  it("exports all mandatory booking & check-in endpoints", () => {
    expect(typeof api.getBookings).toBe("function");
    expect(typeof api.getBookingById).toBe("function");
    expect(typeof api.createBooking).toBe("function");
    expect(typeof api.checkInGuest).toBe("function");
    expect(typeof api.checkOutGuest).toBe("function");
  });

  it("exports all mandatory invoicing & billing endpoints", () => {
    expect(typeof api.getInvoices).toBe("function");
    expect(typeof api.getInvoiceById).toBe("function");
    expect(typeof api.addInvoiceItem).toBe("function");
    expect(typeof api.payInvoice).toBe("function");
  });
});
