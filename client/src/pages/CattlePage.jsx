import React, { useState, useEffect } from "react";
import {
  Binary,
  Plus,
  Filter,
  QrCode,
  Eye,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import DataTable from "../components/common/DataTable.jsx";
import Badge from "../components/common/Badge.jsx";
import CattleRegistrationForm from "../components/cattle/CattleRegistrationForm.jsx";
import { getCattle, createCattle } from "../services/api.js";

export default function CattlePage() {
  const [cattle, setCattle] = useState([]);
  const [selectedCow, setSelectedCow] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(true);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [error, setError] = useState("");

  const fetchCattleList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCattle();
      if (Array.isArray(data) && data.length > 0) {
        setCattle(data);
      } else {
        // Initial demo seed if API is empty
        setCattle([
          {
            id: "cow-1042",
            tag_number: "COW-1042",
            rfid_tag: "982 000010428912",
            breed: "Holstein-Friesian",
            gender: "Female",
            date_of_birth: "2022-03-15",
            dam_id: "COW-0512",
            sire_id: "BULL-0089",
            status: "Lactating",
          },
          {
            id: "cow-1043",
            tag_number: "COW-1043",
            rfid_tag: "982 000010439144",
            breed: "Jersey",
            gender: "Female",
            date_of_birth: "2021-11-20",
            dam_id: "COW-0402",
            sire_id: "BULL-0077",
            status: "Confirmed Pregnant",
          },
          {
            id: "cow-1044",
            tag_number: "COW-1044",
            rfid_tag: "982 000010443210",
            breed: "Brown Swiss",
            gender: "Female",
            date_of_birth: "2023-01-10",
            dam_id: "COW-0610",
            sire_id: "BULL-0089",
            status: "In Heat",
          },
          {
            id: "cow-1045",
            tag_number: "COW-1045",
            rfid_tag: "982 000010458821",
            breed: "Holstein-Friesian",
            gender: "Female",
            date_of_birth: "2020-05-18",
            dam_id: "COW-0311",
            sire_id: "BULL-0054",
            status: "Dry",
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to load cattle:", err);
      setError("Failed to fetch cattle directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCattleList();
  }, []);

  const handleRegisterCattle = async (formData) => {
    try {
      const newCow = await createCattle(formData);
      setCattle((prev) => [
        newCow || { ...formData, id: `cow-${Date.now()}` },
        ...prev,
      ]);
    } catch (err) {
      // Re-throw so form displays the specific error
      throw err;
    }
  };

  const filteredCattle = cattle.filter((c) => {
    if (statusFilter === "ALL") return true;
    return c.status?.toLowerCase() === statusFilter.toLowerCase();
  });

  const columns = [
    {
      header: "Tag #",
      accessor: "tag_number",
      className: "font-semibold text-[#171F24]",
    },
    {
      header: "RFID Ear Tag",
      accessor: "rfid_tag",
      render: (row) => (
        <span className="font-mono text-xs bg-gray-100 text-[#171F24] px-2 py-0.5 rounded border border-[#DBE5E0]">
          {row.rfid_tag || "Unassigned"}
        </span>
      ),
    },
    {
      header: "Breed",
      accessor: "breed",
    },
    {
      header: "Gender / Age",
      accessor: "gender",
      render: (row) => (
        <div>
          <span>{row.gender}</span>
          <span className="text-xs text-[#6B7A73] block">
            DOB: {row.date_of_birth}
          </span>
        </div>
      ),
    },
    {
      header: "Pedigree Lineage",
      accessor: "dam_id",
      render: (row) => (
        <div className="text-xs">
          <span className="text-[#6B7A73]">Dam: </span>
          <span className="font-medium">{row.dam_id || "--"}</span>
          <br />
          <span className="text-[#6B7A73]">Sire: </span>
          <span className="font-medium">{row.sire_id || "--"}</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => <Badge variant={row.status}>{row.status}</Badge>,
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <button
          onClick={() => setSelectedCow(row)}
          className="p-1.5 text-[#0D7A52] hover:bg-[#E7F5EE] rounded transition"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#171F24] tracking-tight">
            Cattle Directory & RFID Tag Registry
          </h1>
          <p className="text-sm text-[#6B7A73]">
            Manage cow registration, electronic RFID ear tags, pedigree lineage,
            and reproductive states
          </p>
        </div>
        <button
          onClick={() => setShowRegisterForm(!showRegisterForm)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-[#0D7A52] hover:bg-[#095C3E] text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showRegisterForm ? "Hide Form" : "Register Cow"}</span>
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

      {/* Split layout: Form + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {showRegisterForm && (
          <div className="lg:col-span-5">
            <CattleRegistrationForm
              existingCattle={cattle}
              onSubmit={handleRegisterCattle}
            />
          </div>
        )}

        <div className={showRegisterForm ? "lg:col-span-7" : "lg:col-span-12"}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-[#6B7A73]">
                  Filter Status:
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-[#DBE5E0] rounded-md text-xs text-[#171F24] focus:outline-none focus:ring-1 focus:ring-[#0D7A52]"
                >
                  <option value="ALL">All Statuses ({cattle.length})</option>
                  <option value="Lactating">Lactating</option>
                  <option value="In Heat">In Heat</option>
                  <option value="Inseminated">Inseminated</option>
                  <option value="Confirmed Pregnant">Confirmed Pregnant</option>
                  <option value="Dry">Dry</option>
                </select>
              </div>
              <span className="text-xs text-[#6B7A73]">
                {filteredCattle.length} cattle listed
              </span>
            </div>

            <DataTable
              columns={columns}
              data={filteredCattle}
              searchPlaceholder="Search tag #, RFID, or breed..."
              emptyMessage="No cattle match the current criteria."
            />
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedCow && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#DBE5E0] max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#DBE5E0]">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-[#E7F5EE] text-[#0D7A52] rounded-lg">
                  <Binary className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#171F24]">
                    {selectedCow.tag_number}
                  </h3>
                  <p className="text-xs text-[#6B7A73]">
                    RFID: {selectedCow.rfid_tag || "None"}
                  </p>
                </div>
              </div>
              <Badge variant={selectedCow.status}>{selectedCow.status}</Badge>
            </div>

            <div className="py-4 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#6B7A73] block">Breed</span>
                <strong className="text-sm text-[#171F24]">
                  {selectedCow.breed}
                </strong>
              </div>
              <div>
                <span className="text-[#6B7A73] block">Gender</span>
                <strong className="text-sm text-[#171F24]">
                  {selectedCow.gender}
                </strong>
              </div>
              <div>
                <span className="text-[#6B7A73] block">Date of Birth</span>
                <strong className="text-sm text-[#171F24]">
                  {selectedCow.date_of_birth}
                </strong>
              </div>
              <div>
                <span className="text-[#6B7A73] block">Status</span>
                <strong className="text-sm text-[#0D7A52]">
                  {selectedCow.status}
                </strong>
              </div>
              <div>
                <span className="text-[#6B7A73] block">Dam (Mother Tag)</span>
                <strong className="text-sm text-[#171F24]">
                  {selectedCow.dam_id || "Unknown"}
                </strong>
              </div>
              <div>
                <span className="text-[#6B7A73] block">Sire (Father Tag)</span>
                <strong className="text-sm text-[#171F24]">
                  {selectedCow.sire_id || "Unknown"}
                </strong>
              </div>
            </div>

            <div className="pt-4 border-t border-[#DBE5E0] flex justify-end">
              <button
                onClick={() => setSelectedCow(null)}
                className="px-4 py-2 bg-[#F5FAF7] hover:bg-gray-100 text-[#171F24] border border-[#DBE5E0] rounded-lg text-xs font-semibold transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
