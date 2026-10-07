import { describe, it, expect } from "vitest";
import api, {
  login,
  register,
  getCows,
  getCowById,
  createCow,
  updateCow,
  deleteCow,
  getHealthRecords,
  createHealthRecord,
  getMilkYields,
  createMilkYield,
  getAnalyticsSummary,
  getYieldTrends,
} from "../services/api";

describe("API Service Contracts", () => {
  it("exports all expected authentication methods", () => {
    expect(typeof login).toBe("function");
    expect(typeof register).toBe("function");
  });

  it("exports all expected cattle management methods", () => {
    expect(typeof getCows).toBe("function");
    expect(typeof getCowById).toBe("function");
    expect(typeof createCow).toBe("function");
    expect(typeof updateCow).toBe("function");
    expect(typeof deleteCow).toBe("function");
  });

  it("exports health and medical record methods", () => {
    expect(typeof getHealthRecords).toBe("function");
    expect(typeof createHealthRecord).toBe("function");
  });

  it("exports milk yield logging methods", () => {
    expect(typeof getMilkYields).toBe("function");
    expect(typeof createMilkYield).toBe("function");
  });

  it("exports analytics and reporting endpoints", () => {
    expect(typeof getAnalyticsSummary).toBe("function");
    expect(typeof getYieldTrends).toBe("function");
  });

  it("default export includes all service functions", () => {
    expect(api.login).toBeDefined();
    expect(api.getCows).toBeDefined();
    expect(api.createMilkYield).toBeDefined();
    expect(api.getAnalyticsSummary).toBeDefined();
  });
});
