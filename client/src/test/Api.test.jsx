import { describe, it, expect } from "vitest";
import {
  authApi,
  providersApi,
  instancesApi,
  metricsApi,
  auditApi,
  systemApi,
} from "../services/api.js";

describe("API Service Interface Tests", () => {
  it("exports all required API service handlers", () => {
    expect(typeof authApi.login).toBe("function");
    expect(typeof authApi.getMe).toBe("function");
    expect(typeof providersApi.getProviders).toBe("function");
    expect(typeof providersApi.createProvider).toBe("function");
    expect(typeof instancesApi.getInstances).toBe("function");
    expect(typeof instancesApi.getInstance).toBe("function");
    expect(typeof instancesApi.provisionInstance).toBe("function");
    expect(typeof instancesApi.executeAction).toBe("function");
    expect(typeof metricsApi.getInstanceMetrics).toBe("function");
    expect(typeof auditApi.getAuditLogs).toBe("function");
    expect(typeof systemApi.healthCheck).toBe("function");
  });
});
