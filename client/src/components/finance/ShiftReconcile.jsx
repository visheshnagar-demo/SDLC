import React, { useState } from "react";
import {
  Landmark,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
} from "lucide-react";

export default function ShiftReconcile({
  activeShift,
  onOpenShift,
  onCloseShift,
  isSubmitting,
}) {
  const [openingCash, setOpeningCash] = useState("2000");
  const [counterNumber, setCounterNumber] = useState(
    "Counter #1 (Main Temple Gate)",
  );

  // Denomination counter state
  const [denominations, setDenominations] = useState({
    500: 10,
    200: 10,
    100: 20,
    50: 10,
    20: 10,
    10: 10,
    coins: 50,
  });

  const calculateActualCash = () => {
    return (
      (denominations[500] || 0) * 500 +
      (denominations[200] || 0) * 200 +
      (denominations[100] || 0) * 100 +
      (denominations[50] || 0) * 50 +
      (denominations[20] || 0) * 20 +
      (denominations[10] || 0) * 10 +
      (denominations["coins"] || 0) * 1
    );
  };

  const actualCash = calculateActualCash();
  const systemCalculated = activeShift?.system_calculated || 8050;
  const variance = actualCash - systemCalculated;

  const handleDenomChange = (denom, val) => {
    setDenominations({ ...denominations, [denom]: parseInt(val) || 0 });
  };

  const handleOpen = (e) => {
    e.preventDefault();
    onOpenShift({
      counter_number: counterNumber,
      opening_cash: parseFloat(openingCash) || 0,
    });
  };

  const handleClose = (e) => {
    e.preventDefault();
    onCloseShift({
      closing_cash_actual: actualCash,
      system_calculated: systemCalculated,
      variance: variance,
    });
  };

  if (!activeShift) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-orange-200 p-6 max-w-lg mx-auto">
        <div className="flex items-center space-x-3 text-orange-950 mb-4 border-b border-orange-100 pb-3">
          <div className="p-2.5 bg-orange-100 rounded-lg text-orange-800">
            <Unlock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg">
              Open Cashier Shift Counter
            </h3>
            <p className="text-xs text-orange-700">
              Initialize counter opening float balance
            </p>
          </div>
        </div>

        <form onSubmit={handleOpen} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-orange-900 uppercase tracking-wider mb-1">
              Counter Station
            </label>
            <input
              type="text"
              value={counterNumber}
              onChange={(e) => setCounterNumber(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-orange-900 uppercase tracking-wider mb-1">
              Opening Cash Drawer Float (₹)
            </label>
            <input
              type="number"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-orange-700 hover:bg-orange-800 text-white font-bold rounded-lg text-sm shadow transition-colors"
          >
            {isSubmitting ? "Initializing..." : "Open Shift Counter"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-orange-200 overflow-hidden">
      <div className="p-5 bg-amber-50 border-b border-orange-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-700 text-white rounded-lg">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-orange-950">
              Shift Reconcile & Drawer Closing (
              {activeShift.counter_number || "Counter #1"})
            </h3>
            <p className="text-xs text-orange-700">
              Cashier ID: {activeShift.cashier_id || "CASHIER-01"}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-orange-700 font-semibold block">
            Opening Cash
          </span>
          <span className="font-mono font-bold text-orange-900">
            ₹{activeShift.opening_cash || 2000}
          </span>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-bold text-orange-950 uppercase tracking-wider mb-3 flex items-center">
            <Calculator className="w-4 h-4 mr-1.5 text-orange-700" />
            Physical Currency Denomination Counter
          </h4>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {[500, 200, 100, 50, 20, 10].map((denom) => (
              <div
                key={denom}
                className="flex items-center justify-between p-2 bg-amber-50/50 rounded border border-orange-100"
              >
                <span className="font-bold text-orange-900">₹{denom} x</span>
                <input
                  type="number"
                  min="0"
                  value={denominations[denom]}
                  onChange={(e) => handleDenomChange(denom, e.target.value)}
                  className="w-16 px-2 py-1 border border-orange-200 rounded text-center font-mono font-bold"
                />
              </div>
            ))}
            <div className="flex items-center justify-between p-2 bg-amber-50/50 rounded border border-orange-100 col-span-2">
              <span className="font-bold text-orange-900">Coins Value (₹)</span>
              <input
                type="number"
                min="0"
                value={denominations.coins}
                onChange={(e) => handleDenomChange("coins", e.target.value)}
                className="w-24 px-2 py-1 border border-orange-200 rounded text-center font-mono font-bold"
              />
            </div>
          </div>
        </div>

        <div className="bg-amber-50/60 p-4 rounded-xl border border-orange-200 flex flex-col justify-between space-y-4">
          <div>
            <h4 className="text-xs font-bold text-orange-950 uppercase tracking-wider mb-3">
              Reconciliation Summary
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 bg-white rounded border border-orange-100">
                <span className="text-orange-700">Actual Physical Cash:</span>
                <span className="font-mono font-bold text-orange-950 text-sm">
                  ₹{actualCash}
                </span>
              </div>
              <div className="flex justify-between p-2 bg-white rounded border border-orange-100">
                <span className="text-orange-700">
                  System Calculated (POS):
                </span>
                <span className="font-mono font-bold text-orange-950 text-sm">
                  ₹{systemCalculated}
                </span>
              </div>
              <div
                className={`flex justify-between p-2.5 rounded font-bold ${
                  variance === 0
                    ? "bg-green-100 text-green-800 border border-green-300"
                    : variance > 0
                      ? "bg-blue-100 text-blue-800 border border-blue-300"
                      : "bg-red-100 text-red-800 border border-red-300"
                }`}
              >
                <span className="flex items-center">
                  {variance === 0 ? (
                    <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mr-1" />
                  )}
                  Drawer Variance:
                </span>
                <span className="font-mono">
                  {variance === 0 ? "₹0 (Zero Variance)" : `₹${variance}`}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-full py-2.5 bg-orange-800 hover:bg-orange-900 text-white font-bold rounded-lg text-xs uppercase tracking-wider shadow transition-colors"
          >
            {isSubmitting
              ? "Closing Shift..."
              : "Reconcile & Close Shift Drawer"}
          </button>
        </div>
      </div>
    </div>
  );
}
