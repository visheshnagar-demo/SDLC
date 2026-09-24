import { describe, it, expect } from "vitest";
import * as api from "../services/api";

describe("API Service contracts", () => {
  it("exports all expected API methods", () => {
    expect(typeof api.getMonitors).toBe("function");
    expect(typeof api.getMonitor).toBe("function");
    expect(typeof api.createMonitor).toBe("function");
    expect(typeof api.updateMonitor).toBe("function");
    expect(typeof api.deleteMonitor).toBe("function");
    expect(typeof api.triggerHealthCheck).toBe("function");
    expect(typeof api.getHealthLogs).toBe("function");
    expect(typeof api.getMetrics).toBe("function");
  });

  it("configures axios client with default headers", () => {
    expect(api.apiClient).toBeDefined();
    expect(api.apiClient.defaults.headers["Content-Type"]).toBe(
      "application/json",
    );
  });
});
