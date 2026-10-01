import { describe, it, expect } from "vitest";
import {
  authApi,
  patientApi,
  appointmentApi,
  emrApi,
  auditApi,
} from "../services/api";

describe("Hospital Management System - API Service Module", () => {
  it("exports required API interfaces and methods", () => {
    expect(typeof authApi.login).toBe("function");
    expect(typeof authApi.register).toBe("function");
    expect(typeof patientApi.getPatients).toBe("function");
    expect(typeof patientApi.createPatient).toBe("function");
    expect(typeof appointmentApi.getAppointments).toBe("function");
    expect(typeof appointmentApi.createAppointment).toBe("function");
    expect(typeof emrApi.createClinicalNote).toBe("function");
    expect(typeof emrApi.createPrescription).toBe("function");
    expect(typeof auditApi.getAuditLogs).toBe("function");
  });
});
