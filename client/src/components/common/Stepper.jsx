import React from "react";
import { Check } from "lucide-react";

export default function Stepper({
  currentStage = "In Heat",
  stages = [
    "In Heat",
    "Inseminated",
    "Confirmed Pregnant",
    "Dry Period",
    "Calved",
  ],
  onSelectStage,
}) {
  const currentIdx = stages.findIndex(
    (s) => s.toLowerCase() === (currentStage || "").toLowerCase(),
  );

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#DBE5E0] -translate-y-1/2 z-0" />
        {stages.map((stage, idx) => {
          const isCompleted = currentIdx > idx;
          const isCurrent = currentIdx === idx;

          return (
            <div
              key={stage}
              onClick={() => onSelectStage && onSelectStage(stage)}
              className={`relative z-10 flex flex-col items-center group ${
                onSelectStage ? "cursor-pointer" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  isCompleted
                    ? "bg-[#0D7A52] text-white"
                    : isCurrent
                      ? "bg-[#0D7A52] text-white ring-4 ring-[#E7F5EE]"
                      : "bg-white border-2 border-[#DBE5E0] text-[#6B7A73]"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <span
                className={`text-xs mt-2 font-medium transition ${
                  isCurrent
                    ? "text-[#0D7A52] font-semibold"
                    : isCompleted
                      ? "text-[#171F24]"
                      : "text-[#6B7A73]"
                }`}
              >
                {stage}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
