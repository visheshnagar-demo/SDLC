import React, { useState, useEffect } from "react";
import {
  KeyRound,
  Calendar,
  BedDouble,
  DollarSign,
  UserCheck,
  AlertCircle,
  CheckCircle,
  CreditCard,
  Shield,
} from "lucide-react";

const CheckInProcessingPanel = ({
  selectedGuest,
  availableRooms = [],
  onProcessCheckIn,
  isProcessing = false,
}) => {
  const todayStr = new Date().toISOString().split("T")[0];
  const next3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [roomId, setRoomId] = useState("");
  const [checkInDate, setCheckInDate] = useState(todayStr);
  const [checkOutDate, setCheckOutDate] = useState(next3Days);
  const [keycardsCount, setKeycardsCount] = useState(2);
  const [specialRequests, setSpecialRequests] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Calculate nights
  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 1;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const totalNights = calculateNights();
  const selectedRoomObj = availableRooms.find(
    (r) => r.id === roomId || r.room_number === roomId,
  );
  const nightlyRate = selectedRoomObj
    ? selectedRoomObj.base_rate_per_night || 150
    : 150;
  const baseCharge = totalNights * nightlyRate;
  const taxes = Number((baseCharge * 0.1).toFixed(2));
  const totalPayable = baseCharge + taxes;

  useEffect(() => {
    if (availableRooms.length > 0 && !roomId) {
      setRoomId(availableRooms[0].id || availableRooms[0].room_number);
    }
  }, [availableRooms, roomId]);

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!selectedGuest) {
      setErrorMsg("Please select a guest from the directory first.");
      return;
    }
    if (!roomId) {
      setErrorMsg("Please select an available room.");
      return;
    }

    try {
      await onProcessCheckIn({
        guest_id: selectedGuest.id,
        room_id: selectedRoomObj?.id || roomId,
        room_number: selectedRoomObj?.room_number || roomId,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        total_nights: totalNights,
        total_amount: totalPayable,
        keycards_issued: keycardsCount,
        special_requests: specialRequests,
      });
      setSuccessMsg(
        `Check-in completed successfully for ${selectedGuest.full_name} in Room ${selectedRoomObj?.room_number || roomId}!`,
      );
    } catch (err) {
      setErrorMsg(
        err.response?.data?.detail ||
          err.message ||
          "Check-in failed. Please verify dates and room availability.",
      );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 flex flex-col h-full">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-blue-600" />
            <span>Front-Desk Check-In Terminal</span>
          </h3>
          <p className="text-xs text-slate-500">
            Assign keycards, compute tariff, and check in guest
          </p>
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
          Terminal #1
        </span>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700 font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-700 font-medium">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Guest Summary Card */}
      <div className="mb-5 p-3.5 rounded-lg bg-slate-50 border border-slate-200/70">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
          Active Guest Selection
        </span>
        {selectedGuest ? (
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">
                {selectedGuest.full_name}
              </span>
              {selectedGuest.vip_status && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  VIP Guest
                </span>
              )}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              {selectedGuest.email} • {selectedGuest.id_proof_type || "ID"}:{" "}
              {selectedGuest.id_proof_number || "N/A"}
            </div>
          </div>
        ) : (
          <div className="text-xs text-amber-700 font-medium flex items-center gap-1.5 py-1">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>No guest selected. Click a guest on the left table.</span>
          </div>
        )}
      </div>

      <form
        onSubmit={handleCheckInSubmit}
        className="space-y-4 flex-1 overflow-y-auto"
      >
        {/* Room Assignment */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Assign Available Room
          </label>
          <div className="relative">
            <BedDouble className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {availableRooms.length === 0 ? (
                <option value="">No rooms currently marked Available</option>
              ) : (
                availableRooms.map((r) => (
                  <option
                    key={r.id || r.room_number}
                    value={r.id || r.room_number}
                  >
                    Room {r.room_number} — {r.room_category} ($
                    {r.base_rate_per_night}/nt, Floor {r.floor_number || 1})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Stay Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Check-In Date
            </label>
            <div className="relative">
              <Calendar className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full pl-8 pr-2 py-2 text-xs border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Check-Out Date
            </label>
            <div className="relative">
              <Calendar className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full pl-8 pr-2 py-2 text-xs border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* RFID Keycards Dispenser */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            RFID Keycards to Issue
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setKeycardsCount(count)}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                  keycardsCount === count
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {count} {count === 1 ? "Card" : "Cards"}
              </button>
            ))}
          </div>
        </div>

        {/* Special Requests */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Special Requests / Notes
          </label>
          <input
            type="text"
            placeholder="e.g. Extra pillows, high floor, late arrival..."
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tariff Summary Card */}
        <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>
              Rate: ${nightlyRate} × {totalNights} Night(s)
            </span>
            <span className="font-semibold text-slate-800">
              ${baseCharge.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Occupancy & State Tax (10%)</span>
            <span className="font-semibold text-slate-800">
              ${taxes.toFixed(2)}
            </span>
          </div>
          <div className="pt-2 border-t border-blue-200/60 flex justify-between text-sm font-extrabold text-blue-900">
            <span>Estimated Total:</span>
            <span>${totalPayable.toFixed(2)}</span>
          </div>
        </div>

        {/* Check-In Action Button */}
        <button
          type="submit"
          disabled={
            isProcessing || !selectedGuest || availableRooms.length === 0
          }
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all mt-4"
        >
          <UserCheck className="h-4 w-4" />
          <span>
            {isProcessing
              ? "Processing Check-In..."
              : "Confirm & Complete Check-In"}
          </span>
        </button>
      </form>
    </div>
  );
};

export default CheckInProcessingPanel;
