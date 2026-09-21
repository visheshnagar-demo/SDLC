import { describe, it, expect, vi } from "vitest";
import * as api from "./api";

describe("API Service Contracts", () => {
  it("exports all expected API service functions", () => {
    expect(typeof api.getDashboardSummary).toBe("function");
    expect(typeof api.getSystemHealth).toBe("function");
    expect(typeof api.listApis).toBe("function");
    expect(typeof api.getApiDetails).toBe("function");
    expect(typeof api.registerApi).toBe("function");
    expect(typeof api.updateApi).toBe("function");
    expect(typeof api.deleteApi).toBe("function");
    expect(typeof api.triggerApiCheck).toBe("function");
    expect(typeof api.getApiLogs).toBe("function");
    expect(typeof api.getApiMetrics).toBe("function");
    expect(typeof api.getGlobalFailures).toBe("function");
  });

  it("has configured apiClient with defaults", () => {
    expect(api.apiClient).toBeDefined();
    expect(api.apiClient.defaults.headers["Content-Type"]).toBe(
      "application/json",
    );
  });

  it("calls getDashboardSummary and resolves data", async () => {
    const mockSummary = {
      total_apis: 5,
      overall_uptime_pct: 99.8,
      average_latency_ms: 120,
    };
    vi.spyOn(api.apiClient, "get").mockResolvedValueOnce({ data: mockSummary });

    const data = await api.getDashboardSummary();
    expect(data).toEqual(mockSummary);
  });
});
