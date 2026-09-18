import React from "react";
import {
  Award,
  Download,
  CheckCircle2,
  ShieldAlert,
  FileCheck,
} from "lucide-react";

export default function Receipt80G({ donation }) {
  if (!donation) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-orange-300 p-6 max-w-lg mx-auto font-sans relative">
      <div className="border-4 border-double border-orange-800 p-4 rounded-xl">
        <div className="text-center border-b border-orange-200 pb-3 mb-3">
          <div className="flex justify-center mb-1">
            <Award className="w-8 h-8 text-orange-700" />
          </div>
          <h2 className="text-lg font-serif font-bold text-orange-950 uppercase">
            Siddhivinayak Ganesh Temple Trust
          </h2>
          <p className="text-[11px] text-orange-800">
            Regd Trust No. E-10294 • 80G Reg: CIT(E)/80G/2022-23/A-1029
          </p>
          <span className="inline-block bg-orange-100 text-orange-900 text-[10px] font-bold px-2 py-0.5 rounded mt-1">
            Form 10BE Tax Exemption Certificate
          </span>
        </div>

        <div className="space-y-2.5 text-xs text-orange-950">
          <div className="flex justify-between items-center bg-amber-50 p-2 rounded border border-orange-100 font-mono">
            <span className="font-semibold text-orange-800">Receipt No:</span>
            <span className="font-bold text-orange-900">
              {donation.receipt_number || donation.id}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-orange-600 block text-[10px] uppercase font-semibold">
                Donor Name
              </span>
              <span className="font-bold">
                {donation.donor_name || "Devotee Donor"}
              </span>
            </div>
            <div>
              <span className="text-orange-600 block text-[10px] uppercase font-semibold">
                PAN Reference
              </span>
              <span className="font-bold font-mono">
                {donation.tax_80g_ref || "ABCDE1234F"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-orange-600 block text-[10px] uppercase font-semibold">
                Fund Category
              </span>
              <span className="font-bold text-orange-800">
                {donation.fund_type || "General e-Hundi"}
              </span>
            </div>
            <div>
              <span className="text-orange-600 block text-[10px] uppercase font-semibold">
                Payment Mode
              </span>
              <span className="font-bold">
                {donation.payment_method || "UPI"}
              </span>
            </div>
          </div>

          <div className="bg-orange-50 p-2.5 rounded-lg border border-orange-200 flex justify-between items-center my-2">
            <span className="font-semibold text-orange-900">
              Total Contribution:
            </span>
            <span className="text-lg font-bold text-green-700">
              ₹{donation.amount || 501}
            </span>
          </div>

          <p className="text-[10px] text-orange-700 italic text-center">
            "Donations to Siddhivinayak Temple Trust are eligible for 50% tax
            deduction under Section 80G of IT Act, 1961."
          </p>
        </div>

        <div className="border-t border-orange-200 pt-3 mt-3 flex items-center justify-between text-[10px] text-orange-800">
          <div className="flex items-center text-green-700 font-bold">
            <FileCheck className="w-3.5 h-3.5 mr-1" /> Digitally Signed
          </div>
          <div className="text-right">
            <div className="font-serif font-bold text-orange-900">
              Managing Trustee
            </div>
            <div className="text-[9px] text-orange-600">
              Ganesh Temple Trust
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => window.print()}
        className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-orange-800 hover:bg-orange-900 text-white font-bold rounded-lg text-xs shadow transition-colors"
      >
        <Download className="w-4 h-4 mr-1.5" /> Download Tax Receipt PDF
      </button>
    </div>
  );
}
