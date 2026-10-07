import React, { useState } from "react";
import { Search, Receipt, CheckCircle, Clock, AlertCircle } from "lucide-react";

const statusBadge = {
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Refunded: "bg-rose-50 text-rose-700 border-rose-200",
};

const FolioMasterList = ({
  invoices = [],
  selectedInvoiceId,
  onSelectInvoice,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredInvoices = invoices.filter((inv) => {
    const invNum = inv.invoice_number || inv.id || "";
    const guestName = inv.guest_name || inv.guest?.full_name || "";
    const roomNum = inv.room_number || inv.booking?.room?.room_number || "";

    const matchesSearch =
      invNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(roomNum).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      (inv.payment_status &&
        inv.payment_status.toLowerCase() === statusFilter.toLowerCase());

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Search and Filters */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Receipt className="h-4 w-4 text-blue-600" />
            <span>Master Folios ({filteredInvoices.length})</span>
          </h3>
          <span className="text-[11px] font-semibold text-slate-500">
            Live Accounts
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice #, guest, room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-1 text-[11px]">
          {["All", "Pending", "Paid", "Refunded"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`flex-1 py-1 rounded font-medium transition-colors ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Folio Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Loading master folios...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No folios found.
          </div>
        ) : (
          filteredInvoices.map((inv) => {
            const isSelected = selectedInvoiceId === inv.id;
            const status = inv.payment_status || "Pending";
            const badgeClass = statusBadge[status] || statusBadge.Pending;
            const guestName =
              inv.guest_name || inv.guest?.full_name || "Guest Folio";
            const roomNum =
              inv.room_number || inv.booking?.room?.room_number || "Room TBD";
            const total = Number(
              inv.total_payable || inv.total_amount || 0,
            ).toFixed(2);

            return (
              <button
                key={inv.id}
                type="button"
                onClick={() => onSelectInvoice && onSelectInvoice(inv)}
                className={`w-full p-4 text-left transition-all ${
                  isSelected
                    ? "bg-blue-50/80 border-l-4 border-l-blue-600 shadow-xs"
                    : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900">
                    {inv.invoice_number || `INV-${inv.id?.slice(0, 8)}`}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}
                  >
                    {status}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-700">
                  {guestName}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                  <span>Room {roomNum}</span>
                  <span className="font-extrabold text-slate-900 text-xs">
                    ${total}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FolioMasterList;
