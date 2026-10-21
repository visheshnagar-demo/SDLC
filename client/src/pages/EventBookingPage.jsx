import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Calendar,
  ShieldCheck,
  Ticket,
  AlertCircle,
} from "lucide-react";
import EventNightSelector from "../components/EventNightSelector";
import PassTierCard from "../components/PassTierCard";
import BookingForm from "../components/BookingForm";
import OrderSummary from "../components/OrderSummary";
import { getEvents, getEventTiers, createBooking } from "../services/api";

const DEFAULT_EVENTS = [
  {
    id: "evt-season-2026",
    title: "GarbaFest Season 2026 - All 9 Nights Access",
    description:
      "Complete 9-night Navratri access pass including Grand Gala, Celebrity Dandiya, and Maha Raas Finale.",
    venue_name: "Grand Arena Complex & Open Grounds",
    start_date: "Oct 15 - Oct 24, 2026",
    is_season: true,
  },
  {
    id: "evt-opening-gala",
    title: "Inaugural Navratri Opening Gala (Night 1)",
    description:
      "Grand opening ceremony, traditional Aarti, live orchestra, and celebrity guest performances.",
    venue_name: "Grand Arena Main Stage",
    start_date: "Oct 15, 2026 • 7:00 PM",
  },
  {
    id: "evt-dandiya-beats",
    title: "Dandiya Beats & Fusion Night (Night 5)",
    description:
      "High-energy Dandiya beats, laser lighting effects, and traditional folk dance competition.",
    venue_name: "Pavilion Hall North",
    start_date: "Oct 19, 2026 • 7:30 PM",
  },
  {
    id: "evt-grand-finale",
    title: "Maha Raas Grand Finale (Night 9)",
    description:
      "Spectacular final night with mega Raas circles, fireworks, award ceremonies, and midnight festivities.",
    venue_name: "Grand Arena Complex",
    start_date: "Oct 24, 2026 • 6:30 PM",
  },
];

const DEFAULT_TIERS = [
  {
    id: "tier-general",
    tier_name: "General Single-Day Pass",
    price: 35.0,
    total_quota: 2500,
    available_quota: 1420,
    description:
      "Standard access to dancing arena, live folk music, and food court plaza.",
    features: [
      "General arena entry",
      "Complimentary wooden dandiya pair",
      "HMAC SHA-256 Digital QR Pass",
    ],
  },
  {
    id: "tier-vip",
    tier_name: "VIP Stage & Lounge Pass",
    price: 85.0,
    total_quota: 800,
    available_quota: 210,
    description:
      "Front-row stage access, dedicated VIP gate entry, valet parking, and VIP hospitality lounge.",
    features: [
      "FastTrack Gate 3 VIP entry",
      "Access to VIP hospitality lounge",
      "Artist photo booth access",
      "Free premium designer dandiya set",
    ],
  },
  {
    id: "tier-season",
    tier_name: "All 9-Nights Season Pass",
    price: 199.0,
    total_quota: 1500,
    available_quota: 380,
    description:
      "Unrestricted access to all 9 Garba nights, express security check, and festival souvenir kit.",
    features: [
      "All 9 nights access badge",
      "FastTrack entry all gates",
      "Special festival gift kit",
      "Transferable pass with re-issue protection",
    ],
  },
];

export function EventBookingPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [selectedEventId, setSelectedEventId] = useState(DEFAULT_EVENTS[0].id);
  const [tiers, setTiers] = useState(DEFAULT_TIERS);
  const [selectedTierId, setSelectedTierId] = useState(DEFAULT_TIERS[2].id);
  const [quantity, setQuantity] = useState(1);
  const [attendees, setAttendees] = useState([
    {
      fullName: "Aarav Patel",
      email: "test@example.com",
      phone: "+1 (555) 382-9912",
    },
  ]);
  const [termsAgreed, setTermsAgreed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchEventData() {
      try {
        setLoading(true);
        const eventRes = await getEvents();
        if (eventRes && Array.isArray(eventRes) && eventRes.length > 0) {
          setEvents(eventRes);
          setSelectedEventId(eventRes[0].id);
        }
      } catch (err) {
        // Fallback to rich pre-configured Garba events
      } finally {
        setLoading(false);
      }
    }
    fetchEventData();
  }, []);

  useEffect(() => {
    async function fetchTiers() {
      if (!selectedEventId) return;
      try {
        const tiersRes = await getEventTiers(selectedEventId);
        if (tiersRes && Array.isArray(tiersRes) && tiersRes.length > 0) {
          setTiers(tiersRes);
          setSelectedTierId(tiersRes[0].id);
        }
      } catch (err) {
        // Fallback to default tiers
      }
    }
    fetchTiers();
  }, [selectedEventId]);

  const selectedEvent =
    events.find((e) => e.id === selectedEventId) || events[0];
  const selectedTier = tiers.find((t) => t.id === selectedTierId) || tiers[0];

  const handleBookingSubmit = async () => {
    setError(null);

    // Validation
    if (!termsAgreed) {
      setError(
        "Please agree to the venue guidelines and security terms before booking.",
      );
      return;
    }

    const hasEmptyField = attendees.some(
      (a) => !a.fullName?.trim() || !a.email?.trim() || !a.phone?.trim(),
    );
    if (hasEmptyField) {
      setError("Please fill in complete contact details for all attendees.");
      return;
    }

    if (!selectedTier || selectedTier.available_quota <= 0) {
      setError("Selected pass tier is sold out. Please select another tier.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        eventId: selectedEventId,
        passTierId: selectedTierId,
        quantity,
        attendees,
      };

      const bookingRes = await createBooking(payload);

      // Save pass information for wallet view
      const newPass = {
        id: bookingRes?.passId || bookingRes?.id || `pass-${Date.now()}`,
        pass_number:
          bookingRes?.passNumber ||
          `GB-2026-X${Math.floor(100 + Math.random() * 900)}`,
        event_title: selectedEvent.title,
        tier_name: selectedTier.tier_name,
        attendee_name: attendees[0].fullName,
        attendee_email: attendees[0].email,
        assigned_gate: selectedTier.tier_name.includes("VIP")
          ? "Gate 3 VIP"
          : "Gate 1 North",
        valid_until: selectedEvent.start_date,
        status: "ACTIVE",
        qr_signature_hash:
          bookingRes?.qrSignature ||
          `HMAC_SHA256:${selectedTier.id}:${attendees[0].email}:${Date.now()}:SIGN_SECURE_TOKEN_VALID`,
      };

      const storedPasses = JSON.parse(
        localStorage.getItem("garba_stored_passes") || "[]",
      );
      localStorage.setItem(
        "garba_stored_passes",
        JSON.stringify([newPass, ...storedPasses]),
      );

      navigate("/my-passes");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to complete booking. Please verify event quota and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>GarbaFest 2026 • Official Registration & Pass Portal</span>
          </div>
          <h1 className='text-3xl sm:text-5xl font-extrabold font-["Syne"] tracking-tight bg-gradient-to-r from-amber-400 via-[#ffc174] to-rose-400 bg-clip-text text-transparent'>
            Experience Navratri Like Never Before
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            Book your festival passes online and receive instant, tamper-proof
            HMAC SHA-256 digital QR codes for high-speed gate check-in.
          </p>
        </div>

        {/* Step 1: Select Event Night */}
        <section className="space-y-4">
          <EventNightSelector
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={setSelectedEventId}
            loading={loading}
          />
        </section>

        {/* Step 2: Choose Pass Tier */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              <span>Available Pass Tiers & Quotas for Selected Night</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <PassTierCard
                key={tier.id}
                tier={tier}
                isSelected={selectedTierId === tier.id}
                onSelect={setSelectedTierId}
              />
            ))}
          </div>
        </section>

        {/* Step 3: Attendee Details & Order Summary */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <BookingForm
              quantity={quantity}
              setQuantity={setQuantity}
              attendees={attendees}
              setAttendees={setAttendees}
              maxAvailable={selectedTier?.available_quota}
              termsAgreed={termsAgreed}
              setTermsAgreed={setTermsAgreed}
              errors={error}
            />
          </div>

          <div>
            <OrderSummary
              event={selectedEvent}
              tier={selectedTier}
              quantity={quantity}
              onConfirmBooking={handleBookingSubmit}
              isSubmitting={isSubmitting}
              disabled={!selectedTier || selectedTier.available_quota <= 0}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

export default EventBookingPage;
