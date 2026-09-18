import React from "react";
import { Clock, Users, Lock, CheckCircle2 } from "lucide-react";

export default function SlotMatrix({
  slots = [],
  selectedSlot,
  onSelectSlot,
  poojaName,
}) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-orange-200 overflow-hidden">
      <div className="p-4 bg-amber-50 border-b border-orange-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-orange-700" />
          <h3 className="text-lg font-serif font-bold text-orange-950">
            Available Slots: {poojaName || "Select Pooja First"}
          </h3>
        </div>
        <div className="flex items-center text-xs text-orange-700 bg-orange-100 px-2.5 py-1 rounded-full">
          <Lock className="w-3 h-3 mr-1" />
          Pessimistic Slot Locking Enabled
        </div>
      </div>

      <div className="p-4">
        {slots.length === 0 ? (
          <div className="py-8 text-center text-orange-600/80 font-medium">
            No time slots currently available for this selection.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {slots.map((slot) => {
              const booked = slot.booked_count || 0;
              const cap = slot.capacity || 20;
              const isFull = booked >= cap;
              const isSelected = selectedSlot?.id === slot.id;

              return (
                <div
                  key={slot.id}
                  onClick={() => !isFull && onSelectSlot(slot)}
                  className={`p-3.5 rounded-lg border flex flex-col justify-between transition-all ${
                    isFull
                      ? "bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed"
                      : isSelected
                        ? "bg-orange-600 text-white border-orange-700 shadow-md ring-2 ring-orange-400 cursor-pointer"
                        : "bg-amber-50/50 hover:bg-amber-100 border-orange-200 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        isSelected
                          ? "bg-orange-800 text-amber-100"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {slot.slot_date || "Today"}
                    </span>
                    <span className="text-xs font-mono font-bold">
                      {slot.start_time} - {slot.end_time}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs mt-1">
                    <div className="flex items-center">
                      <Users className="w-3.5 h-3.5 mr-1" />
                      <span>
                        {booked} / {cap} booked
                      </span>
                    </div>

                    {isFull ? (
                      <span className="font-bold text-red-600 uppercase">
                        FULL
                      </span>
                    ) : isSelected ? (
                      <span className="flex items-center font-bold text-amber-200">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Selected
                      </span>
                    ) : (
                      <span className="font-semibold text-orange-700 hover:underline">
                        Select Slot
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
