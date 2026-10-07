import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { CowsDataTable } from "../components/cows/CowsDataTable";
import { CowDetailDrawer } from "../components/cows/CowDetailDrawer";
import { AddEditCowModal } from "../components/cows/AddEditCowModal";
import { getCows, createCow, updateCow, deleteCow } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export const CattleInventoryPage = () => {
  const { isManager } = useAuth();
  const navigate = useNavigate();

  const [cows, setCows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Drawer & Modal states
  const [selectedCow, setSelectedCow] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cowToEdit, setCowToEdit] = useState(null);

  const fetchCattle = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await getCows();
      if (Array.isArray(data) && data.length > 0) {
        setCows(data);
      } else {
        // Fallback sample data if backend DB is empty on first run
        setCows([
          {
            id: "1",
            tag_id: "COW-1001",
            breed: "Holstein",
            date_of_birth: "2022-03-15",
            gender: "Female",
            health_status: "Healthy",
            weight_kg: 640,
            location: "Barn A - Stall 01",
          },
          {
            id: "2",
            tag_id: "COW-1042",
            breed: "Holstein",
            date_of_birth: "2021-08-10",
            gender: "Female",
            health_status: "Under Treatment",
            weight_kg: 620,
            location: "Barn A - Stall 12",
          },
          {
            id: "3",
            tag_id: "COW-1088",
            breed: "Jersey",
            date_of_birth: "2023-01-20",
            gender: "Female",
            health_status: "Healthy",
            weight_kg: 480,
            location: "Barn B - Stall 04",
          },
          {
            id: "4",
            tag_id: "COW-1102",
            breed: "Angus",
            date_of_birth: "2020-11-05",
            gender: "Male",
            health_status: "Healthy",
            weight_kg: 850,
            location: "Paddock 2",
          },
          {
            id: "5",
            tag_id: "COW-1115",
            breed: "Guernsey",
            date_of_birth: "2022-06-18",
            gender: "Female",
            health_status: "Quarantined",
            weight_kg: 530,
            location: "Quarantine Bay",
          },
        ]);
      }
    } catch (err) {
      setErrorMsg(
        err.message || "Failed to fetch cattle profiles from server.",
      );
      // Keep sample list for seamless UI inspection
      setCows([
        {
          id: "1",
          tag_id: "COW-1001",
          breed: "Holstein",
          date_of_birth: "2022-03-15",
          gender: "Female",
          health_status: "Healthy",
          weight_kg: 640,
          location: "Barn A - Stall 01",
        },
        {
          id: "2",
          tag_id: "COW-1042",
          breed: "Holstein",
          date_of_birth: "2021-08-10",
          gender: "Female",
          health_status: "Under Treatment",
          weight_kg: 620,
          location: "Barn A - Stall 12",
        },
        {
          id: "3",
          tag_id: "COW-1088",
          breed: "Jersey",
          date_of_birth: "2023-01-20",
          gender: "Female",
          health_status: "Healthy",
          weight_kg: 480,
          location: "Barn B - Stall 04",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCattle();
  }, []);

  const handleSaveCow = async (formData, cowId) => {
    try {
      if (cowId) {
        await updateCow(cowId, formData);
        setSuccessMsg(
          `Cattle profile ${formData.tag_id} updated successfully.`,
        );
      } else {
        await createCow(formData);
        setSuccessMsg(`New cattle ${formData.tag_id} registered successfully.`);
      }
      await fetchCattle();
    } catch (err) {
      // Propagate error to modal for inline error display
      throw new Error(
        err.response?.data?.detail || err.message || "Operation failed",
      );
    }
  };

  const handleDeleteCow = async (cow) => {
    if (!isManager) {
      setErrorMsg(
        "Farm Worker role is restricted from deleting cattle profiles (HTTP 403).",
      );
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to permanently delete profile for ${cow.tag_id}?`,
      )
    ) {
      try {
        await deleteCow(cow.id || cow.tag_id);
        setSuccessMsg(`Cattle profile ${cow.tag_id} removed.`);
        await fetchCattle();
      } catch (err) {
        setErrorMsg(
          err.response?.data?.detail ||
            err.message ||
            "Failed to delete cow profile.",
        );
      }
    }
  };

  const openRegisterModal = () => {
    setCowToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cow) => {
    setCowToEdit(cow);
    setIsModalOpen(true);
  };

  const openDetailDrawer = (cow) => {
    setSelectedCow(cow);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Cattle Inventory Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full lifecycle records: Tag IDs, breeds, health status, biometrics
            and barn assignments
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={fetchCattle}
            className="p-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            title="Refresh List"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {isManager && (
            <button
              type="button"
              onClick={openRegisterModal}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-emerald-700 transition"
            >
              <PlusCircle className="h-4 w-4" />
              <span>+ Register New Cow</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg("")}
            className="text-rose-500 hover:text-rose-700 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg("")}
            className="text-emerald-500 hover:text-emerald-700 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Cattle Inventory Table */}
      <CowsDataTable
        cows={cows}
        loading={loading}
        onViewCow={openDetailDrawer}
        onEditCow={openEditModal}
        onDeleteCow={handleDeleteCow}
      />

      {/* Slide-over Cow Details Drawer */}
      <CowDetailDrawer
        cow={selectedCow}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onLogMilk={(cow) =>
          navigate("/milk-production", {
            state: { cowId: cow.id || cow.tag_id },
          })
        }
        onLogHealth={(cow) =>
          navigate("/health-records", {
            state: { cowId: cow.id || cow.tag_id },
          })
        }
      />

      {/* Add / Edit Cattle Modal */}
      <AddEditCowModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCow}
        cow={cowToEdit}
      />
    </div>
  );
};

export default CattleInventoryPage;
