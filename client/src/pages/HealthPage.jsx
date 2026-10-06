import React, { useState, useEffect } from "react";
import {
  Stethoscope,
  ShieldAlert,
  AlertTriangle,
  Plus,
  CheckCircle2,
} from "lucide-react";
import DataTable from "../components/common/DataTable.jsx";
import Badge from "../components/common/Badge.jsx";
import VeterinaryEncounterForm from "../components/health/VeterinaryEncounterForm.jsx";
import {
  getHealthRecords,
  createHealthRecord,
  getActiveWithdrawals,
  getCattle,
} from "../services/api.js";

export default function HealthPage() {
  const [healthRecords, setHealthRecords] = useState([]);
  const [activeWithdrawals, setActiveWithdrawals] = useState([]);
  const [cattle, setCattle] = useState([]);
  const [showForm, setShowForm] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [recordsRes, withRes, cattleRes] = await Promise.allSettled([
        getHealthRecords(),
        getActiveWithdrawals(),
        getCattle(),
      ]);

      if (
        recordsRes.status === "fulfilled" &&
        Array.isArray(recordsRes.value) &&
        recordsRes.value.length > 0
      ) {
        setHealthRecords(recordsRes.value);
      } else {
        // Initial sample records
        setHealthRecords([
          {
            id: "hr-1",
            cow_id: "COW-1042",
            record_type: "Treatment",
            diagnosis: "Mastitis - Left Quarter",
            medication_administered: "Antibiotic X (Spectramast LC)",
            dosage: "10ml intramammary",
            treatment_date: "2026-05-18T08:00:00.000Z",
            milk_withdrawal_hours: 96,
            milk_withdrawal_end: "2026-05-22T08:00:00.000Z",
            meat_withdrawal_days: 14,
            veterinarian_name: "Dr. Sarah Mitchell, DVM",
          },
          {
            id: "hr-2",
            cow_id: "COW-1043",
            record_type: "Vaccination",
            diagnosis: "Annual Bovine Viral Diarrhea (BVD) Booster",
            medication_administered: "Bovi-Shield Gold 5",
            dosage: "2ml SubQ",
            treatment_date: "2026-04-10T10:30:00.000Z",
            milk_withdrawal_hours: 0,
            milk_withdrawal_end: null,
            meat_withdrawal_days: 21,
            veterinarian_name: "Dr. Mark Davis, DVM",
          },
        ]);
      }

      if (
        withRes.status === "fulfilled" &&
        Array.isArray(withRes.value) &&
        withRes.value.length > 0
      ) {
        setActiveWithdrawals(withRes.value);
      } else {
        setActiveWithdrawals([
          {
            id: "wh-1",
            cow_id: "COW-1042",
            diagnosis: "Mastitis - Left Quarter (Antibiotic X)",
            milk_withdrawal_end: "2026-05-22T08:00:00.000Z",
            veterinarian_name: "Dr. Sarah Mitchell, DVM",
          },
        ]);
      }

      if (cattleRes.status === "fulfilled" && Array.isArray(cattleRes.value)) {
        setCattle(cattleRes.value);
      } else {
        setCattle([
          {
            id: "COW-1042",
            tag_number: "COW-1042",
            breed: "Holstein-Friesian",
          },
          { id: "COW-1043", tag_number: "COW-1043", breed: "Jersey" },
          { id: "COW-1044", tag_number: "COW-1044", breed: "Brown Swiss" },
        ]);
      }
    } catch (err) {
      console.error("Failed to load health records:", err);
      setError("Failed to fetch veterinary and health records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleHealthSubmit = async (payload) => {
    try {
      const saved = await createHealthRecord(payload);
      setHealthRecords((prev) => [
        saved || { ...payload, id: `hr-${Date.now()}` },
        ...prev,
      ]);
      if (payload.milk_withdrawal_hours > 0) {
        setActiveWithdrawals((prev) => [
          {
            id: `wh-${Date.now()}`,
            cow_id: payload.cow_id,
            diagnosis: payload.diagnosis,
            milk_withdrawal_end: payload.milk_withdrawal_end,
            veterinarian_name: payload.veterinarian_name,
          },
          ...prev,
        ]);
      }
    } catch (err) {
      throw err;
    }
  };

  const columns = [
    {
      header: "Cow Tag",
      accessor: "cow_id",
      className: "font-semibold text-[#171F24]",
    },
    {
      header: "Type",
      accessor: "record_type",
      render: (row) => <Badge variant="info">{row.record_type}</Badge>,
    },
    {
      header: "Diagnosis & Medication",
      accessor: "diagnosis",
      render: (row) => (
        <div>
          <span className="font-medium text-[#171F24]">{row.diagnosis}</span>
          {row.medication_administered && (
            <span className="text-xs text-[#6B7A73] block">
              Rx: {row.medication_administered} ({row.dosage || "N/A"})
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Treatment Date",
      accessor: "treatment_date",
      render: (row) => (
        <span className="text-xs text-[#171F24]">
          {new Date(row.treatment_date).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Milk Withholding (Hours)",
      accessor: "milk_withdrawal_hours",
      render: (row) =>
        row.milk_withdrawal_hours > 0 ? (
          <div>
            <Badge variant="danger">
              {row.milk_withdrawal_hours} hrs Withholding
            </Badge>
            <span className="text-[11px] text-[#D92929] block font-medium mt-0.5">
              Through: {new Date(row.milk_withdrawal_end).toLocaleDateString()}
            </span>
          </div>
        ) : (
          <Badge variant="success">0 hrs (Safe)</Badge>
        ),
    },
    {
      header: "Veterinarian",
      accessor: "veterinarian_name",
      render: (row) => (
        <span className="text-xs text-[#6B7A73]">
          {row.veterinarian_name || "--"}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#171F24] tracking-tight">
            Health, Vaccination & Veterinary Withholding Tracker
          </h1>
          <p className="text-sm text-[#6B7A73]">
            Log treatments, vaccinations, and enforce antibiotic milk/meat
            withholding compliance
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-[#0D7A52] hover:bg-[#095C3E] text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showForm ? "Hide Form" : "Log Medical Encounter"}</span>
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 bg-[#FDF0ED] border border-[#D92929]/30 rounded-xl flex items-center space-x-3 text-sm text-[#D92929]"
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Active Milk Withholding Compliance Banner */}
      {activeWithdrawals.length > 0 && (
        <div className="bg-[#FDF0ED] border border-[#E76F51] rounded-xl p-5 shadow-sm">
          <div className="flex items-start space-x-3">
            <ShieldAlert className="w-6 h-6 text-[#E76F51] flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#D92929]">
                  CRITICAL: Active Antibiotic Milk Withholding Enforcement
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 bg-[#D92929] text-white rounded">
                  {activeWithdrawals.length} Cattle Locked
                </span>
              </div>
              <p className="text-xs text-[#6B7A73] mt-1">
                The following cows are currently undergoing antibiotic therapy
                with mandatory milk withdrawal. Under federal and dairy
                standards, all milk from these animals is barred from bulk tank
                sales.
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {activeWithdrawals.map((wh, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white border border-[#E76F51]/40 rounded-lg text-xs"
                  >
                    <div className="flex justify-between font-bold text-[#171F24]">
                      <span>{wh.cow_id || wh.cow_tag}</span>
                      <span className="text-[#D92929]">Active Lock</span>
                    </div>
                    <div className="text-[#6B7A73] mt-1 truncate">
                      {wh.diagnosis}
                    </div>
                    <div className="text-[11px] text-[#0D7A52] font-semibold mt-1">
                      Release:{" "}
                      {wh.milk_withdrawal_end
                        ? new Date(wh.milk_withdrawal_end).toLocaleDateString()
                        : "Pending"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Split Layout: Form + Records Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {showForm && (
          <div className="lg:col-span-5">
            <VeterinaryEncounterForm
              cattleList={cattle}
              onSubmit={handleHealthSubmit}
            />
          </div>
        )}

        <div className={showForm ? "lg:col-span-7" : "lg:col-span-12"}>
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[#171F24]">
              Veterinary & Treatment Encounter Log
            </h3>
            <DataTable
              columns={columns}
              data={healthRecords}
              searchPlaceholder="Search cow, diagnosis, or medicine..."
              emptyMessage="No health encounters logged."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
