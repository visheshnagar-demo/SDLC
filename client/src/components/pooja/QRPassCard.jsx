import React from "react";
import {
  QrCode,
  Printer,
  CheckCircle,
  Sparkles,
  User,
  Calendar,
  MapPin,
} from "lucide-react";

export default function QRPassCard({ booking }) {
  if (!booking) return null;

  return (
    <div className="bg-amber-50/90 rounded-2xl shadow-xl border-2 border-amber-600 p-6 max-w-md mx-auto relative overflow-hidden">
      <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-200 rounded-full opacity-30 pointer-events-none" />

      <div className="text-center border-b-2 border-orange-200 pb-4 mb-4">
        <div className="inline-flex p-2 bg-orange-700 text-white rounded-full mb-2">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-serif font-bold text-orange-950">
          Ganesh Temple Seva Pass
        </h3>
        <p className="text-xs text-orange-800 font-medium">
          Sacred Sankalpa & QR Entry Token
        </p>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-orange-200">
          <span className="text-xs text-orange-700 font-semibold uppercase">
            Booking Ref:
          </span>
          <span className="font-mono font-bold text-orange-900">
            {booking.booking_number || booking.id}
          </span>
        </div>

        <div className="space-y-1.5 text-xs text-orange-900">
          <div className="flex items-center justify-between">
            <span className="text-orange-700 font-medium">Devotee:</span>
            <span className="font-bold">
              {booking.sankalp_name || booking.devotee_name || "Ramesh Sharma"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-orange-700 font-medium">Gotra / Rashi:</span>
            <span className="font-bold">
              {booking.sankalp_gotra || "Kashyapa"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-orange-700 font-medium">Pooja Seva:</span>
            <span className="font-bold text-orange-800">
              {booking.pooja_name || "Mahaganapati Homa"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-orange-700 font-medium">Amount Paid:</span>
            <span className="font-bold text-green-700">
              ₹{booking.amount_paid || 501}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-orange-200 flex flex-col items-center justify-center my-4">
          <div className="bg-amber-100 p-3 rounded-lg border border-orange-300">
            <QrCode className="w-28 h-28 text-orange-900" />
          </div>
          <span className="text-[10px] font-mono text-orange-700 mt-2 font-semibold">
            Token: {booking.qr_code_token || "GT-2026-X89F2"}
          </span>
          <span className="text-xs text-green-700 font-bold flex items-center mt-1">
            <CheckCircle className="w-3.5 h-3.5 mr-1" /> VERIFIED PASS
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-orange-200 pt-4 text-xs text-orange-800">
        <button
          onClick={() => window.print()}
          className="flex items-center px-4 py-2 bg-orange-700 hover:bg-orange-800 text-white font-medium rounded-lg shadow transition-colors w-full justify-center"
        >
          <Printer className="w-4 h-4 mr-1.5" /> Print Seva Receipt
        </button>
      </div>
    </div>
  );
}
