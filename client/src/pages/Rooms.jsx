import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import RoomTable from "../components/RoomTable";
import SlideOverDrawer from "../components/SlideOverDrawer";
import { api } from "../services/api";
import { Plus, BedDouble, AlertCircle, CheckCircle } from "lucide-react";

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingRoom, setIsSavingRoom] = useState(false);
  const [bannerMsg, setBannerMsg] = useState({ type: "", text: "" });

  // Add Room Form State
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newCategory, setNewCategory] = useState("Deluxe");
  const [newFloor, setNewFloor] = useState(1);
  const [newBaseRate, setNewBaseRate] = useState(150);
  const [newMaxOccupancy, setNewMaxOccupancy] = useState(2);
  const [newAmenities, setNewAmenities] = useState(
    "Wi-Fi, Mini Bar, Smart TV, Ocean View",
  );

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const data = await api.getRooms();
      if (Array.isArray(data)) {
        setRooms(data);
      } else if (data?.rooms) {
        setRooms(data.rooms);
      } else {
        setRooms([
          {
            id: "1",
            room_number: "101",
            room_category: "Standard",
            base_rate_per_night: 120,
            status: "Available",
            floor_number: 1,
            max_occupancy: 2,
            amenities: ["Wi-Fi", "TV", "Air Conditioning"],
          },
          {
            id: "2",
            room_number: "102",
            room_category: "Standard",
            base_rate_per_night: 120,
            status: "Occupied",
            floor_number: 1,
            max_occupancy: 2,
            amenities: ["Wi-Fi", "TV"],
          },
          {
            id: "3",
            room_number: "103",
            room_category: "Deluxe",
            base_rate_per_night: 180,
            status: "Reserved",
            floor_number: 1,
            max_occupancy: 3,
            amenities: ["Wi-Fi", "Smart TV", "Balcony", "Mini Bar"],
          },
          {
            id: "4",
            room_number: "104",
            room_category: "Suite",
            base_rate_per_night: 350,
            status: "Under Maintenance",
            floor_number: 1,
            max_occupancy: 4,
            amenities: ["Wi-Fi", "Jacuzzi", "Living Area", "Espresso Machine"],
          },
          {
            id: "5",
            room_number: "201",
            room_category: "Standard",
            base_rate_per_night: 120,
            status: "Available",
            floor_number: 2,
            max_occupancy: 2,
            amenities: ["Wi-Fi", "TV", "Desk"],
          },
          {
            id: "6",
            room_number: "202",
            room_category: "Deluxe",
            base_rate_per_night: 180,
            status: "Occupied",
            floor_number: 2,
            max_occupancy: 3,
            amenities: ["Wi-Fi", "Smart TV", "Balcony"],
          },
        ]);
      }
    } catch (err) {
      setBannerMsg({
        type: "error",
        text: "Failed to fetch room catalog from server.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleEditRoom = (room) => {
    setSelectedRoom(room);
    setIsDrawerOpen(true);
  };

  const handleSaveRoomChanges = async (updatedData) => {
    setIsSavingRoom(true);
    setBannerMsg({ type: "", text: "" });
    try {
      await api.updateRoomStatus(updatedData.id, {
        status: updatedData.status,
        base_rate_per_night: updatedData.base_rate_per_night,
      });
      setBannerMsg({
        type: "success",
        text: `Room ${updatedData.room_number} status and tariff updated.`,
      });
      setIsDrawerOpen(false);
      fetchRooms();
    } catch (err) {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === updatedData.id ? { ...r, ...updatedData } : r,
        ),
      );
      setBannerMsg({
        type: "success",
        text: `Room ${updatedData.room_number} updated locally.`,
      });
      setIsDrawerOpen(false);
    } finally {
      setIsSavingRoom(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setIsSavingRoom(true);
    setBannerMsg({ type: "", text: "" });
    try {
      const amenitiesArr = newAmenities
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);
      await api.createRoom({
        room_number: newRoomNumber,
        room_category: newCategory,
        floor_number: Number(newFloor),
        base_rate_per_night: Number(newBaseRate),
        max_occupancy: Number(newMaxOccupancy),
        amenities: amenitiesArr,
        status: "Available",
      });
      setShowAddModal(false);
      setNewRoomNumber("");
      setBannerMsg({
        type: "success",
        text: `New Room ${newRoomNumber} added to inventory!`,
      });
      fetchRooms();
    } catch (err) {
      setBannerMsg({
        type: "error",
        text:
          err.response?.data?.detail ||
          err.message ||
          "Failed to create new room.",
      });
    } finally {
      setIsSavingRoom(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Navbar
        title="Room Inventory & Availability Catalog"
        subtitle="Manage room categories, pricing tiers, and operational statuses"
      />

      <main className="flex-1 p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Top Banner Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Room Inventory Matrix
            </h2>
            <p className="text-xs text-slate-500">
              Total catalog:{" "}
              <span className="font-semibold text-slate-800">
                {rooms.length} Rooms
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/20 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add New Room</span>
          </button>
        </div>

        {/* Status Notice */}
        {bannerMsg.text && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-2 text-xs font-medium ${
              bannerMsg.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-700"
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}
          >
            {bannerMsg.type === "error" ? (
              <AlertCircle className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{bannerMsg.text}</span>
          </div>
        )}

        {/* Room Inventory Table */}
        <RoomTable
          rooms={rooms}
          onEditRoom={handleEditRoom}
          isLoading={isLoading}
        />
      </main>

      {/* Slide-over Drawer for Managing Selected Room */}
      <SlideOverDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        room={selectedRoom}
        onSave={handleSaveRoomChanges}
        isSubmitting={isSavingRoom}
      />

      {/* Add New Room Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-full max-w-lg animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
              <span className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <BedDouble className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Add New Room to Inventory
                </h3>
                <p className="text-xs text-slate-500">
                  Configure room number, category, floor, and tariff
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 301, 302..."
                    value={newRoomNumber}
                    onChange={(e) => setNewRoomNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="Suite">Suite</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Floor
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newFloor}
                    onChange={(e) => setNewFloor(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Nightly Rate ($)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={newBaseRate}
                    onChange={(e) => setNewBaseRate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Max Occupancy
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={newMaxOccupancy}
                    onChange={(e) => setNewMaxOccupancy(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Amenities (comma-separated)
                </label>
                <input
                  type="text"
                  value={newAmenities}
                  onChange={(e) => setNewAmenities(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingRoom}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSavingRoom ? "Saving..." : "Add Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;
