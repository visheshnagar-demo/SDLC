import React from "react";
import { Award, CheckCircle2, FileCheck } from "lucide-react";

export const ConditionScorecard = ({ watch }) => {
  const score = watch?.condition_score || 9.8;
  const grade = watch?.condition_grade || "MINT";

  const metrics = [
    {
      name: "Case & Lugs",
      rating: "9.9 / 10",
      notes: "Original factory chamfers intact; zero polishing softening",
    },
    {
      name: "Bezel & Sapphire Crystal",
      rating: "10.0 / 10",
      notes: "Flawless ceramic Cerachrom insert; scratch-free cyclops lens",
    },
    {
      name: "Acoustic Movement Timing",
      rating: "+1.2 s/d",
      notes: "305° balance amplitude · 0.1ms beat error (COSC / METAS spec)",
    },
    {
      name: "Dial & Luminescence",
      rating: "9.8 / 10",
      notes: "Pristine hour markers with vivid uniform glow response",
    },
    {
      name: "Oyster Bracelet & Clasp",
      rating: "9.7 / 10",
      notes: "Zero link stretch; Glidelock extension mechanism firm and crisp",
    },
  ];

  return (
    <div className="bg-[#181B22] border border-[#232733] p-5 rounded-xl space-y-4 shadow-md">
      <div className="flex justify-between items-center border-b border-[#232733] pb-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-[#D4AF37]" />
          <span className="text-sm font-serif font-bold text-[#F8F9FA]">
            Atelier Condition Scorecard
          </span>
        </div>
        <span className="bg-[#D4AF37]/20 border border-[#D4AF37] text-[#F2CA50] text-xs font-mono font-bold px-2.5 py-1 rounded">
          {score} / 10 {grade}
        </span>
      </div>

      {/* Metrics Checklist */}
      <div className="space-y-2.5 text-xs">
        {metrics.map((m) => (
          <div
            key={m.name}
            className="flex items-start justify-between gap-2 border-b border-[#232733]/50 pb-2 last:border-0"
          >
            <div>
              <div className="font-semibold text-[#F8F9FA] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{m.name}</span>
              </div>
              <div className="text-[11px] text-[#9EACB9] pl-5 mt-0.5">
                {m.notes}
              </div>
            </div>
            <span className="font-mono font-bold text-[#F2CA50] shrink-0 text-right">
              {m.rating}
            </span>
          </div>
        ))}
      </div>

      {/* Authenticator Sign-off */}
      <div className="pt-2 border-t border-[#232733] text-[11px] text-[#9EACB9] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <FileCheck className="w-4 h-4 text-[#D4AF37]" />
          <span>
            Inspected by:{" "}
            <strong className="text-[#F8F9FA]">
              M. Horloger Laurent, Geneva
            </strong>
          </span>
        </div>
        <span className="font-mono text-[#D4AF37]">
          {watch?.certificate_number
            ? `#${watch.certificate_number}`
            : "#CERT-99281"}
        </span>
      </div>
    </div>
  );
};

export default ConditionScorecard;
