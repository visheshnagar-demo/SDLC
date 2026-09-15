import { describe, it, expect } from "vitest";
import * as api from "./api.js";

describe("API Services Structural Test", () => {
  it("exports all expected API service methods", () => {
    expect(typeof api.getKPIs).toBe("function");
    expect(typeof api.getSKUs).toBe("function");
    expect(typeof api.getScenarios).toBe("function");
    expect(typeof api.getScenarioByCode).toBe("function");
    expect(typeof api.evaluateScenario).toBe("function");
    expect(typeof api.submitApproval).toBe("function");
    expect(typeof api.getApprovalHistory).toBe("function");
  });

  it("has apiClient instance configured with defaults", () => {
    expect(api.apiClient).toBeDefined();
    expect(api.apiClient.defaults.headers["Content-Type"]).toBe(
      "application/json",
    );
  });
});
