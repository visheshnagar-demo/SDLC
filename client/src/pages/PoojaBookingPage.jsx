import React, { useState, useEffect } from "react";
import PoojaCatalog from "../components/pooja/PoojaCatalog";
import SlotMatrix from "../components/pooja/SlotMatrix";
import QRPassCard from "../components/pooja/QRPassCard";
import { getPoojas, getPoojaSlots, createBooking } from "../services/api";
import {
  Calendar,
  Sparkles,
  CheckCircle2,
  UserCheck,
  ShieldCheck,
} from "lucide-react";

export default function PoojaBookingPage() {
  const [poojas, setPoojas] = useState([
    {
      id: "P01",
      code: "POOJA-01",
      name: "Mahaganapati Homa & Archana",
      default_price: 501,
      duration_minutes: 60,
      description:
        "Sacred fire ritual invoking Lord Ganesha for remover of all obstacles.",
    },
    {
      id: "P02",
      code: "POOJA-02",
      name: "Sahasranama Archana",
      default_price: 251,
      duration_minutes: 30,
      description:
        "Recitation of 1,000 holy names of Lord Siddhivinayak with fresh modaks.",
    },
    {
      id: "P03",
      code: "POOJA-03",
      name: "Sankashti Chaturthi Mahotsav Seva",
      default_price: 1008,
      duration_minutes: 90,
      description:
        "Special monthly Chaturthi grand abhishekam with durva grass and panchamrutam.",
    },
  ]);

  const [selectedPooja, setSelectedPooja] = useState(poojas[0]);
  const [slots, setSlots] = useState([
    {
      id: "SLOT-01",
      pooja_id: "P01",
      slot_date: "2026-09-18",
      start_time: "07:00 AM",
      end_time: "08:00 AM",
      capacity: 20,
      booked_count: 5,
    },
    {
      id: "SLOT-02",
      pooja_id: "P01",
      slot_date: "2026-09-18",
      start_time: "09:30 AM",
      end_time: "10:30 AM",
      capacity: 20,
      booked_count: 12,
    },
    {
      id: "SLOT-03",
      pooja_id: "P01",
      slot_date: "2026-09-18",
      start_time: "05:00 PM",
      end_time: "06:00 PM",
      capacity: 15,
      booked_count: 15,
    },
  ]);

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [devoteeName, setDevoteeName] = useState("Ramesh Sharma");
  const [sankalpGotra, setSankalpGotra] = useState("Kashyapa");
  const [priestName, setPriestName] = useState("Pt. Anant Shastri");
  const [activePass, setActivePass] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      const data = await getPoojas();
      if (Array.isArray(data) && data.length > 0) {
        setPoojas(data);
        setSelectedPooja(data[0]);
      }
    } catch (err) {
      console.warn("API fetch poojas error, using default catalog:", err);
    }
  };

  const handlePoojaSelect = async (pooja) => {
    setSelectedPooja(pooja);
    setSelectedSlot(null);
    try {
      const slotData = await getPoojaSlots(pooja.id || pooja.code);
      if (Array.isArray(slotData) && slotData.length > 0) {
        setSlots(slotData);
      }
    } catch (err) {
      // keep fallback slots
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setIsSubmitting(true);
    const bookingPayload = {
      slot_id: selectedSlot.id,
      pooja_id: selectedPooja.id || selectedPooja.code,
      pooja_name: selectedPooja.name,
      sankalp_name: devoteeName,
      sankalp_gotra: sankalpGotra,
      priest_name: priestName,
      amount_paid: selectedPooja.default_price || 501,
    };

    try {
      const result = await createBooking(bookingPayload);
      setActivePass(result);
    } catch (err) {
      // Local fallback pass on error
      const mockPass = {
        ...bookingPayload,
        id: `BK-${Date.now()}`,
        booking_number: `GT-BK-${Math.floor(1000 + Math.random() * 9000)}`,
        qr_code_token: `QR-GT-${Math.floor(10000 + Math.random() * 90000)}`,
      };
      setActivePass(mockPass);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-orange-900 text-white p-5 rounded-xl shadow-md border border-amber-600 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-serif font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-300" />
            Pooja & Archana Booking Desk
          </h1>
          <p className="text-xs text-amber-200 mt-0.5">
            Online & Counter slot scheduling with digital QR pass generation
          </p>
        </div>
      </div>

      {activePass ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center max-w-md mx-auto">
            <button
              onClick={() => setActivePass(null)}
              className="text-xs font-bold text-orange-800 hover:underline"
            >
              ← Book Another Pooja Slot
            </button>
          </div>
          <QRPassCard booking={activePass} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <PoojaCatalog
              poojas={poojas}
              selectedPooja={selectedPooja}
              onSelectPooja={handlePoojaSelect}
            />

            {selectedPooja && (
              <SlotMatrix
                slots={slots}
                selectedSlot={selectedSlot}
                onSelectSlot={(slot) => setSelectedSlot(slot)}
                poojaName={selectedPooja.name}
              />
            )}
          </div>

          {/* Checkout & Sankalpa Details Sidebar */}
          <div className="bg-white p-5 rounded-xl shadow-md border border-orange-200 h-fit space-y-4">
            <h3 className="font-serif font-bold text-lg text-orange-950 border-b border-orange-100 pb-2 flex items-center">
              <Sparkles className="w-4 h-4 mr-1.5 text-orange-600" />
              Sankalpa & Checkout
            </h3>

            {selectedPooja && selectedSlot ? (
              <form
                onSubmit={handleBookingSubmit}
                className="space-y-4 text-xs"
              >
                <div className="bg-amber-50 p-3 rounded-lg border border-orange-200 text-orange-900 space-y-1">
                  <div className="font-bold text-sm text-orange-950">
                    {selectedPooja.name}
                  </div>
                  <div>
                    Date: {selectedSlot.slot_date || "Today"} (
                    {selectedSlot.start_time})
                  </div>
                  <div className="font-bold text-green-700 text-sm">
                    Fee: ₹{selectedPooja.default_price || 501}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-orange-900 mb-1">
                    Devotee Name for Sankalpa
                  </label>
                  <input
                    type="text"
                    value={devoteeName}
                    onChange={(e) => setDevoteeName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-orange-200 rounded focus:ring-1 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-orange-900 mb-1">
                    Gotra
                  </label>
                  <input
                    type="text"
                    value={sankalpGotra}
                    onChange={(e) => setSankalpGotra(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-orange-200 rounded focus:ring-1 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-orange-900 mb-1">
                    Assigned Temple Priest
                  </label>
                  <select
                    value={priestName}
                    onChange={(e) => setPriestName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-orange-200 rounded focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="Pt. Anant Shastri">
                      Pt. Anant Shastri (Head Priest)
                    </option>
                    <option value="Pt. Vignesh Bhat">Pt. Vignesh Bhat</option>
                    <option value="Pt. Ramanuja Archaka">
                      Pt. Ramanuja Archaka
                    </option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-orange-700 hover:bg-orange-800 text-white font-bold rounded-lg shadow text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Reserving Slot..."
                    : `Confirm & Issue Pass (₹${selectedPooja.default_price || 501})`}
                </button>
              </form>
            ) : (
              <div className="py-8 text-center text-orange-600/70 text-xs font-medium">
                Please select both a Pooja and an available time slot to
                proceed.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
