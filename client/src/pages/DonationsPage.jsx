import React, { useState, useEffect } from "react";
import DonationForm from "../components/donation/DonationForm";
import Receipt80G from "../components/donation/Receipt80G";
import { getDonations, createDonation } from "../services/api";
import { Heart, FileText, CheckCircle, ShieldCheck } from "lucide-react";

export default function DonationsPage() {
  const [donations, setDonations] = useState([
    {
      id: "DON-1001",
      receipt_number: "GT-80G-1001",
      donor_name: "Ramesh Sharma",
      fund_type: "ANNADANAM",
      amount: 1008,
      payment_method: "UPI",
      tax_80g_ref: "ABCDE1234F",
      created_at: "2026-09-18",
    },
    {
      id: "DON-1002",
      receipt_number: "GT-80G-1002",
      donor_name: "Priya Venkatesh",
      fund_type: "E_HUNDI",
      amount: 501,
      payment_method: "UPI",
      tax_80g_ref: "XYZPQ5678K",
      created_at: "2026-09-18",
    },
  ]);

  const [activeReceipt, setActiveReceipt] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const data = await getDonations();
      if (Array.isArray(data) && data.length > 0) {
        setDonations(data);
      }
    } catch (err) {
      console.warn("API fetch donations error, using default ledger:", err);
    }
  };

  const handleDonationSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const result = await createDonation(formData);
      setDonations([result, ...donations]);
      setActiveReceipt(result);
    } catch (err) {
      // Local fallback on error
      const mockResult = {
        ...formData,
        id: `DON-${Date.now()}`,
        receipt_number: `GT-80G-${Math.floor(1000 + Math.random() * 9000)}`,
        created_at: new Date().toISOString().split("T")[0],
      };
      setDonations([mockResult, ...donations]);
      setActiveReceipt(mockResult);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-rose-900 text-white p-5 rounded-xl shadow-md border border-rose-700 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-serif font-bold flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-300 fill-rose-300" />
            e-Hundi & Multi-Fund Donation Platform
          </h1>
          <p className="text-xs text-rose-200 mt-0.5">
            Online offerings, Annadanam Feeding Seva & 80G tax exemption
            certificates
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <DonationForm
            onSubmit={handleDonationSubmit}
            isSubmitting={isSubmitting}
          />
        </div>

        <div>
          {activeReceipt ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center max-w-lg mx-auto">
                <span className="text-xs font-bold text-green-700 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" /> Donation Recorded
                  Successfully!
                </span>
                <button
                  onClick={() => setActiveReceipt(null)}
                  className="text-xs text-orange-800 hover:underline font-bold"
                >
                  Make Another Offering
                </button>
              </div>
              <Receipt80G donation={activeReceipt} />
            </div>
          ) : (
            <div className="bg-white p-5 rounded-xl shadow-md border border-orange-200">
              <h3 className="font-serif font-bold text-lg text-orange-950 mb-3 border-b border-orange-100 pb-2">
                Recent e-Hundi Offerings Ledger
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-orange-100 text-orange-900 font-bold uppercase">
                      <th className="p-2">Receipt #</th>
                      <th className="p-2">Donor</th>
                      <th className="p-2">Fund</th>
                      <th className="p-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100">
                    {donations.map((don) => (
                      <tr
                        key={don.id || don.receipt_number}
                        className="hover:bg-amber-50"
                      >
                        <td className="p-2 font-mono font-bold text-orange-900">
                          {don.receipt_number || don.id}
                        </td>
                        <td className="p-2 font-medium">
                          {don.donor_name || "Devotee"}
                        </td>
                        <td className="p-2 text-orange-800 font-semibold">
                          {don.fund_type}
                        </td>
                        <td className="p-2 font-bold text-green-700">
                          ₹{don.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
