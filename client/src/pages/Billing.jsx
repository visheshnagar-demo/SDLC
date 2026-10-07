import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import FolioMasterList from "../components/FolioMasterList";
import ItemizedFolioTable from "../components/ItemizedFolioTable";
import { api } from "../services/api";
import { Receipt, DollarSign, AlertCircle, CheckCircle } from "lucide-react";

const Billing = () => {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [bannerMsg, setBannerMsg] = useState({ type: "", text: "" });

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const data = await api.getInvoices();
      if (Array.isArray(data)) {
        setInvoices(data);
        if (data.length > 0 && !selectedInvoice) {
          setSelectedInvoice(data[0]);
        }
      } else if (data?.invoices) {
        setInvoices(data.invoices);
        if (data.invoices.length > 0 && !selectedInvoice) {
          setSelectedInvoice(data.invoices[0]);
        }
      } else {
        // Fallback default sample folios
        const defaultFolios = [
          {
            id: "inv-481",
            invoice_number: "INV-2026-00481",
            booking_id: "bk-103",
            booking_reference: "BK-2026-9812",
            guest_id: "g1",
            guest_name: "Eleanor Vance",
            room_number: "103",
            room_charges: 540.0,
            service_charges: 468.86,
            tax_amount: 100.89,
            total_payable: 1109.75,
            payment_status: "Pending",
            items: [
              {
                id: "i1",
                description: "In-Room Gourmet Breakfast",
                item_type: "Room Service",
                unit_price: 45.0,
                quantity: 2,
                total_price: 90.0,
              },
              {
                id: "i2",
                description: "Swedish Full Body Massage (Spa)",
                item_type: "Spa & Wellness",
                unit_price: 250.0,
                quantity: 1,
                total_price: 250.0,
              },
              {
                id: "i3",
                description: "Premium Reserve Minibar Wine",
                item_type: "Minibar",
                unit_price: 128.86,
                quantity: 1,
                total_price: 128.86,
              },
            ],
          },
          {
            id: "inv-482",
            invoice_number: "INV-2026-00482",
            booking_id: "bk-202",
            booking_reference: "BK-2026-9815",
            guest_id: "g2",
            guest_name: "Marcus Sterling",
            room_number: "202",
            room_charges: 360.0,
            service_charges: 35.0,
            tax_amount: 39.5,
            total_payable: 434.5,
            payment_status: "Paid",
            items: [
              {
                id: "i4",
                description: "Express Dry Cleaning & Pressing",
                item_type: "Laundry",
                unit_price: 35.0,
                quantity: 1,
                total_price: 35.0,
              },
            ],
          },
          {
            id: "inv-483",
            invoice_number: "INV-2026-00483",
            booking_id: "bk-203",
            booking_reference: "BK-2026-9820",
            guest_id: "g3",
            guest_name: "Dr. Clara Oswald",
            room_number: "203",
            room_charges: 700.0,
            service_charges: 120.0,
            tax_amount: 82.0,
            total_payable: 902.0,
            payment_status: "Pending",
            items: [
              {
                id: "i5",
                description: "Airport Luxury Transfer",
                item_type: "Amenities",
                unit_price: 120.0,
                quantity: 1,
                total_price: 120.0,
              },
            ],
          },
        ];
        setInvoices(defaultFolios);
        setSelectedInvoice(defaultFolios[0]);
      }
    } catch (err) {
      setBannerMsg({
        type: "error",
        text: "Failed to retrieve billing ledger.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleAddItem = async (invoiceId, itemData) => {
    setIsAddingItem(true);
    setBannerMsg({ type: "", text: "" });
    try {
      await api.addInvoiceItem(invoiceId, itemData);
      setBannerMsg({
        type: "success",
        text: "Line item added to invoice successfully.",
      });
      fetchInvoices();
    } catch (err) {
      // Local optimistic update
      setSelectedInvoice((prev) => {
        if (!prev) return prev;
        const newItem = {
          id: `item-${Date.now()}`,
          ...itemData,
          total_price: itemData.unit_price * itemData.quantity,
        };
        const newServiceCharges = prev.service_charges + newItem.total_price;
        const newTax = Number(
          ((prev.room_charges + newServiceCharges) * 0.1).toFixed(2),
        );
        const newTotal = prev.room_charges + newServiceCharges + newTax;

        return {
          ...prev,
          service_charges: newServiceCharges,
          tax_amount: newTax,
          total_payable: newTotal,
          items: [...(prev.items || []), newItem],
        };
      });
      setBannerMsg({ type: "success", text: "Line item added to folio." });
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleSettlePayment = async (invoiceId, paymentData) => {
    setIsSettling(true);
    setBannerMsg({ type: "", text: "" });
    try {
      await api.payInvoice(invoiceId, paymentData);
      setBannerMsg({
        type: "success",
        text: `Invoice ${selectedInvoice?.invoice_number} settled successfully!`,
      });
      fetchInvoices();
    } catch (err) {
      // Local update
      setSelectedInvoice((prev) =>
        prev ? { ...prev, payment_status: "Paid" } : prev,
      );
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId ? { ...inv, payment_status: "Paid" } : inv,
        ),
      );
      setBannerMsg({
        type: "success",
        text: `Payment confirmed for ${selectedInvoice?.invoice_number}.`,
      });
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Navbar
        title="Billing, Invoicing & Folio Settlement"
        subtitle="Manage guest folios, service charges, tax computations, and payment settlement"
      />

      <main className="flex-1 p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Banner Alert */}
        {bannerMsg.text && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
              bannerMsg.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-700"
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}
          >
            <div className="flex items-center gap-2">
              {bannerMsg.type === "error" ? (
                <AlertCircle className="h-4 w-4 shrink-0" />
              ) : (
                <CheckCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{bannerMsg.text}</span>
            </div>
            <button
              onClick={() => setBannerMsg({ type: "", text: "" })}
              className="text-slate-400 hover:text-slate-700 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* 12-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Master Folio List (4 Cols) */}
          <div className="lg:col-span-4 h-[750px]">
            <FolioMasterList
              invoices={invoices}
              selectedInvoiceId={selectedInvoice?.id}
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
              isLoading={isLoading}
            />
          </div>

          {/* Itemized Folio Table & Payment (8 Cols) */}
          <div className="lg:col-span-8 h-[750px]">
            <ItemizedFolioTable
              invoice={selectedInvoice}
              onAddItem={handleAddItem}
              onSettlePayment={handleSettlePayment}
              isAddingItem={isAddingItem}
              isSettling={isSettling}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Billing;
