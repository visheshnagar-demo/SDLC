import { describe, it, expect } from "vitest";
import api, {
  authApi,
  patientsApi,
  doctorsApi,
  appointmentsApi,
  ehrApi,
  auditApi,
} from "../services/api";

describe("API Service Layer Contracts", () => {
  it("exports auth endpoints", () => {
    expect(typeof authApi.login).toBe("function");
    expect(typeof authApi.register).toBe("function");
    expect(typeof authApi.getCurrentUser).toBe("function");
  });

  it("exports patient management endpoints", () => {
    expect(typeof patientsApi.getPatients).toBe("function");
    expect(typeof patientsApi.getPatientById).toBe("function");
    expect(typeof patientsApi.createPatient).toBe("function");
  });

  it("exports doctor and appointment endpoints", () => {
    expect(typeof doctorsApi.getDoctors).toBe("function");
    expect(typeof appointmentsApi.getSlots).toBe("function");
    expect(typeof appointmentsApi.bookAppointment).toBe("function");
    expect(typeof appointmentsApi.getAppointments).toBe("function");
    expect(typeof appointmentsApi.updateStatus).toBe("function");
  });

  it("exports EHR and audit logging endpoints", () => {
    expect(typeof ehrApi.createRecord).toBe("function");
    expect(typeof ehrApi.getPatientRecords).toBe("function");
    expect(typeof ehrApi.downloadPrescription).toBe("function");
    expect(typeof auditApi.getLogs).toBe("function");
  });
});
