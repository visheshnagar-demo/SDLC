import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { billingApi } from "../../services/api.js";
import Badge from "../common/Badge.jsx";
import StatCard from "../common/StatCard.jsx";

export const BillingPortal = ({ onPaymentProcessed = () => {} }) => {
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState({
    id: "INV-5001",
    encounter_id: "ENC-99201",
    patient_name: "Jane Doe",
    mrn: "MRN-99201",
    payer: "BlueCross PPO",
    gross_total: 200.0,
    copay: 30.0,
    patient_balance: 170.0,
    status: "Unpaid",
    items: [
      {
        id: "item-1",
        description: "Specialist Consultation Fee (CPT: 99204)",
        amount: 150.0,
      },
      {
        id: "item-2",
        description: "Comprehensive Metabolic Panel CMP (CPT: 80053)",
        amount: 50.0,
      },
    ],
  });

  const [invoices, setInvoices] = useState([
    {
      id: "INV-5001",
      encounter_id: "ENC-99201",
      patient_name: "Jane Doe",
      mrn: "MRN-99201",
      payer: "BlueCross PPO",
      gross_total: 200.0,
      copay: 30.0,
      patient_balance: 170.0,
      status: "Unpaid",
      items: [
        {
          id: "item-1",
          description: "Specialist Consultation Fee (CPT: 99204)",
          amount: 150.0,
        },
        {
          id: "item-2",
          description: "Comprehensive Metabolic Panel CMP (CPT: 80053)",
          amount: 50.0,
        },
      ],
    },
    {
      id: "INV-5002",
      encounter_id: "ENC-84920",
      patient_name: "Marcus Vance",
      mrn: "MRN-84920",
      payer: "Aetna Signature",
      gross_total: 350.0,
      copay: 50.0,
      patient_balance: 300.0,
      status: "Paid",
      items: [
        {
          id: "item-3",
          description: "Cardiology Followup (CPT: 99214)",
          amount: 200.0,
        },
        {
          id: "item-4",
          description: "Echocardiogram (CPT: 93306)",
          amount: 150.0,
        },
      ],
    },
    {
      id: "INV-5003",
      encounter_id: "ENC-77102",
      patient_name: "Elena Rostova",
      mrn: "MRN-77102",
      payer: "UnitedHealthcare",
      gross_total: 120.0,
      copay: 20.0,
      patient_balance: 100.0,
      status: "Pending Insurance",
      items: [
        {
          id: "item-5",
          description: "Outpatient Triage (CPT: 99202)",
          amount: 120.0,
        },
      ],
    },
  ]);

  const [cardholderName, setCardholderName] = useState("Jane Doe");
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [expiry, setExpiry] = useState("08/28");
  const [cvv, setCvv] = useState("123");
  const [paymentMethod, setPaymentMethod] = useState("Credit / Debit Card");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesTab =
      activeTab === "All" ||
      (activeTab === "Unpaid" && inv.status === "Unpaid") ||
      (activeTab === "Paid" && inv.status === "Paid") ||
      (activeTab === "Pending Insurance" && inv.status === "Pending Insurance");

    const matchesSearch =
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.mrn.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        invoice_id: selectedInvoice.id,
        amount_paid: selectedInvoice.patient_balance,
        payment_method: paymentMethod,
        transaction_reference: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        cardholder_name: cardholderName,
      };

      const result = await billingApi.payInvoice(selectedInvoice.id, payload);

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === selectedInvoice.id
            ? { ...inv, status: "Paid", patient_balance: 0.0 }
            : inv,
        ),
      );

      setSelectedInvoice((prev) => ({
        ...prev,
        status: "Paid",
        patient_balance: 0.0,
      }));

      setSuccess(
        `Payment of $${selectedInvoice.patient_balance.toFixed(2)} processed successfully for ${selectedInvoice.id}!`,
      );
      onPaymentProcessed(result);
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        err.message ||
        "Payment processing failed. Please verify card details.";
      setError(
        typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Outstanding"
          value="$24,850"
          change="-3.4%"
          icon={DollarSign}
        />
        <StatCard
          label="Settled This Month"
          value="$86,400"
          change="+12.8%"
          icon={CheckCircle2}
        />
        <StatCard
          label="Pending Insurance Claims"
          value="14"
          subtext="In adjudication"
          icon={FileText}
        />
        <StatCard
          label="Overdue Invoices"
          value="3"
          subtext="Action required"
          icon={AlertCircle}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-xs text-rose-800"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Billing / Payment Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div
          role="alert"
          className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 text-xs text-emerald-800"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Payment Completed</p>
            <p>{success}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Invoices Table + Detail/Payment Form */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Invoices List */}
        <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              {["All", "Unpaid", "Paid", "Pending Insurance"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    activeTab === tab
                      ? "bg-white text-teal-800 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Invoice ID or MRN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-48"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Invoice ID</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Copay</th>
                  <th className="p-3">Balance</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const isSelected = selectedInvoice?.id === inv.id;
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-teal-50/70 border-l-4 border-teal-600"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="p-3 font-bold text-slate-900">{inv.id}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">
                          {inv.patient_name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {inv.mrn}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-slate-700">
                        ${inv.gross_total.toFixed(2)}
                      </td>
                      <td className="p-3 font-mono text-emerald-600">
                        -${inv.copay.toFixed(2)}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900">
                        ${inv.patient_balance.toFixed(2)}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            inv.status === "Paid"
                              ? "success"
                              : inv.status === "Unpaid"
                                ? "warning"
                                : "info"
                          }
                        >
                          {inv.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Itemization & Payment Processing */}
        <div className="lg:col-span-2 space-y-6">
          {selectedInvoice && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Invoice #{selectedInvoice.id} Details
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Patient: {selectedInvoice.patient_name} |{" "}
                    {selectedInvoice.mrn}
                  </p>
                </div>
                <Badge
                  variant={
                    selectedInvoice.status === "Paid"
                      ? "success"
                      : selectedInvoice.status === "Unpaid"
                        ? "warning"
                        : "info"
                  }
                >
                  {selectedInvoice.status}
                </Badge>
              </div>

              {/* Itemized Line Items */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Itemized CPT Services
                </span>
                <div className="space-y-1.5 text-xs">
                  {selectedInvoice.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-slate-700"
                    >
                      <span>{item.description}</span>
                      <span className="font-mono font-semibold">
                        ${item.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation breakdown */}
              <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Clinical Charges:</span>
                  <span className="font-mono">
                    ${selectedInvoice.gross_total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>
                    Insurance Copay Applied ({selectedInvoice.payer}):
                  </span>
                  <span className="font-mono">
                    -${selectedInvoice.copay.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-100 pt-2">
                  <span>Net Patient Balance:</span>
                  <span className="font-mono text-teal-700">
                    ${selectedInvoice.patient_balance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Form */}
          {selectedInvoice && selectedInvoice.status !== "Paid" ? (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                <CreditCard className="w-4 h-4 text-teal-600" />
                <span>Process Patient Payment</span>
              </div>

              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                {[
                  "Credit / Debit Card",
                  "Bank Transfer",
                  "Insurance Claim",
                ].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`flex-1 py-1 text-center rounded transition-all text-[11px] ${
                      paymentMethod === m
                        ? "bg-white text-teal-800 shadow-sm font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <form onSubmit={handleProcessPayment} className="space-y-3">
                <div>
                  <label
                    htmlFor="cardholder_name_input"
                    className="block text-xs font-semibold text-slate-600 mb-1"
                  >
                    Cardholder Name
                  </label>
                  <input
                    id="cardholder_name_input"
                    type="text"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    required
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="card_number_input"
                    className="block text-xs font-semibold text-slate-600 mb-1"
                  >
                    Card Number
                  </label>
                  <input
                    id="card_number_input"
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    required
                    className="w-full p-2 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="card_expiry_input"
                      className="block text-xs font-semibold text-slate-600 mb-1"
                    >
                      Expiry (MM/YY)
                    </label>
                    <input
                      id="card_expiry_input"
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      required
                      className="w-full p-2 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="card_cvv_input"
                      className="block text-xs font-semibold text-slate-600 mb-1"
                    >
                      CVV
                    </label>
                    <input
                      id="card_cvv_input"
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      required
                      className="w-full p-2 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Authorizing Payment...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        Process Payment ($
                        {selectedInvoice.patient_balance.toFixed(2)})
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-emerald-900 uppercase">
                Invoice Fully Settled
              </h4>
              <p className="text-xs text-emerald-700 mt-1">
                Zero outstanding patient balance remains for Invoice #
                {selectedInvoice?.id}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

BillingPortal.propTypes = {
  onPaymentProcessed: PropTypes.func,
};

export default BillingPortal;
