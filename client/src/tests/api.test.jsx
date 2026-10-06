import { describe, it, expect } from "vitest";
import api, {
  authApi,
  patientApi,
  appointmentApi,
  ehrApi,
  billingApi,
} from "../services/api.js";

describe("API Service Layer Contracts", () => {
  it("exports auth endpoints", () => {
    expect(typeof authApi.login).toBe("function");
    expect(typeof authApi.register).toBe("function");
    expect(typeof authApi.getMe).toBe("function");
    expect(typeof authApi.logout).toBe("function");
  });

  it("exports patient endpoints", () => {
    expect(typeof patientApi.getPatients).toBe("function");
    expect(typeof patientApi.getPatientById).toBe("function");
    expect(typeof patientApi.createPatient).toBe("function");
    expect(typeof patientApi.updatePatient).toBe("function");
  });

  it("exports appointment endpoints", () => {
    expect(typeof appointmentApi.getAppointments).toBe("function");
    expect(typeof appointmentApi.bookAppointment).toBe("function");
    expect(typeof appointmentApi.updateAppointmentStatus).toBe("function");
  });

  it("exports ehr endpoints", () => {
    expect(typeof ehrApi.getPatientEncounters).toBe("function");
    expect(typeof ehrApi.getEncounterById).toBe("function");
    expect(typeof ehrApi.createEncounter).toBe("function");
    expect(typeof ehrApi.closeEncounter).toBe("function");
  });

  it("exports billing endpoints", () => {
    expect(typeof billingApi.getInvoices).toBe("function");
    expect(typeof billingApi.getInvoiceById).toBe("function");
    expect(typeof billingApi.payInvoice).toBe("function");
  });

  it("exports unified api default object", () => {
    expect(api.auth).toBeDefined();
    expect(api.patients).toBeDefined();
    expect(api.appointments).toBeDefined();
    expect(api.ehr).toBeDefined();
    expect(api.billing).toBeDefined();
  });
});
