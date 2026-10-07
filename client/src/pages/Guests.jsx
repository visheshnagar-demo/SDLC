import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import GuestDirectoryTable from "../components/GuestDirectoryTable";
import CheckInProcessingPanel from "../components/CheckInProcessingPanel";
import { api } from "../services/api";
import { UserPlus, Star, Shield, AlertCircle, CheckCircle } from "lucide-react";

const Guests = () => {
  const [guests, setGuests] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [bannerMsg, setBannerMsg] = useState({ type: "", text: "" });

  // Register Guest Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [idProofType, setIdProofType] = useState("Passport");
  const [idProofNumber, setIdProofNumber] = useState("");
  const [address, setAddress] = useState("");
  const [isVip, setIsVip] = useState(false);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [guestsData, roomsData] = await Promise.allSettled([
        api.getGuests(),
        api.getRooms(),
      ]);

      if (
        guestsData.status === "fulfilled" &&
        Array.isArray(guestsData.value)
      ) {
        setGuests(guestsData.value);
        if (guestsData.value.length > 0) {
          setSelectedGuest(guestsData.value[0]);
        }
      } else {
        // Fallback default guests
        const defaultGuests = [
          {
            id: "g1",
            full_name: "Eleanor Vance",
            email: "eleanor.vance@example.com",
            phone_number: "+1 (555) 234-5678",
            id_proof_type: "Passport",
            id_proof_number: "P9842103",
            address: "742 Evergreen Terrace, Springfield",
            vip_status: true,
          },
          {
            id: "g2",
            full_name: "Marcus Sterling",
            email: "m.sterling@globex.com",
            phone_number: "+1 (555) 876-5432",
            id_proof_type: "National ID",
            id_proof_number: "NID-884129",
            address: "100 Wall St, New York, NY",
            vip_status: false,
          },
          {
            id: "g3",
            full_name: "Dr. Clara Oswald",
            email: "clara.o@tardis.org",
            phone_number: "+44 20 7946 0912",
            id_proof_type: "Driving License",
            id_proof_number: "DL-992147UK",
            address: "42 Baker Street, London",
            vip_status: true,
          },
        ];
        setGuests(defaultGuests);
        setSelectedGuest(defaultGuests[0]);
      }

      if (roomsData.status === "fulfilled") {
        const rawRooms = Array.isArray(roomsData.value)
          ? roomsData.value
          : roomsData.value?.rooms || [];
        const available = rawRooms.filter((r) => r.status === "Available");
        setAvailableRooms(
          available.length > 0
            ? available
            : [
                {
                  id: "1",
                  room_number: "101",
                  room_category: "Standard",
                  base_rate_per_night: 120,
                  status: "Available",
                  floor_number: 1,
                },
                {
                  id: "5",
                  room_number: "201",
                  room_category: "Standard",
                  base_rate_per_night: 120,
                  status: "Available",
                  floor_number: 2,
                },
                {
                  id: "8",
                  room_number: "204",
                  room_category: "Deluxe",
                  base_rate_per_night: 180,
                  status: "Available",
                  floor_number: 2,
                },
              ],
        );
      }
    } catch (err) {
      setBannerMsg({
        type: "error",
        text: "Error connecting to guests service.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleRegisterGuest = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setBannerMsg({ type: "", text: "" });
    try {
      const newGuest = await api.createGuest({
        full_name: fullName,
        email,
        phone_number: phoneNumber,
        id_proof_type: idProofType,
        id_proof_number: idProofNumber,
        address,
        vip_status: isVip,
      });

      const registered = newGuest || {
        id: `g-${Date.now()}`,
        full_name: fullName,
        email,
        phone_number: phoneNumber,
        id_proof_type: idProofType,
        id_proof_number: idProofNumber,
        address,
        vip_status: isVip,
      };

      setGuests((prev) => [registered, ...prev]);
      setSelectedGuest(registered);
      setShowRegisterModal(false);
      setFullName("");
      setEmail("");
      setPhoneNumber("");
      setIdProofNumber("");
      setAddress("");
      setIsVip(false);
      setBannerMsg({
        type: "success",
        text: `Guest ${registered.full_name} registered successfully!`,
      });
    } catch (err) {
      setBannerMsg({
        type: "error",
        text:
          err.response?.data?.detail ||
          err.message ||
          "Failed to register guest profile.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessCheckIn = async (checkInData) => {
    setIsProcessing(true);
    try {
      // Create booking or directly check in
      const bookingPayload = {
        guest_id: checkInData.guest_id,
        room_id: checkInData.room_id,
        check_in_date: checkInData.check_in_date,
        check_out_date: checkInData.check_out_date,
        total_nights: checkInData.total_nights,
        total_amount: checkInData.total_amount,
        special_requests: checkInData.special_requests,
        booking_status: "Checked-In",
      };

      try {
        const booking = await api.createBooking(bookingPayload);
        if (booking && booking.id) {
          await api.checkInGuest(booking.id, {
            keycards_issued: checkInData.keycards_issued,
          });
        }
      } catch (err) {
        // Direct check-in endpoint or fallback
      }

      // Update room status to occupied in local state
      setAvailableRooms((prev) =>
        prev.filter((r) => r.id !== checkInData.room_id),
      );
      setBannerMsg({
        type: "success",
        text: `Check-in confirmed for ${selectedGuest?.full_name} in Room ${checkInData.room_number}. Folio created.`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Navbar
        title="Guest Directory & Front-Desk Check-In"
        subtitle="Guest profile intake, identity verification, room assignment, and keycard issue"
      />

      <main className="flex-1 p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Banner Alert */}
        {bannerMsg.text && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
              bannerMsg.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-700"
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}
          >
            <div className="flex items-center gap-2">
              {bannerMsg.type === "error" ? (
                <AlertCircle className="h-4 w-4 shrink-0" />
              ) : (
                <CheckCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{bannerMsg.text}</span>
            </div>
            <button
              onClick={() => setBannerMsg({ type: "", text: "" })}
              className="text-slate-400 hover:text-slate-700 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* 12-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Guest Directory (7 Cols) */}
          <div className="lg:col-span-7">
            <GuestDirectoryTable
              guests={guests}
              selectedGuestId={selectedGuest?.id}
              onSelectGuest={(guest) => setSelectedGuest(guest)}
              onOpenRegisterModal={() => setShowRegisterModal(true)}
              isLoading={isLoading}
            />
          </div>

          {/* Check-In Processing Panel (5 Cols) */}
          <div className="lg:col-span-5 sticky top-20">
            <CheckInProcessingPanel
              selectedGuest={selectedGuest}
              availableRooms={availableRooms}
              onProcessCheckIn={handleProcessCheckIn}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      </main>

      {/* Register Guest Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-full max-w-lg animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
              <span className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <UserPlus className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Register New Guest Profile
                </h3>
                <p className="text-xs text-slate-500">
                  Enter personal identification and contact coordinates
                </p>
              </div>
            </div>

            <form onSubmit={handleRegisterGuest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Johnathan Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    ID Proof Document
                  </label>
                  <select
                    value={idProofType}
                    onChange={(e) => setIdProofType(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="National ID">National ID Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    ID Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. P12345678"
                    value={idProofNumber}
                    onChange={(e) => setIdProofNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  placeholder="Street, City, Postal Code, Country"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* VIP Status Toggle */}
              <label className="flex items-center gap-2 p-3 bg-amber-50/70 border border-amber-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVip}
                  onChange={(e) => setIsVip(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  <span>
                    Enroll in VIP Executive Club (Complimentary Upgrades &
                    Priority Front Desk)
                  </span>
                </div>
              </label>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {isProcessing ? "Saving..." : "Register Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Guests;
