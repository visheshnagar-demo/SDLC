import { describe, it, expect } from "vitest";
import { apiService, apiClient } from "./api";

describe("apiService export structure", () => {
  it("exposes all required API methods", () => {
    expect(typeof apiService.listApis).toBe("function");
    expect(typeof apiService.createApi).toBe("function");
    expect(typeof apiService.getApiById).toBe("function");
    expect(typeof apiService.updateApi).toBe("function");
    expect(typeof apiService.deleteApi).toBe("function");
    expect(typeof apiService.triggerHealthCheck).toBe("function");
    expect(typeof apiService.getApiHealthLogs).toBe("function");
    expect(typeof apiService.getApiMetrics).toBe("function");
    expect(typeof apiService.getRecentFailures).toBe("function");
    expect(typeof apiService.checkServiceHealth).toBe("function");
  });

  it("has valid apiClient instance", () => {
    expect(apiClient).toBeDefined();
    expect(apiClient.defaults.headers["Content-Type"]).toBe("application/json");
  });
});
