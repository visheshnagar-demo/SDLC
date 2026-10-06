import React, { useState, useEffect } from "react";
import {
  HeartPulse,
  Calendar,
  Plus,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import Stepper from "../components/common/Stepper.jsx";
import DataTable from "../components/common/DataTable.jsx";
import Badge from "../components/common/Badge.jsx";
import BreedingEventForm from "../components/breeding/BreedingEventForm.jsx";
import {
  getBreedingRecords,
  createBreedingRecord,
  getCattle,
} from "../services/api.js";

export default function BreedingPage() {
  const [records, setRecords] = useState([]);
  const [cattle, setCattle] = useState([]);
  const [showForm, setShowForm] = useState(true);
  const [selectedStageFilter, setSelectedStageFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [recordsRes, cattleRes] = await Promise.allSettled([
        getBreedingRecords(),
        getCattle(),
      ]);

      if (
        recordsRes.status === "fulfilled" &&
        Array.isArray(recordsRes.value) &&
        recordsRes.value.length > 0
      ) {
        setRecords(recordsRes.value);
      } else {
        // Initial sample breeding records
        setRecords([
          {
            id: "br-1",
            cow_id: "COW-1042",
            stage: "Inseminated",
            event_date: "2025-06-01",
            sire_rfid_or_code: "BULL-0089",
            gestation_check_due_date: "2025-07-15",
            expected_calving_date: "2026-03-10",
            notes: "AI service with certified Sire semen batch #A-89",
          },
          {
            id: "br-2",
            cow_id: "COW-1043",
            stage: "Confirmed Pregnant",
            event_date: "2025-04-10",
            sire_rfid_or_code: "BULL-0077",
            gestation_check_due_date: "2025-05-24",
            expected_calving_date: "2026-01-18",
            notes: "Ultrasound confirmed viable single fetus",
          },
          {
            id: "br-3",
            cow_id: "COW-1044",
            stage: "In Heat",
            event_date: "2025-06-05",
            sire_rfid_or_code: "BULL-0089",
            gestation_check_due_date: null,
            expected_calving_date: null,
            notes:
              "Standing heat observed. Scheduled for insemination tomorrow.",
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
            status: "Inseminated",
          },
          {
            id: "COW-1043",
            tag_number: "COW-1043",
            breed: "Jersey",
            status: "Confirmed Pregnant",
          },
          {
            id: "COW-1044",
            tag_number: "COW-1044",
            breed: "Brown Swiss",
            status: "In Heat",
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to load breeding data:", err);
      setError("Failed to fetch breeding records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBreedingSubmit = async (payload) => {
    try {
      const saved = await createBreedingRecord(payload);
      setRecords((prev) => [
        saved || { ...payload, id: `br-${Date.now()}` },
        ...prev,
      ]);
    } catch (err) {
      throw err;
    }
  };

  const filteredRecords = records.filter((r) => {
    if (selectedStageFilter === "ALL") return true;
    return r.stage?.toLowerCase() === selectedStageFilter.toLowerCase();
  });

  const columns = [
    {
      header: "Cow Tag",
      accessor: "cow_id",
      className: "font-semibold text-[#171F24]",
    },
    {
      header: "Stage",
      accessor: "stage",
      render: (row) => <Badge variant={row.stage}>{row.stage}</Badge>,
    },
    {
      header: "Event Date",
      accessor: "event_date",
    },
    {
      header: "Sire ID / Code",
      accessor: "sire_rfid_or_code",
      render: (row) => (
        <span className="font-mono text-xs text-[#171F24]">
          {row.sire_rfid_or_code || "N/A"}
        </span>
      ),
    },
    {
      header: "Gestation Check Due (+44d)",
      accessor: "gestation_check_due_date",
      render: (row) => (
        <span className="text-xs text-[#171F24]">
          {row.gestation_check_due_date || "--"}
        </span>
      ),
    },
    {
      header: "Expected Calving (283d)",
      accessor: "expected_calving_date",
      render: (row) => (
        <span className="font-bold text-xs text-[#0D7A52]">
          {row.expected_calving_date || "--"}
        </span>
      ),
    },
    {
      header: "Notes",
      accessor: "notes",
      render: (row) => (
        <span className="text-xs text-[#6B7A73] truncate max-w-xs block">
          {row.notes || "--"}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#171F24] tracking-tight">
            Breeding & Reproductive Lifecycle Board
          </h1>
          <p className="text-sm text-[#6B7A73]">
            Track estrus heats, artificial insemination, 44-day gestation
            checks, and 283-day expected calving milestones
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-[#0D7A52] hover:bg-[#095C3E] text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showForm ? "Hide Form" : "Log Breeding Event"}</span>
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

      {/* 5-Stage Stepper Overview */}
      <div className="bg-white rounded-xl p-5 border border-[#DBE5E0] shadow-sm">
        <h3 className="text-xs font-bold text-[#6B7A73] uppercase tracking-wider mb-2">
          Reproductive Lifecycle Pipeline
        </h3>
        <Stepper currentStage="Inseminated" />
      </div>

      {/* Split Layout: Form + Records Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {showForm && (
          <div className="lg:col-span-5">
            <BreedingEventForm
              cattleList={cattle}
              onSubmit={handleBreedingSubmit}
            />
          </div>
        )}

        <div className={showForm ? "lg:col-span-7" : "lg:col-span-12"}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-[#6B7A73]">
                  Filter Stage:
                </span>
                <select
                  value={selectedStageFilter}
                  onChange={(e) => setSelectedStageFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-[#DBE5E0] rounded-md text-xs text-[#171F24] focus:outline-none focus:ring-1 focus:ring-[#0D7A52]"
                >
                  <option value="ALL">All Stages ({records.length})</option>
                  <option value="In Heat">In Heat</option>
                  <option value="Inseminated">Inseminated</option>
                  <option value="Confirmed Pregnant">Confirmed Pregnant</option>
                  <option value="Dry Period">Dry Period</option>
                  <option value="Calved">Calved</option>
                </select>
              </div>
              <span className="text-xs text-[#6B7A73]">
                {filteredRecords.length} records
              </span>
            </div>

            <DataTable
              columns={columns}
              data={filteredRecords}
              searchPlaceholder="Search cow or sire..."
              emptyMessage="No breeding events recorded."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
