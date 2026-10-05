import { describe, it, expect } from "vitest";
import * as api from "../services/api";

describe("API Service Interface", () => {
  it("exports all required Book endpoints", () => {
    expect(typeof api.getBooks).toBe("function");
    expect(typeof api.getBook).toBe("function");
    expect(typeof api.createBook).toBe("function");
    expect(typeof api.updateBook).toBe("function");
    expect(typeof api.deleteBook).toBe("function");
  });

  it("exports all required Patron endpoints", () => {
    expect(typeof api.getPatrons).toBe("function");
    expect(typeof api.getPatron).toBe("function");
    expect(typeof api.createPatron).toBe("function");
    expect(typeof api.updatePatron).toBe("function");
    expect(typeof api.getPatronLoans).toBe("function");
  });

  it("exports all required Loan and Circulation endpoints", () => {
    expect(typeof api.getLoans).toBe("function");
    expect(typeof api.getOverdueLoans).toBe("function");
    expect(typeof api.checkoutBook).toBe("function");
    expect(typeof api.returnBook).toBe("function");
  });

  it("exports health check endpoint", () => {
    expect(typeof api.checkHealth).toBe("function");
  });
});
