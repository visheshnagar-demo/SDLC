import React from "react";
import {
  Clock,
  FileText,
  Pill,
  Activity,
  User,
  ChevronRight,
} from "lucide-react";
import Badge from "../common/Badge";

export const EHRTimeline = ({ records = [] }) => {
  const defaultHistory = [
    {
      id: "enc-2026-09",
      date: "2026-09-12",
      doctor: "Dr. Sarah Smith, MD",
      diagnosis: "I10 - Essential Hypertension",
      notes:
        "Initial elevated blood pressure reading (140/92). Advised 24-hr ambulatory monitoring.",
      prescriptions: [
        { medication: "Hydrochlorothiazide 12.5mg", frequency: "Daily" },
      ],
      vitals: "BP: 140/92, HR: 80, SpO2: 98%",
    },
    {
      id: "enc-2026-05",
      date: "2026-05-18",
      doctor: "Dr. Robert Davis, MD",
      diagnosis: "J06.9 - Acute Upper Respiratory Infection",
      notes: "Sore throat, mild fever for 3 days. Rapid strep negative.",
      prescriptions: [
        {
          medication: "Amoxicillin 500mg (Discontinued - Penicillin reaction)",
          frequency: "TID",
        },
      ],
      vitals: "BP: 118/76, HR: 74, Temp: 100.2F",
    },
  ];

  const list = records.length > 0 ? records : defaultHistory;

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <Clock className="w-4 h-4 text-sky-600" />
        <h3 className="text-sm font-bold text-slate-900">
          Patient Longitudinal Medical History
        </h3>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {list.map((item, idx) => (
          <div key={item.id || idx} className="relative group">
            {/* Timeline Dot */}
            <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-sky-600 border-2 border-white shadow-sm" />

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 hover:border-sky-300 transition-colors">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">
                    {item.date}
                  </span>
                  <span className="text-xs text-slate-400">&bull;</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {item.doctor}
                  </span>
                </div>
                <Badge variant="primary">{item.diagnosis}</Badge>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {item.notes || item.clinical_notes}
              </p>

              {item.vitals && (
                <div className="text-[11px] font-mono text-slate-500 bg-white px-2.5 py-1 rounded border border-slate-200 inline-block">
                  {item.vitals}
                </div>
              )}

              {item.prescriptions && item.prescriptions.length > 0 && (
                <div className="pt-1 flex flex-wrap gap-1.5">
                  {item.prescriptions.map((rx, rIdx) => (
                    <span
                      key={rIdx}
                      className="inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200"
                    >
                      <Pill className="w-3 h-3" />
                      {typeof rx === "string"
                        ? rx
                        : `${rx.medication} (${rx.frequency})`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EHRTimeline;
