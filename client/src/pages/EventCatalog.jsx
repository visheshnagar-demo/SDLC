import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getEvents, getEventTiers, createBooking } from "../services/api";
import { useAuth } from "../context/AuthContext";
import EventNightSelector from "../components/EventNightSelector";
import PassTierCard from "../components/PassTierCard";
import BookingForm from "../components/BookingForm";
import OrderSummary from "../components/OrderSummary";
import {
  Sparkles,
  Ticket,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export const EventCatalog = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [selectedTier, setSelectedTier] = useState(null);
  const [bookingQuantity, setBookingQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tiersLoading, setTiersLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Load Events on Mount
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        const eventList = await getEvents();
        setEvents(eventList);
        if (eventList && eventList.length > 0) {
          setSelectedEvent(eventList[0]);
        }
      } catch (err) {
        setErrorMessage(
          "Unable to load events from server. Please check backend connection.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchEventData();
  }, []);

  // Load Tiers when selectedEvent changes
  useEffect(() => {
    if (!selectedEvent) return;
    const fetchTiers = async () => {
      try {
        setTiersLoading(true);
        const tierList = await getEventTiers(selectedEvent.id);
        setTiers(tierList);
        if (tierList && tierList.length > 0) {
          // Default to first available tier
          const available =
            tierList.find((t) => t.available_quota > 0) || tierList[0];
          setSelectedTier(available);
        } else {
          setSelectedTier(null);
        }
      } catch (err) {
        setErrorMessage("Failed to load pass tiers for selected event.");
      } finally {
        setTiersLoading(false);
      }
    };
    fetchTiers();
  }, [selectedEvent]);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setBookingSuccess(null);
    setErrorMessage("");
  };

  const handleSelectTier = (tier) => {
    setSelectedTier(tier);
    setErrorMessage("");
  };

  const handleBookingSubmit = async ({ quantity, attendees }) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!selectedEvent || !selectedTier) {
      setErrorMessage("Please select both an event night and pass tier.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        eventId: selectedEvent.id,
        passTierId: selectedTier.id,
        quantity: parseInt(quantity, 10),
        attendees: attendees.map((a) => ({
          fullName: a.fullName,
          email: a.email,
          phone: a.phone || null,
        })),
      };

      const bookingResponse = await createBooking(payload);
      setBookingSuccess(bookingResponse);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        "Booking request failed. Quota may be sold out.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-10">
      {/* Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#1E1B4B] via-[#0F172A] to-[#1E1B4B] border border-[#F59E0B]/30 p-8 sm:p-12 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#BE185D]/20 via-[#F59E0B]/10 to-transparent rounded-full blur-3xl -z-10" />

        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>GarbaFest 2026 Registration</span>
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight">
            Celebrate 9 Divine Nights of Rhythm & Joy
          </h1>

          <p className="text-sm sm:text-base text-slate-300">
            Book your festival passes, select custom attendee tiers, and receive
            tamper-proof HMAC SHA-256 encrypted digital QR passes for fast gate
            entry.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Instant
              Digital QR
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Ticket className="w-4 h-4 text-[#F59E0B]" /> Multi-Tier Passes
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Sparkles className="w-4 h-4 text-[#BE185D]" /> Real-time Gate
              Entry
            </span>
          </div>
        </div>
      </div>

      {/* Success Confirmation Modal/Card */}
      {bookingSuccess && (
        <div className="bg-emerald-950/40 border-2 border-emerald-500 rounded-3xl p-8 shadow-2xl shadow-emerald-500/10 space-y-5 animate-in fade-in duration-300">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="font-display font-extrabold text-2xl text-emerald-400">
                  Booking Confirmed!
                </h2>
                <p className="text-xs text-slate-300">
                  Reference:{" "}
                  <span className="font-mono font-bold text-white">
                    {bookingSuccess.booking_reference || bookingSuccess.id}
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate("/my-passes")}
              className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <span>View My Passes</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Your {bookingSuccess.passes?.length || 1} digital pass(es) have been
            cryptographically signed and stored in your wallet.
          </p>
        </div>
      )}

      {/* Step 1: Event Selector */}
      <section className="space-y-4">
        {loading ? (
          <div className="bg-[#0F172A] p-12 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs">
            Loading active Garba events...
          </div>
        ) : (
          <EventNightSelector
            events={events}
            selectedEventId={selectedEvent?.id}
            onSelectEvent={handleSelectEvent}
          />
        )}
      </section>

      {/* Step 2: Pass Tier Selector */}
      {selectedEvent && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#F59E0B]" />
              <span>Choose Pass Category for {selectedEvent.title}</span>
            </h2>
            <span className="text-xs text-slate-400">
              {tiers.length} Tier{tiers.length > 1 ? "s" : ""} Configured
            </span>
          </div>

          {tiersLoading ? (
            <div className="bg-[#0F172A] p-8 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs">
              Loading pass tiers...
            </div>
          ) : tiers.length === 0 ? (
            <div className="bg-[#0F172A] p-8 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs">
              No pass tiers found for this event.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {tiers.map((tier) => (
                <PassTierCard
                  key={tier.id}
                  tier={tier}
                  isSelected={selectedTier?.id === tier.id}
                  onSelect={handleSelectTier}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Step 3: Attendee Details & Checkout */}
      {selectedTier && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <BookingForm
              selectedTier={selectedTier}
              onSubmitBooking={handleBookingSubmit}
              isSubmitting={isSubmitting}
              errorMessage={errorMessage}
            />
          </div>

          <div className="lg:col-span-1">
            <OrderSummary
              selectedEvent={selectedEvent}
              selectedTier={selectedTier}
              quantity={bookingQuantity}
            />
          </div>
        </section>
      )}
    </div>
  );
};

export default EventCatalog;
