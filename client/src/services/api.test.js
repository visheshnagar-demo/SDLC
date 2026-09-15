import { describe, it, expect } from "vitest";
import * as api from "./api";

describe("API Service Exports", () => {
  it("should export all required API functions", () => {
    expect(typeof api.classifyEmailText).toBe("function");
    expect(typeof api.classifyEmailFile).toBe("function");
    expect(typeof api.fetchEmails).toBe("function");
    expect(typeof api.fetchMetrics).toBe("function");
    expect(typeof api.fetchEmailById).toBe("function");
    expect(typeof api.overrideCategory).toBe("function");
    expect(typeof api.deleteEmail).toBe("function");
    expect(typeof api.checkHealth).toBe("function");
  });

  it("should have an apiClient configured with defaults", () => {
    expect(api.apiClient).toBeDefined();
    expect(api.apiClient.defaults.baseURL).toBeDefined();
  });
});
