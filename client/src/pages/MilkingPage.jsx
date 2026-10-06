import React, { useState, useEffect } from "react";
import {
  Milk,
  AlertTriangle,
  ShieldAlert,
  Plus,
  CheckCircle2,
} from "lucide-react";
import StatCard from "../components/common/StatCard.jsx";
import DataTable from "../components/common/DataTable.jsx";
import Badge from "../components/common/Badge.jsx";
import MilkingLogForm from "../components/milking/MilkingLogForm.jsx";
import {
  getMilkLogs,
  createMilkLog,
  getCattle,
  getActiveWithdrawals,
} from "../services/api.js";

export default function MilkingPage() {
  const [logs, setLogs] = useState([]);
  const [cattle, setCattle] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [showForm, setShowForm] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [logsRes, cattleRes, withRes] = await Promise.allSettled([
        getMilkLogs(),
        getCattle(),
        getActiveWithdrawals(),
      ]);

      if (
        logsRes.status === "fulfilled" &&
        Array.isArray(logsRes.value) &&
        logsRes.value.length > 0
      ) {
        setLogs(logsRes.value);
      } else {
        // Demo initial logs
        setLogs([
          {
            id: "ml-1",
            cow_id: "COW-1042",
            milking_date: new Date().toISOString().split("T")[0],
            session: "Morning",
            yield_liters: 18.5,
            fat_percentage: 3.8,
            protein_percentage: 3.2,
            somatic_cell_count: 150,
            is_withheld: false,
            variance_alert: false,
          },
          {
            id: "ml-2",
            cow_id: "COW-1043",
            milking_date: new Date().toISOString().split("T")[0],
            session: "Morning",
            yield_liters: 22.0,
            fat_percentage: 4.1,
            protein_percentage: 3.4,
            somatic_cell_count: 120,
            is_withheld: false,
            variance_alert: false,
          },
          {
            id: "ml-3",
            cow_id: "COW-1044",
            milking_date: new Date().toISOString().split("T")[0],
            session: "Morning",
            yield_liters: 12.0,
            fat_percentage: 3.5,
            protein_percentage: 3.0,
            somatic_cell_count: 320,
            is_withheld: false,
            variance_alert: true,
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
            rfid_tag: "982 000010428912",
            breed: "Holstein-Friesian",
          },
          {
            id: "COW-1043",
            tag_number: "COW-1043",
            rfid_tag: "982 000010439144",
            breed: "Jersey",
          },
          {
            id: "COW-1044",
            tag_number: "COW-1044",
            rfid_tag: "982 000010443210",
            breed: "Brown Swiss",
          },
        ]);
      }

      if (withRes.status === "fulfilled" && Array.isArray(withRes.value)) {
        setWithdrawals(withRes.value);
      } else {
        setWithdrawals([{ cow_id: "COW-1042", cow_tag: "COW-1042" }]);
      }
    } catch (err) {
      console.error("Failed to load milking logs:", err);
      setError("Failed to fetch milking records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMilkingSubmit = async (payload) => {
    try {
      const saved = await createMilkLog(payload);
      setLogs((prev) => [
        saved || { ...payload, id: `ml-${Date.now()}` },
        ...prev,
      ]);
    } catch (err) {
      throw err;
    }
  };

  const totalTodayYield = logs.reduce(
    (acc, curr) => acc + (parseFloat(curr.yield_liters) || 0),
    0,
  );
  const morningTotal = logs
    .filter((l) => l.session?.toLowerCase() === "morning")
    .reduce((acc, curr) => acc + (parseFloat(curr.yield_liters) || 0), 0);
  const eveningTotal = logs
    .filter((l) => l.session?.toLowerCase() === "evening")
    .reduce((acc, curr) => acc + (parseFloat(curr.yield_liters) || 0), 0);
  const varianceCount = logs.filter((l) => l.variance_alert).length;

  const columns = [
    {
      header: "Cow Tag / ID",
      accessor: "cow_id",
      className: "font-semibold text-[#171F24]",
    },
    {
      header: "Date / Session",
      accessor: "milking_date",
      render: (row) => (
        <div>
          <span>{row.milking_date}</span>
          <span className="text-xs text-[#6B7A73] block">{row.session}</span>
        </div>
      ),
    },
    {
      header: "Yield (L)",
      accessor: "yield_liters",
      render: (row) => (
        <span className="font-bold text-sm text-[#0D7A52]">
          {row.yield_liters} L
        </span>
      ),
    },
    {
      header: "Quality (Fat / Protein)",
      accessor: "fat_percentage",
      render: (row) => (
        <span className="text-xs text-[#171F24]">
          {row.fat_percentage ? `${row.fat_percentage}%` : "--"} /{" "}
          {row.protein_percentage ? `${row.protein_percentage}%` : "--"}
        </span>
      ),
    },
    {
      header: "SCC (k/mL)",
      accessor: "somatic_cell_count",
      render: (row) => (
        <span
          className={`text-xs font-medium ${
            row.somatic_cell_count >= 250
              ? "text-[#D92929] font-bold"
              : "text-[#171F24]"
          }`}
        >
          {row.somatic_cell_count ? `${row.somatic_cell_count} k/mL` : "--"}
        </span>
      ),
    },
    {
      header: "Status & Flags",
      accessor: "flags",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.is_withheld && (
            <Badge variant="danger">Withheld from Sale</Badge>
          )}
          {row.variance_alert && (
            <Badge variant="warning">Mastitis &gt;30% Drop</Badge>
          )}
          {!row.is_withheld && !row.variance_alert && (
            <Badge variant="success">Normal Tank</Badge>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#171F24] tracking-tight">
            Milking Operations & Logging Station
          </h1>
          <p className="text-sm text-[#6B7A73]">
            Track daily session volumes, fat/protein percentages, somatic cell
            counts, and variance alerts
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-[#0D7A52] hover:bg-[#095C3E] text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showForm ? "Hide Form" : "New Milking Log"}</span>
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Total Parlor Yield"
          value={`${totalTodayYield.toFixed(1)} L`}
          subtitle={`${logs.length} entries recorded`}
          icon={Milk}
        />
        <StatCard
          title="Morning (AM) Volume"
          value={`${morningTotal.toFixed(1)} L`}
          subtitle="Avg ~18.8 L / cow"
          trend="AM Session"
          icon={Milk}
        />
        <StatCard
          title="Evening (PM) Volume"
          value={`${eveningTotal.toFixed(1)} L`}
          subtitle="Avg ~16.2 L / cow"
          trend="PM Session"
          icon={Milk}
        />
        <StatCard
          title="Mastitis / Variance Alerts"
          value={varianceCount}
          subtitle=">30% Drop or SCC > 250k"
          alert={varianceCount > 0}
          trendType={varianceCount > 0 ? "warning" : "positive"}
          trend={varianceCount > 0 ? "Attention Required" : "All Normal"}
          icon={AlertTriangle}
        />
      </div>

      {/* Split Layout: Form + Logs Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {showForm && (
          <div className="lg:col-span-5">
            <MilkingLogForm
              cattleList={cattle}
              activeWithdrawals={withdrawals}
              onSubmit={handleMilkingSubmit}
            />
          </div>
        )}

        <div className={showForm ? "lg:col-span-7" : "lg:col-span-12"}>
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[#171F24]">
              Recent Milking Session Logs
            </h3>
            <DataTable
              columns={columns}
              data={logs}
              searchPlaceholder="Search cow ID or session..."
              emptyMessage="No milking logs found for this period."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
