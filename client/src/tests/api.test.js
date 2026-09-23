import { describe, it, expect } from "vitest";
import emailService from "../services/api";

describe("emailService API Client", () => {
  it("exports all expected API methods", () => {
    expect(typeof emailService.ingestRawText).toBe("function");
    expect(typeof emailService.uploadEmailFile).toBe("function");
    expect(typeof emailService.getEmails).toBe("function");
    expect(typeof emailService.getEmailById).toBe("function");
    expect(typeof emailService.overrideCategory).toBe("function");
    expect(typeof emailService.checkHealth).toBe("function");
  });
});
