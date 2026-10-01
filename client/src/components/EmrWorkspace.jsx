import React, { useState, useEffect } from "react";
import {
  FileText,
  CheckCircle,
  PlusCircle,
  Clock,
  ShieldCheck,
  Pill,
  TestTube,
  Lock,
  AlertCircle,
  Check,
  History,
  Send,
} from "lucide-react";
import { emrApi } from "../services/api";

export default function EmrWorkspace({ patient, currentUser }) {
  const [encounters, setEncounters] = useState([]);
  const [selectedEncounter, setSelectedEncounter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, message: "" });

  // SOAP Note Form State
  const [soapData, setSoapData] = useState({
    subjective:
      "Patient reports mild chest tightness and fatigue over the past 3 days. No shortness of breath at rest.",
    objective:
      "BP: 138/88 mmHg, HR: 74 bpm, Resp: 16/min, Temp: 98.4 F. Lungs clear to auscultation bilaterally.",
    assessment:
      "Primary Hypertension (ICD-10 I10), stable with elevated systolic pressure.",
    plan: "Initiate Lisinopril 10mg PO once daily. Order Comprehensive Metabolic Panel (CMP). Follow up in 4 weeks.",
    diagnosis: "Primary Hypertension (I10)",
  });

  const [clinicalNotes, setClinicalNotes] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [addendumText, setAddendumText] = useState("");
  const [showAddendumInput, setShowAddendumInput] = useState(false);

  // New Prescription Form State
  const [newPrescription, setNewPrescription] = useState({
    medication_name: "Lisinopril",
    dosage: "10mg",
    frequency: "Once daily",
    duration: "30 days",
    instructions: "Take oral tablet every morning with water.",
  });

  // Selected Lab Orders
  const [selectedLabs, setSelectedLabs] = useState([
    "Lipid Panel",
    "Comprehensive Metabolic Panel (CMP)",
  ]);

  const AVAILABLE_LABS = [
    "Comprehensive Metabolic Panel (CMP)",
    "Complete Blood Count (CBC)",
    "Lipid Panel",
    "Hemoglobin A1c (HbA1c)",
    "Thyroid Panel (TSH)",
    "12-Lead Electrocardiogram (ECG)",
    "Chest X-Ray (PA & Lateral)",
  ];

  useEffect(() => {
    if (patient?.id) {
      loadEncounters(patient.id);
    }
  }, [patient]);

  const loadEncounters = async (patientId) => {
    setLoading(true);
    try {
      const data = await emrApi.getEncounters(patientId);
      const encounterList = Array.isArray(data) ? data : [];
      setEncounters(encounterList);

      if (encounterList.length > 0) {
        setSelectedEncounter(encounterList[0]);
      } else {
        // Create an initial open encounter for clinical workflow if none exists
        const defaultEnc = {
          id: `enc-${Date.now()}`,
          patient_id: patientId,
          doctor_id: currentUser?.id || "doc-101",
          encounter_date: new Date().toISOString(),
          chief_complaint: "Routine Clinical Examination & Preventive Health",
          status: "OPEN",
        };
        setEncounters([defaultEnc]);
        setSelectedEncounter(defaultEnc);
      }
    } catch (err) {
      // Fallback local encounter state for UI testing
      const defaultEnc = {
        id: `enc-${Date.now()}`,
        patient_id: patientId,
        doctor_id: currentUser?.id || "doc-101",
        encounter_date: new Date().toISOString(),
        chief_complaint: "Cardiology Consultation & Diagnostic Review",
        status: "OPEN",
      };
      setEncounters([defaultEnc]);
      setSelectedEncounter(defaultEnc);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewEncounter = async () => {
    if (!patient?.id) return;
    setActionLoading(true);
    try {
      const payload = {
        patient_id: patient.id,
        doctor_id: currentUser?.id || "doc-101",
        encounter_date: new Date().toISOString(),
        chief_complaint: "Follow-up Medical Consultation",
        status: "OPEN",
      };
      const res = await emrApi.createEncounter(payload);
      const newEnc = res || { ...payload, id: `enc-${Date.now()}` };
      setEncounters((prev) => [newEnc, ...prev]);
      setSelectedEncounter(newEnc);
      setClinicalNotes([]);
      setFeedback({
        type: "success",
        message: "New clinical encounter opened.",
      });
    } catch (err) {
      setFeedback({ type: "error", message: "Could not create encounter." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignAndFinalizeNote = async () => {
    if (!selectedEncounter) return;
    setActionLoading(true);
    setFeedback({ type: null, message: "" });

    try {
      const formattedNoteText = `[SUBJECTIVE]: ${soapData.subjective}\n\n[OBJECTIVE]: ${soapData.objective}\n\n[ASSESSMENT]: ${soapData.assessment}\n\n[PLAN]: ${soapData.plan}\n\n[LABS ORDERED]: ${selectedLabs.join(", ")}`;

      const notePayload = {
        encounter_id: selectedEncounter.id,
        doctor_id: currentUser?.id || "doc-101",
        note_text: formattedNoteText,
        diagnosis: soapData.diagnosis,
        is_signed: true,
        signed_at: new Date().toISOString(),
      };

      const result = await emrApi.createClinicalNote(notePayload);
      const signedNote = result || {
        ...notePayload,
        id: `note-${Date.now()}`,
        addendums: [],
      };

      setClinicalNotes((prev) => [...prev, signedNote]);
      setFeedback({
        type: "success",
        message:
          "Clinical SOAP note signed, sealed, and locked as immutable legal EMR record.",
      });
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Failed to sign clinical note.";
      setFeedback({
        type: "error",
        message: typeof detail === "string" ? detail : JSON.stringify(detail),
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddAddendum = async (noteId) => {
    if (!addendumText.trim()) return;
    setActionLoading(true);
    try {
      const payload = {
        note_id: noteId,
        doctor_id: currentUser?.id || "doc-101",
        addendum_text: addendumText,
        signed_at: new Date().toISOString(),
      };

      await emrApi.addNoteAddendum(noteId, payload);

      setClinicalNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? {
                ...n,
                addendums: [
                  ...(n.addendums || []),
                  {
                    id: `add-${Date.now()}`,
                    addendum_text: addendumText,
                    signed_at: new Date().toISOString(),
                    doctor_name: currentUser?.username || "Dr. Staff",
                  },
                ],
              }
            : n,
        ),
      );

      setAddendumText("");
      setShowAddendumInput(false);
      setFeedback({
        type: "success",
        message: "Signed clinical addendum appended to permanent record.",
      });
    } catch (err) {
      setFeedback({ type: "error", message: "Failed to append addendum." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddPrescription = async (e) => {
    e.preventDefault();
    if (!selectedEncounter) return;
    setActionLoading(true);

    try {
      const payload = {
        encounter_id: selectedEncounter.id,
        medication_name: newPrescription.medication_name,
        dosage: newPrescription.dosage,
        frequency: newPrescription.frequency,
        duration: newPrescription.duration,
        instructions: newPrescription.instructions,
      };

      const res = await emrApi.createPrescription(payload);
      setPrescriptions((prev) => [
        ...prev,
        res || { ...payload, id: `rx-${Date.now()}` },
      ]);
      setFeedback({
        type: "success",
        message: `Prescription for ${newPrescription.medication_name} issued successfully.`,
      });
    } catch (err) {
      setFeedback({ type: "error", message: "Failed to issue prescription." });
    } finally {
      setActionLoading(false);
    }
  };

  const toggleLab = (lab) => {
    setSelectedLabs((prev) =>
      prev.includes(lab) ? prev.filter((l) => l !== lab) : [...prev, lab],
    );
  };

  const activeSignedNote = clinicalNotes.find(
    (n) => n.encounter_id === selectedEncounter?.id && n.is_signed,
  );

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback.message && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : "bg-rose-50 border-rose-300 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Two-Pane Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane: Encounters History Timeline (4 Cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <History className="h-4 w-4 text-sky-600" />
              Encounters Timeline
            </h3>
            <button
              onClick={handleCreateNewEncounter}
              disabled={actionLoading}
              className="text-xs text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1 hover:bg-sky-50 px-2 py-1 rounded transition"
            >
              <PlusCircle className="h-3.5 w-3.5" /> New Visit
            </button>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
            {loading ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Loading clinical history...
              </p>
            ) : encounters.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No past encounters recorded.
              </p>
            ) : (
              encounters.map((enc) => {
                const isSelected = selectedEncounter?.id === enc.id;
                return (
                  <div
                    key={enc.id}
                    onClick={() => setSelectedEncounter(enc)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? "bg-sky-50/80 border-sky-400 ring-2 ring-sky-100 shadow-sm"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">
                        {new Date(enc.encounter_date).toLocaleDateString()}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          enc.status === "FINALIZED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-sky-50 text-sky-700 border-sky-200"
                        }`}
                      >
                        {enc.status || "OPEN"}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] font-medium line-clamp-2">
                      {enc.chief_complaint || "Clinical consultation"}
                    </p>
                    <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(enc.encounter_date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: SOAP Note Editor & Prescriptions (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Note Editor Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-sky-600" />
                  Clinical SOAP Note Editor
                </h3>
                <p className="text-xs text-slate-500">
                  Encounter: {selectedEncounter?.id} &bull; Attending: Dr.{" "}
                  {currentUser?.username || "Sarah Smith"}
                </p>
              </div>

              {activeSignedNote ? (
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>IMMUTABLE & SIGNED</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSignAndFinalizeNote}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  <Lock className="h-4 w-4" />
                  <span>Sign & Seal Note</span>
                </button>
              )}
            </div>

            {/* Diagnosis Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Clinical Diagnosis (ICD-10){" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={!!activeSignedNote}
                value={soapData.diagnosis}
                onChange={(e) =>
                  setSoapData((prev) => ({
                    ...prev,
                    diagnosis: e.target.value,
                  }))
                }
                placeholder="e.g. Essential Hypertension (I10), Type 2 Diabetes"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-600"
              />
            </div>

            {/* SOAP Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  [S] Subjective (Symptoms & History)
                </label>
                <textarea
                  rows={3}
                  disabled={!!activeSignedNote}
                  value={soapData.subjective}
                  onChange={(e) =>
                    setSoapData((prev) => ({
                      ...prev,
                      subjective: e.target.value,
                    }))
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none disabled:bg-slate-100"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  [O] Objective (Vitals & Physical Exam)
                </label>
                <textarea
                  rows={3}
                  disabled={!!activeSignedNote}
                  value={soapData.objective}
                  onChange={(e) =>
                    setSoapData((prev) => ({
                      ...prev,
                      objective: e.target.value,
                    }))
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none disabled:bg-slate-100"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  [A] Assessment (Clinical Evaluation)
                </label>
                <textarea
                  rows={3}
                  disabled={!!activeSignedNote}
                  value={soapData.assessment}
                  onChange={(e) =>
                    setSoapData((prev) => ({
                      ...prev,
                      assessment: e.target.value,
                    }))
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none disabled:bg-slate-100"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  [P] Plan (Therapy & Follow-up)
                </label>
                <textarea
                  rows={3}
                  disabled={!!activeSignedNote}
                  value={soapData.plan}
                  onChange={(e) =>
                    setSoapData((prev) => ({ ...prev, plan: e.target.value }))
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none disabled:bg-slate-100"
                ></textarea>
              </div>
            </div>

            {/* Lab Order Selector Panel */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <TestTube className="h-4 w-4 text-teal-600" />
                Laboratory & Diagnostic Orders
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_LABS.map((lab) => {
                  const isChecked = selectedLabs.includes(lab);
                  return (
                    <button
                      key={lab}
                      type="button"
                      disabled={!!activeSignedNote}
                      onClick={() => toggleLab(lab)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                        isChecked
                          ? "bg-teal-50 border-teal-400 text-teal-800 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {isChecked ? "✓ " : "+ "}
                      {lab}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Signed Note Addendum Section */}
            {activeSignedNote && (
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Permanent Note Addendums
                  </h4>
                  {!showAddendumInput && (
                    <button
                      onClick={() => setShowAddendumInput(true)}
                      className="text-xs text-sky-600 font-bold hover:underline"
                    >
                      + Append Signed Addendum
                    </button>
                  )}
                </div>

                {activeSignedNote.addendums &&
                  activeSignedNote.addendums.length > 0 && (
                    <div className="space-y-2">
                      {activeSignedNote.addendums.map((addendum) => (
                        <div
                          key={addendum.id}
                          className="p-3 bg-slate-50 border-l-4 border-teal-500 rounded-r-lg text-xs"
                        >
                          <p className="text-slate-800">
                            {addendum.addendum_text}
                          </p>
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                            <span>
                              Signed:{" "}
                              {new Date(addendum.signed_at).toLocaleString()}
                            </span>
                            <span>&bull;</span>
                            <span>
                              By: {addendum.doctor_name || "Physician"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                {showAddendumInput && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <textarea
                      rows={2}
                      placeholder="Enter clinical addendum to append..."
                      value={addendumText}
                      onChange={(e) => setAddendumText(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    ></textarea>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddendumInput(false)}
                        className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddAddendum(activeSignedNote.id)}
                        className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                      >
                        <Send className="h-3 w-3" /> Append Addendum
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Prescriptions Management Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
              <Pill className="h-4 w-4 text-rose-600" />
              Prescriptions & Medication Management
            </h3>

            {/* Issued Prescriptions Table */}
            {prescriptions.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Medication</th>
                      <th className="py-2 px-3">Dosage</th>
                      <th className="py-2 px-3">Frequency</th>
                      <th className="py-2 px-3">Duration</th>
                      <th className="py-2 px-3">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {prescriptions.map((rx) => (
                      <tr key={rx.id}>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {rx.medication_name}
                        </td>
                        <td className="py-2.5 px-3">{rx.dosage}</td>
                        <td className="py-2.5 px-3">{rx.frequency}</td>
                        <td className="py-2.5 px-3">{rx.duration}</td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {rx.instructions || "--"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Issue New Prescription Subform */}
            <form
              onSubmit={handleAddPrescription}
              className="pt-2 border-t border-slate-100"
            >
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Medication Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lisinopril"
                    value={newPrescription.medication_name}
                    onChange={(e) =>
                      setNewPrescription((prev) => ({
                        ...prev,
                        medication_name: e.target.value,
                      }))
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10mg"
                    value={newPrescription.dosage}
                    onChange={(e) =>
                      setNewPrescription((prev) => ({
                        ...prev,
                        dosage: e.target.value,
                      }))
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Frequency
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Once daily"
                    value={newPrescription.frequency}
                    onChange={(e) =>
                      setNewPrescription((prev) => ({
                        ...prev,
                        frequency: e.target.value,
                      }))
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 30 days"
                    value={newPrescription.duration}
                    onChange={(e) =>
                      setNewPrescription((prev) => ({
                        ...prev,
                        duration: e.target.value,
                      }))
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Special instructions (e.g. take with breakfast)"
                  value={newPrescription.instructions}
                  onChange={(e) =>
                    setNewPrescription((prev) => ({
                      ...prev,
                      instructions: e.target.value,
                    }))
                  }
                  className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shrink-0 shadow-sm transition"
                >
                  + Add Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
