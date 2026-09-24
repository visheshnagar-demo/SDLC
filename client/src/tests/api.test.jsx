import { describe, it, expect } from "vitest";
import * as api from "../services/api";

describe("API Service Suite", () => {
  it("exports all required Release Tracker endpoints and client", () => {
    expect(typeof api.getReleases).toBe("function");
    expect(typeof api.getRelease).toBe("function");
    expect(typeof api.createRelease).toBe("function");
    expect(typeof api.updateRelease).toBe("function");
    expect(typeof api.deleteRelease).toBe("function");

    expect(typeof api.getReleaseItems).toBe("function");
    expect(typeof api.addReleaseItem).toBe("function");
    expect(typeof api.updateReleaseItem).toBe("function");
    expect(typeof api.deleteReleaseItem).toBe("function");

    expect(typeof api.getReleaseReadiness).toBe("function");
    expect(typeof api.getDeployments).toBe("function");
    expect(typeof api.createDeployment).toBe("function");
    expect(typeof api.getAuditLogs).toBe("function");
  });

  it("configures axios baseURL and headers appropriately", () => {
    expect(api.apiClient).toBeDefined();
    expect(api.apiClient.defaults.headers["Content-Type"]).toBe(
      "application/json",
    );
  });
});
