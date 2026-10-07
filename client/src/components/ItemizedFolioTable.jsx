import React, { useState } from "react";
import {
  Receipt,
  PlusCircle,
  CreditCard,
  DollarSign,
  CheckCircle2,
  Clock,
  Printer,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";

const statusBadge = {
  Paid: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Pending: "bg-amber-100 text-amber-800 border-amber-300",
  Refunded: "bg-rose-100 text-rose-800 border-rose-300",
};

const ItemizedFolioTable = ({
  invoice,
  onAddItem,
  onSettlePayment,
  isAddingItem = false,
  isSettling = false,
}) => {
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [itemDescription, setItemDescription] = useState("");
  const [itemType, setItemType] = useState("Room Service");
  const [unitPrice, setUnitPrice] = useState(25.0);
  const [quantity, setQuantity] = useState(1);

  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  if (!invoice) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-12 text-center text-slate-400 flex flex-col items-center justify-center h-full">
        <Receipt className="h-12 w-12 text-slate-300 mb-3" />
        <h3 className="text-base font-bold text-slate-700">
          No Folio Selected
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Please select an invoice from the Master Folios list on the left to
          view itemized accounting and process settlement.
        </p>
      </div>
    );
  }

  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const roomCharges = Number(invoice.room_charges || 0);
  const serviceCharges = Number(invoice.service_charges || 0);
  const taxAmount = Number(invoice.tax_amount || 0);
  const totalPayable = Number(
    invoice.total_payable || invoice.total_amount || 0,
  );
  const isPaid = invoice.payment_status?.toLowerCase() === "paid";

  const handleAddItemSubmit = async (e) => {
    e.preventDefault();
    setActionError("");
    setActionSuccess("");
    try {
      await onAddItem(invoice.id, {
        description: itemDescription,
        item_type: itemType,
        unit_price: Number(unitPrice),
        quantity: Number(quantity),
      });
      setShowAddItemModal(false);
      setItemDescription("");
      setUnitPrice(25.0);
      setQuantity(1);
      setActionSuccess("Service item added to folio successfully.");
    } catch (err) {
      setActionError(
        err.response?.data?.detail || err.message || "Failed to add line item.",
      );
    }
  };

  const handleSettleSubmit = async () => {
    setActionError("");
    setActionSuccess("");
    try {
      await onSettlePayment(invoice.id, {
        payment_method: paymentMethod,
        amount_paid: totalPayable,
      });
      setActionSuccess("Folio successfully settled and marked as Paid.");
    } catch (err) {
      setActionError(
        err.response?.data?.detail ||
          err.message ||
          "Settlement failed. Please try again.",
      );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Folio Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold text-slate-900">
                {invoice.invoice_number || `INV-${invoice.id?.slice(0, 8)}`}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  statusBadge[invoice.payment_status] || statusBadge.Pending
                }`}
              >
                {invoice.payment_status || "Pending"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Guest:{" "}
              <span className="font-semibold text-slate-800">
                {invoice.guest_name || invoice.guest?.full_name || "Guest"}
              </span>{" "}
              • Booking Ref:{" "}
              <span className="font-mono font-medium text-slate-700">
                {invoice.booking_reference ||
                  invoice.booking?.booking_reference ||
                  "BK-REG"}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isPaid && (
              <button
                type="button"
                onClick={() => setShowAddItemModal(true)}
                className="px-3 py-1.5 rounded-lg border border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>+ Add Service Item</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              title="Print Folio"
            >
              <Printer className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {actionError && (
        <div className="m-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700 font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="m-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-700 font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Itemized Table */}
      <div className="flex-1 overflow-y-auto p-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Itemized Statement
        </h4>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {/* Base Room Charge Row */}
              <tr className="bg-slate-50/30">
                <td className="px-4 py-3 font-semibold text-slate-900">
                  Room Stay & Accommodation Tariff
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-semibold">
                    Room Fee
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  ${roomCharges.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right">1</td>
                <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono">
                  ${roomCharges.toFixed(2)}
                </td>
              </tr>

              {/* Service Line Items */}
              {items.map((it, idx) => {
                const total = Number(
                  it.total_price || it.unit_price * it.quantity,
                ).toFixed(2);
                return (
                  <tr key={it.id || idx}>
                    <td className="px-4 py-3 text-slate-800">
                      {it.description}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">
                        {it.item_type || "Service"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      ${Number(it.unit_price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">{it.quantity || 1}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono">
                      ${total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Ledger Summary Calculation */}
        <div className="mt-6 flex justify-end">
          <div className="w-72 bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Room Charges:</span>
              <span className="font-mono font-semibold">
                ${roomCharges.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Additional Services:</span>
              <span className="font-mono font-semibold">
                ${serviceCharges.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Occupancy Tax (10%):</span>
              <span className="font-mono font-semibold">
                ${taxAmount.toFixed(2)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
              <span>Total Payable:</span>
              <span className="font-mono text-blue-600">
                ${totalPayable.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Settlement Section */}
      <div className="p-6 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {isPaid ? (
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold bg-emerald-100/70 px-4 py-2 rounded-lg border border-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Folio Fully Settled & Reconciled</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-slate-500" />
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500"
              >
                <option value="Credit Card">Credit Card (Terminal)</option>
                <option value="Cash">Cash (Front Desk)</option>
                <option value="Digital Wallet">Apple Pay / Google Pay</option>
                <option value="Corporate Account">
                  Corporate Master Billing
                </option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleSettleSubmit}
              disabled={isSettling}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {isSettling
                  ? "Processing..."
                  : `Settle Folio ($${totalPayable.toFixed(2)})`}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Add Line Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-full max-w-md">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Add Extra Service Line Item
            </h3>
            <form onSubmit={handleAddItemSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. In-Room Dining, Spa Massage, Airport Shuttle..."
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Service Type
                  </label>
                  <select
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Room Service">Room Service</option>
                    <option value="Spa & Wellness">Spa & Wellness</option>
                    <option value="Minibar">Minibar</option>
                    <option value="Laundry">Laundry</option>
                    <option value="Amenities">Extra Amenities</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Unit Price ($)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {isAddingItem ? "Adding..." : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemizedFolioTable;
