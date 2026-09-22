import React from "react";
import { Check, Plane, KeyRound } from "lucide-react";

export const OrderLifecycleStepper = ({ order }) => {
  const stages = [
    {
      key: "PENDING_VERIFICATION",
      title: "Pending Verification",
      detail: "Master Watchmaker & Movement Chronometry Inspection Completed",
    },
    {
      key: "PACKAGING",
      title: "Atelier Security Vault Packaging",
      detail:
        "Tamper-proof argon micro-seal and secure presentation box applied",
    },
    {
      key: "COURIER_DISPATCH",
      title: "Insured Courier Dispatch",
      detail: `${order?.courier_name || "Ferrari Group Armored Logistics"} · Flight / Manifest ${order?.tracking_number || "FG-709 (Geneva → New York)"}`,
    },
    {
      key: "OUT_FOR_DELIVERY",
      title: "Out for Delivery (Dual-Officer Escort)",
      detail: "Armed courier in transit to verified delivery address",
    },
    {
      key: "DELIVERED",
      title: "Handover Verified & Escrow Released",
      detail:
        "Physical authentication confirmed via PIN and signed handover receipt",
    },
  ];

  const statusMap = {
    PENDING_VERIFICATION: 0,
    PACKAGING: 1,
    COURIER_DISPATCH: 2,
    OUT_FOR_DELIVERY: 3,
    DELIVERED: 4,
  };

  const currentStep = statusMap[order?.fulfillment_status] ?? 2; // default to stage 2 if in-transit demo

  return (
    <div className="bg-[#181B22] p-6 rounded-xl border border-[#232733] space-y-8 shadow-md">
      <div className="flex justify-between items-center border-b border-[#232733] pb-4">
        <div>
          <span className="text-xs uppercase font-mono tracking-wider text-[#9EACB9]">
            Fulfillment Lifecycle
          </span>
          <h2 className="font-serif text-xl font-bold text-[#F8F9FA]">
            Order #
            {order?.order_number || order?.id?.slice(0, 8) || "ORD-99281-CH"}
          </h2>
        </div>
        <span className="bg-[#D4AF37]/20 border border-[#D4AF37] text-[#F2CA50] text-xs font-bold px-3 py-1 rounded font-mono uppercase tracking-wider">
          {order?.fulfillment_status?.replace(/_/g, " ") ||
            "IN-TRANSIT · FG-709"}
        </span>
      </div>

      {/* Stepper Timeline */}
      <div className="space-y-6">
        {stages.map((stage, idx) => {
          const isPassed = idx < currentStep;
          const isCurrent = idx === currentStep;
          const isFuture = idx > currentStep;

          return (
            <div
              key={stage.key}
              className={`flex items-start gap-4 transition-opacity ${
                isFuture ? "opacity-40" : "opacity-100"
              }`}
            >
              {/* Step Icon */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-md ${
                  isPassed
                    ? "bg-emerald-500 text-black"
                    : isCurrent
                      ? "bg-[#D4AF37] text-[#0A0B0E] animate-pulse ring-4 ring-[#D4AF37]/20"
                      : "bg-[#232733] text-[#9EACB9]"
                }`}
              >
                {isPassed ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : isCurrent ? (
                  <Plane className="w-4 h-4" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Step Info */}
              <div className="space-y-0.5">
                <div
                  className={`font-semibold text-sm ${
                    isCurrent ? "text-[#F2CA50]" : "text-[#F8F9FA]"
                  }`}
                >
                  {stage.title}
                  {isCurrent && (
                    <span className="ml-2 text-[10px] uppercase font-mono text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                      Active Stage
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#9EACB9] leading-relaxed">
                  {stage.detail}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Handover Verification PIN */}
      <div className="bg-[#12141A] border border-[#D4AF37]/40 p-5 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="text-xs uppercase tracking-wider text-[#9EACB9] flex items-center gap-1.5 justify-center sm:justify-start">
            <KeyRound className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Armed Courier Handover Verification PIN</span>
          </div>
          <div className="text-3xl font-mono font-bold text-[#F2CA50] tracking-widest">
            {order?.handover_pin || "8 4 9 2"}
          </div>
          <div className="text-[11px] text-[#9EACB9]">
            Present this 4-digit PIN to the courier officer upon physical
            delivery to complete transfer.
          </div>
        </div>

        <div className="text-xs text-[#D4AF37] border border-[#4D4635] bg-[#181B22] px-3.5 py-2 rounded-lg text-center font-mono">
          Courier: {order?.courier_name || "Ferrari Group Armored"}
          <br />
          Tracking: {order?.tracking_number || "FG-709882-GEN"}
        </div>
      </div>
    </div>
  );
};

export default OrderLifecycleStepper;
