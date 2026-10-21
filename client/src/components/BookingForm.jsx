import React from "react";
import {
  User,
  Mail,
  Phone,
  Users,
  Shield,
  Plus,
  Minus,
  AlertCircle,
  Info,
} from "lucide-react";

export function BookingForm({
  quantity,
  setQuantity,
  attendees,
  setAttendees,
  maxAvailable,
  termsAgreed,
  setTermsAgreed,
  errors,
}) {
  const handleAttendeeChange = (index, field, value) => {
    const updated = [...attendees];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setAttendees(updated);
  };

  const handleQuantityChange = (newQty) => {
    const validQty = Math.max(
      1,
      Math.min(newQty, Math.min(10, maxAvailable || 10)),
    );
    setQuantity(validQty);

    const currentLength = attendees.length;
    if (validQty > currentLength) {
      const added = Array.from(
        { length: validQty - currentLength },
        (_, i) => ({
          fullName: "",
          email: "",
          phone: "",
        }),
      );
      setAttendees([...attendees, ...added]);
    } else if (validQty < currentLength) {
      setAttendees(attendees.slice(0, validQty));
    }
  };

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className='text-lg font-bold text-white font-["Syne"]'>
              Attendee Details
            </h2>
            <p className="text-xs text-slate-400">
              Enter attendee information for digital pass issuance.
            </p>
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-xl">
          <span className="text-xs text-slate-400 mr-1">Qty:</span>
          <button
            type="button"
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={quantity <= 1}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono font-bold text-white w-6 text-center text-sm">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => handleQuantityChange(quantity + 1)}
            disabled={quantity >= Math.min(10, maxAvailable || 10)}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Test Account Notification Banner */}
      <div className="bg-[#0b1326] border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/90 leading-relaxed">
          <strong className="font-semibold text-amber-300">
            Test Credentials:
          </strong>{" "}
          Primary attendee auto-populated for test convenience (
          <span className="font-mono">test@example.com</span> /{" "}
          <span className="font-mono">testpassword</span>).
        </div>
      </div>

      {/* Dynamic Attendee Cards */}
      <div className="space-y-4">
        {attendees.map((attendee, index) => (
          <div
            key={index}
            className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-3"
          >
            <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase tracking-wider">
              <span>
                Attendee #{index + 1} {index === 0 && "(Primary Contact)"}
              </span>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  className="text-slate-400 hover:text-rose-400"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={attendee.fullName}
                    onChange={(e) =>
                      handleAttendeeChange(index, "fullName", e.target.value)
                    }
                    placeholder="Aarav Patel"
                    className="w-full bg-[#0b0f19] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={attendee.email}
                    onChange={(e) =>
                      handleAttendeeChange(index, "email", e.target.value)
                    }
                    placeholder="test@example.com"
                    className="w-full bg-[#0b0f19] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Mobile Phone *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={attendee.phone}
                    onChange={(e) =>
                      handleAttendeeChange(index, "phone", e.target.value)
                    }
                    placeholder="+1 (555) 382-9912"
                    className="w-full bg-[#0b0f19] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Emergency Contact & Guidelines */}
      <div className="space-y-3 pt-2">
        <label className="flex items-start gap-3 cursor-pointer select-none text-xs text-slate-300">
          <input
            type="checkbox"
            checked={termsAgreed}
            onChange={(e) => setTermsAgreed(e.target.checked)}
            className="mt-0.5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-400 focus:ring-offset-slate-900"
          />
          <span>
            I agree to the venue guidelines, security protocols, and acknowledge
            that all passes will be issued with tamper-proof HMAC SHA-256
            digital QR codes.
          </span>
        </label>

        {errors && (
          <div
            className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errors}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingForm;
