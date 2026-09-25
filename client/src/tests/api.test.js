import { describe, it, expect } from "vitest";
import * as api from "../services/api";

describe("API Service Exports", () => {
  it("exports all expected API service methods", () => {
    expect(typeof api.getTanks).toBe("function");
    expect(typeof api.createTank).toBe("function");
    expect(typeof api.ingestTelemetry).toBe("function");
    expect(typeof api.getTelemetryHistory).toBe("function");
    expect(typeof api.getLatestTelemetry).toBe("function");
    expect(typeof api.getThresholds).toBe("function");
    expect(typeof api.createOrUpdateThreshold).toBe("function");
    expect(typeof api.getAlerts).toBe("function");
    expect(typeof api.updateAlertStatus).toBe("function");
    expect(typeof api.getFeedingSchedules).toBe("function");
    expect(typeof api.createFeedingSchedule).toBe("function");
    expect(typeof api.getFeedingLogs).toBe("function");
    expect(typeof api.createFeedingLog).toBe("function");
    expect(typeof api.getHealthRecords).toBe("function");
    expect(typeof api.createHealthRecord).toBe("function");
    expect(typeof api.getEquipment).toBe("function");
    expect(typeof api.createEquipment).toBe("function");
    expect(typeof api.createMaintenanceLog).toBe("function");
  });

  it("configures apiClient with correct defaults", () => {
    expect(api.apiClient).toBeDefined();
    expect(api.apiClient.defaults.headers["Content-Type"]).toBe(
      "application/json",
    );
  });
});
