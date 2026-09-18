import React, { useState } from "react";
import { X, Plus, Trash2, ShoppingCart, AlertCircle } from "lucide-react";

export default function CreateOrderDrawer({
  isOpen,
  onClose,
  onCreateOrder,
  flowers = [],
}) {
  const [customerName, setCustomerName] = useState("Floral Customer");
  const [customerEmail, setCustomerEmail] = useState("test@example.com");
  const [customerPhone, setCustomerPhone] = useState("555-0199");
  const [orderItems, setOrderItems] = useState([]);
  const [selectedFlowerId, setSelectedFlowerId] = useState("");
  const [selectedQty, setSelectedQty] = useState(1);
  const [stockError, setStockError] = useState("");

  if (!isOpen) return null;

  const handleAddItem = () => {
    setStockError("");
    if (!selectedFlowerId) return;

    const flower = flowers.find((f) => f.id === selectedFlowerId);
    if (!flower) return;

    const qtyNum = parseInt(selectedQty, 10);
    if (qtyNum <= 0) {
      setStockError("Please enter a valid positive quantity.");
      return;
    }

    // Check stock limit
    if (qtyNum > flower.stock_quantity) {
      setStockError(
        `Insufficient Stock! Requested ${qtyNum} units, but only ${flower.stock_quantity} available for ${flower.name}.`,
      );
      return;
    }

    const existingIndex = orderItems.findIndex(
      (item) => item.flower_id === flower.id,
    );

    if (existingIndex >= 0) {
      const updated = [...orderItems];
      const newQty = updated[existingIndex].quantity + qtyNum;
      if (newQty > flower.stock_quantity) {
        setStockError(
          `Insufficient Stock! Total ${newQty} units exceeds available stock (${flower.stock_quantity}).`,
        );
        return;
      }
      updated[existingIndex].quantity = newQty;
      updated[existingIndex].line_total =
        newQty * updated[existingIndex].unit_price;
      setOrderItems(updated);
    } else {
      setOrderItems([
        ...orderItems,
        {
          flower_id: flower.id,
          flower_name: flower.name,
          quantity: qtyNum,
          unit_price: flower.price_per_stem,
          line_total: qtyNum * flower.price_per_stem,
          max_stock: flower.stock_quantity,
        },
      ]);
    }

    setSelectedFlowerId("");
    setSelectedQty(1);
  };

  const handleRemoveItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const grandTotal = orderItems.reduce((acc, item) => acc + item.line_total, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    setStockError("");

    if (orderItems.length === 0) {
      setStockError("Please add at least one flower item to the order.");
      return;
    }

    // Final verification against stock
    for (const item of orderItems) {
      if (item.quantity > item.max_stock) {
        setStockError(
          `Insufficient Stock for ${item.flower_name}. Requested ${item.quantity}, available ${item.max_stock}.`,
        );
        return;
      }
    }

    onCreateOrder({
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      items: orderItems.map((i) => ({
        flower_id: i.flower_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })),
      total_amount: grandTotal,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm">
      <div className="absolute inset-0 overflow-hidden">
        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="pointer-events-auto w-screen max-w-md bg-white shadow-2xl flex flex-col">
            <div className="p-6 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5" />
                <h2 className="font-bold text-lg">Create New Order</h2>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-6 space-y-6"
            >
              {stockError && (
                <div
                  role="alert"
                  className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium flex items-start space-x-2"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{stockError}</span>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Customer Details
                </h3>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-gray-200 pt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Add Line Items
                </h3>

                <div className="flex gap-2">
                  <select
                    value={selectedFlowerId}
                    onChange={(e) => setSelectedFlowerId(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="">Select Flower...</option>
                    {flowers.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} (${f.price_per_stem}/stem - Stock:{" "}
                        {f.stock_quantity})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(e.target.value)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 mt-4">
                  {orderItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {item.flower_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.quantity} stems &times; ${item.unit_price}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-gray-900">
                          ${item.line_total.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-gray-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {orderItems.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4 italic">
                      No items added to order yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 flex justify-between items-center text-lg font-bold text-gray-900">
                <span>Total Cost</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={orderItems.length === 0}
                  className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  Confirm &amp; Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
