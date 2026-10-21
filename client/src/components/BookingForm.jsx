import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Users,
  Plus,
  Trash2,
  CheckSquare,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const BookingForm = ({
  selectedTier,
  onSubmitBooking,
  isSubmitting,
  errorMessage,
}) => {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [attendees, setAttendees] = useState([
    {
      fullName: user?.full_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  ]);
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  // Sync initial user details if user logs in later
  useEffect(() => {
    if (user && attendees[0]?.fullName === "") {
      setAttendees([
        {
          fullName: user.full_name || "",
          email: user.email || "",
          phone: user.phone || "",
        },
      ]);
    }
  }, [user]);

  const handleQuantityChange = (newQty) => {
    const qty = Math.max(1, Math.min(10, parseInt(newQty, 10) || 1));
    setQuantity(qty);

    const updated = [...attendees];
    if (qty > updated.length) {
      for (let i = updated.length; i < qty; i++) {
        updated.push({ fullName: "", email: "", phone: "" });
      }
    } else if (qty < updated.length) {
      updated.splice(qty);
    }
    setAttendees(updated);
  };

  const handleAttendeeChange = (index, field, value) => {
    const updated = [...attendees];
    updated[index] = { ...updated[index], [field]: value };
    setAttendees(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!agreedToTerms) return;

    // Build payload according to BookingCreate schema: { eventId, passTierId, quantity, attendees }
    onSubmitBooking({
      quantity,
      attendees,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6"
    >
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#F59E0B]" />
            <span>Attendee Information</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Each attendee receives an HMAC SHA-256 encrypted digital QR pass.
          </p>
        </div>

        {/* Quantity Selector */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="qty-select"
            className="text-xs font-semibold text-slate-300"
          >
            Quantity:
          </label>
          <select
            id="qty-select"
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-bold text-[#F59E0B] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
          >
            {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
              <option key={num} value={num}>
                {num} {num === 1 ? "Pass" : "Passes"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {errorMessage && (
        <div
          className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs font-medium"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {/* Attendee Form Rows */}
      <div className="space-y-4">
        {attendees.map((attendee, idx) => (
          <div
            key={idx}
            className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Pass #{idx + 1} Attendee
              </span>
              {attendees.length > 1 && idx > 0 && (
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  className="text-slate-400 hover:text-rose-400 text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={attendee.fullName}
                    onChange={(e) =>
                      handleAttendeeChange(idx, "fullName", e.target.value)
                    }
                    placeholder="e.g. Aarav Patel"
                    className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={attendee.email}
                    onChange={(e) =>
                      handleAttendeeChange(idx, "email", e.target.value)
                    }
                    placeholder="e.g. aarav@example.com"
                    className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={attendee.phone}
                    onChange={(e) =>
                      handleAttendeeChange(idx, "phone", e.target.value)
                    }
                    placeholder="e.g. +1 555-0199"
                    className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Guidelines Agreement */}
      <div className="pt-2">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-0.5 rounded border-slate-700 text-[#F59E0B] focus:ring-[#F59E0B]"
          />
          <span className="text-xs text-slate-300">
            I agree to the Garba venue safety guidelines, traditional attire
            code, and non-transferable pass terms.
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !selectedTier || !agreedToTerms}
        className="w-full py-3 px-6 rounded-xl font-display font-extrabold text-base bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#BE185D] hover:opacity-95 text-slate-950 shadow-lg shadow-[#F59E0B]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isSubmitting
          ? "Generating Digital Passes..."
          : `Confirm & Issue ${quantity} Pass${quantity > 1 ? "es" : ""}`}
      </button>
    </form>
  );
};

export default BookingForm;
