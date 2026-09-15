import { describe, it, expect } from "vitest";
import {
  authService,
  visitorService,
  approvalService,
  checkinService,
  historyService,
} from "./api";

describe("API Service Layer Contracts", () => {
  it("exports required authentication service methods", () => {
    expect(typeof authService.login).toBe("function");
    expect(typeof authService.getCurrentUser).toBe("function");
    expect(typeof authService.logout).toBe("function");
    expect(typeof authService.getStoredUser).toBe("function");
    expect(typeof authService.getStoredToken).toBe("function");
  });

  it("exports required visitor service methods", () => {
    expect(typeof visitorService.getHosts).toBe("function");
    expect(typeof visitorService.register).toBe("function");
  });

  it("exports required approval service methods", () => {
    expect(typeof approvalService.getPendingApprovals).toBe("function");
    expect(typeof approvalService.processAction).toBe("function");
  });

  it("exports required check-in and check-out service methods", () => {
    expect(typeof checkinService.lookup).toBe("function");
    expect(typeof checkinService.checkIn).toBe("function");
    expect(typeof checkinService.checkOut).toBe("function");
  });

  it("exports required history service methods", () => {
    expect(typeof historyService.getHistory).toBe("function");
    expect(typeof historyService.exportCsv).toBe("function");
  });
});
