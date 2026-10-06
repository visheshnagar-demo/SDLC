import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  AlertTriangle,
  Activity,
  Plus,
  FileCheck,
  Clock,
  Shield,
  Trash2,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { ehrApi } from "../../services/api.js";
import Badge from "../common/Badge.jsx";

export const EHRWorkspace = ({
  patient = null,
  onEncounterClosed = () => {},
}) => {
  const patientData = patient || {
    id: "pat-99201",
    name: "Jane Doe",
    mrn: "MRN-99201",
    age: "36y",
    gender: "Female",
    dob: "1988-04-15",
    allergy: "Penicillin (Severe)",
  };

  const [vitals, setVitals] = useState({
    bp: "142/90",
    hr: "76",
    temp: "98.6",
    spo2: "99",
  });

  const [chiefComplaint, setChiefComplaint] = useState(
    "Persistent tension headaches & elevated BP",
  );
  const [soapNotes, setSoapNotes] = useState(
    "Patient reports 3-week history of episodic morning headaches. Vitals recorded: BP 142/90 mmHg, HR 76 bpm, Temp 98.6°F, SpO2 99%. No acute chest distress. Auscultation normal S1/S2. Recommended ambulatory BP monitoring and initiate ACE inhibitor therapy.",
  );

  const [diagnoses, setDiagnoses] = useState([
    { id: "d1", code: "I10", desc: "Essential (Primary) Hypertension" },
    { id: "d2", code: "G44.2", desc: "Tension-type Headache" },
  ]);
  const [newDiagnosisCode, setNewDiagnosisCode] = useState("");
  const [newDiagnosisDesc, setNewDiagnosisDesc] = useState("");
  const [showAddDiagnosis, setShowAddDiagnosis] = useState(false);

  const [prescriptions, setPrescriptions] = useState([
    {
      id: "rx-1",
      medication: "Lisinopril",
      dosage: "10mg",
      frequency: "Once daily",
      duration: "30 days",
      instructions: "Take in morning with water",
    },
  ]);
  const [newRx, setNewRx] = useState({
    medication: "",
    dosage: "",
    frequency: "Once daily",
    duration: "30 days",
    instructions: "",
  });
  const [showAddRx, setShowAddRx] = useState(false);

  const [labOrders, setLabOrders] = useState([
    {
      id: "lab-1",
      test: "Comprehensive Metabolic Panel (CMP)",
      priority: "Routine",
      status: "Ordered",
    },
  ]);
  const [newLabTest, setNewLabTest] = useState("");
  const [showAddLab, setShowAddLab] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleAddDiagnosis = (e) => {
    e.preventDefault();
    if (!newDiagnosisCode) return;
    setDiagnoses((prev) => [
      ...prev,
      {
        id: `d-${Date.now()}`,
        code: newDiagnosisCode.trim(),
        desc: newDiagnosisDesc.trim() || "Clinical diagnosis",
      },
    ]);
    setNewDiagnosisCode("");
    setNewDiagnosisDesc("");
    setShowAddDiagnosis(false);
  };

  const handleAddPrescription = (e) => {
    e.preventDefault();
    if (!newRx.medication) return;
    setPrescriptions((prev) => [...prev, { id: `rx-${Date.now()}`, ...newRx }]);
    setNewRx({
      medication: "",
      dosage: "",
      frequency: "Once daily",
      duration: "30 days",
      instructions: "",
    });
    setShowAddRx(false);
  };

  const handleAddLab = (e) => {
    e.preventDefault();
    if (!newLabTest) return;
    setLabOrders((prev) => [
      ...prev,
      {
        id: `lab-${Date.now()}`,
        test: newLabTest,
        priority: "Routine",
        status: "Ordered",
      },
    ]);
    setNewLabTest("");
    setShowAddLab(false);
  };

  const handleCloseEncounter = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        patient_id: patientData.id,
        doctor_id: "doc-101",
        appointment_id: "apt-10023",
        chief_complaint: chiefComplaint,
        clinical_notes: soapNotes,
        vitals,
        diagnosis_codes: diagnoses.map((d) => d.code),
        prescriptions,
        lab_orders: labOrders,
        status: "Closed",
      };

      const result = await ehrApi.createEncounter(payload);
      setSuccess(
        "Encounter closed successfully! Itemized invoice INV-5001 automatically generated.",
      );
      onEncounterClosed(result);
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to close clinical encounter.";
      setError(
        typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Patient Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center font-bold text-slate-900 text-sm">
            JD
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold">{patientData.name}</h2>
              <span className="text-xs bg-slate-800 px-2.5 py-0.5 rounded text-slate-300 font-mono">
                {patientData.mrn}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {patientData.age} {patientData.gender} &bull; DOB:{" "}
              {patientData.dob}
            </p>
          </div>

          {patientData.allergy && (
            <div className="flex items-center gap-2 bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-lg text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Allergy: {patientData.allergy}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-emerald-400 font-mono bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            FHIR Resource: Encounter/enc-99201-active
          </span>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-xs text-rose-800"
        >
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">EHR Encounter Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div
          role="alert"
          className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 text-xs text-emerald-800"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Encounter Finalized</p>
            <p>{success}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Clinical Note Body */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              <h3 className="text-base font-bold text-slate-900">
                Active Encounter Notes
              </h3>
            </div>
            <Badge variant="warning">In Progress - Live Encounter</Badge>
          </div>

          {/* Vitals Flowsheet */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Patient Vitals Flowsheet
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Blood Pressure:</span>
                <input
                  type="text"
                  value={vitals.bp}
                  onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                  className="mt-1 font-bold text-amber-700 bg-white border border-slate-200 px-2 py-1 rounded w-full"
                />
              </div>
              <div>
                <span className="text-slate-500 block">Heart Rate:</span>
                <input
                  type="text"
                  value={vitals.hr}
                  onChange={(e) => setVitals({ ...vitals, hr: e.target.value })}
                  className="mt-1 font-bold text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded w-full"
                />
              </div>
              <div>
                <span className="text-slate-500 block">Temperature:</span>
                <input
                  type="text"
                  value={vitals.temp}
                  onChange={(e) =>
                    setVitals({ ...vitals, temp: e.target.value })
                  }
                  className="mt-1 font-bold text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded w-full"
                />
              </div>
              <div>
                <span className="text-slate-500 block">Oxygen (SpO2):</span>
                <input
                  type="text"
                  value={vitals.spo2}
                  onChange={(e) =>
                    setVitals({ ...vitals, spo2: e.target.value })
                  }
                  className="mt-1 font-bold text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded w-full"
                />
              </div>
            </div>
          </div>

          {/* Chief Complaint */}
          <div>
            <label
              htmlFor="chief_complaint_input"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Chief Complaint *
            </label>
            <input
              id="chief_complaint_input"
              type="text"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* SOAP Notes */}
          <div>
            <label
              htmlFor="soap_notes_textarea"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Clinical Progress Notes (SOAP Format) *
            </label>
            <textarea
              id="soap_notes_textarea"
              rows={5}
              value={soapNotes}
              onChange={(e) => setSoapNotes(e.target.value)}
              className="w-full p-3 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none leading-relaxed"
            />
          </div>

          {/* ICD-10 Diagnosis Codes */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                ICD-10 Diagnoses
              </h4>
              <button
                type="button"
                onClick={() => setShowAddDiagnosis(!showAddDiagnosis)}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Code</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {diagnoses.map((d) => (
                <span
                  key={d.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-lg text-xs font-medium"
                >
                  <strong>{d.code}</strong> - {d.desc}
                  <button
                    type="button"
                    onClick={() =>
                      setDiagnoses(diagnoses.filter((x) => x.id !== d.id))
                    }
                    className="text-sky-400 hover:text-rose-600"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>

            {showAddDiagnosis && (
              <form
                onSubmit={handleAddDiagnosis}
                className="flex gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs"
              >
                <input
                  type="text"
                  placeholder="ICD-10 (e.g. E11.9)"
                  value={newDiagnosisCode}
                  onChange={(e) => setNewDiagnosisCode(e.target.value)}
                  className="w-28 p-1.5 border rounded bg-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Diagnosis Description"
                  value={newDiagnosisDesc}
                  onChange={(e) => setNewDiagnosisDesc(e.target.value)}
                  className="flex-1 p-1.5 border rounded bg-white"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-teal-600 text-white rounded font-semibold"
                >
                  Add
                </button>
              </form>
            )}
          </div>

          {/* Prescriptions */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Digital Prescriptions (e-Rx)
              </h4>
              <button
                type="button"
                onClick={() => setShowAddRx(!showAddRx)}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medication</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Medication</th>
                    <th className="p-2.5">Dosage</th>
                    <th className="p-2.5">Frequency</th>
                    <th className="p-2.5">Instructions</th>
                    <th className="p-2.5 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prescriptions.map((rx) => (
                    <tr key={rx.id}>
                      <td className="p-2.5 font-bold text-slate-800">
                        {rx.medication}
                      </td>
                      <td className="p-2.5 text-slate-600">{rx.dosage}</td>
                      <td className="p-2.5 text-slate-600">
                        {rx.frequency} ({rx.duration})
                      </td>
                      <td className="p-2.5 text-slate-500">
                        {rx.instructions}
                      </td>
                      <td className="p-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            setPrescriptions(
                              prescriptions.filter((x) => x.id !== rx.id),
                            )
                          }
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {showAddRx && (
              <form
                onSubmit={handleAddPrescription}
                className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 mt-2 text-xs"
              >
                <input
                  type="text"
                  placeholder="Medication name"
                  value={newRx.medication}
                  onChange={(e) =>
                    setNewRx({ ...newRx, medication: e.target.value })
                  }
                  className="p-1.5 border rounded bg-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Dosage (e.g. 10mg)"
                  value={newRx.dosage}
                  onChange={(e) =>
                    setNewRx({ ...newRx, dosage: e.target.value })
                  }
                  className="p-1.5 border rounded bg-white"
                />
                <input
                  type="text"
                  placeholder="Instructions"
                  value={newRx.instructions}
                  onChange={(e) =>
                    setNewRx({ ...newRx, instructions: e.target.value })
                  }
                  className="p-1.5 border rounded bg-white"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-teal-600 text-white rounded font-semibold"
                >
                  Add Rx
                </button>
              </form>
            )}
          </div>

          {/* Lab Orders */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Laboratory Test Orders
              </h4>
              <button
                type="button"
                onClick={() => setShowAddLab(!showAddLab)}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Order Lab</span>
              </button>
            </div>

            <div className="space-y-2">
              {labOrders.map((lab) => (
                <div
                  key={lab.id}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-800">
                    {lab.test}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="info">{lab.priority}</Badge>
                    <Badge variant="primary">{lab.status}</Badge>
                    <button
                      type="button"
                      onClick={() =>
                        setLabOrders(labOrders.filter((x) => x.id !== lab.id))
                      }
                      className="text-slate-400 hover:text-rose-600 ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {showAddLab && (
              <form
                onSubmit={handleAddLab}
                className="flex gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 mt-2 text-xs"
              >
                <input
                  type="text"
                  placeholder="Test Name (e.g. Lipid Panel, HbA1c)"
                  value={newLabTest}
                  onChange={(e) => setNewLabTest(e.target.value)}
                  className="flex-1 p-1.5 border rounded bg-white"
                  required
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-teal-600 text-white rounded font-semibold"
                >
                  Order Test
                </button>
              </form>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg"
            >
              Save Draft Note
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleCloseEncounter}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Closing Encounter...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Close Encounter & Generate Invoice</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sidebar Info & HIPAA Log */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Patient History Timeline
            </h4>
            <div className="space-y-3">
              {[
                {
                  date: "Jun 02, 2026",
                  title: "Outpatient Triage - BP Followup",
                  doctor: "Dr. Jenkins",
                },
                {
                  date: "May 14, 2026",
                  title: "Routine Annual Wellness Exam",
                  doctor: "Dr. Chen",
                },
                {
                  date: "Jan 10, 2026",
                  title: "Allergy Consultation & Testing",
                  doctor: "Dr. Patel",
                },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3 text-xs">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800">{item.title}</p>
                    <p className="text-[11px] text-slate-400">
                      {item.date} &bull; {item.doctor}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-slate-700 text-xs font-bold uppercase">
              <Shield className="w-4 h-4 text-teal-600" />
              <span>HIPAA Access Audit Log</span>
            </div>
            <p className="text-[11px] font-mono text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed">
              Access Logged: Clinician Dr. Sarah Jenkins viewed PHI record at
              10:02:14 UTC (Workstation WS-CARD-04, IP 10.240.12.88).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

EHRWorkspace.propTypes = {
  patient: PropTypes.object,
  onEncounterClosed: PropTypes.func,
};

export default EHRWorkspace;
