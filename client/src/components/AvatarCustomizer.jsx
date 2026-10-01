import React, { useState } from "react";
import { Sparkles, Check, Lock, Shirt } from "lucide-react";
import confetti from "canvas-confetti";

export default function AvatarCustomizer({
  catalog = [],
  currentPoints = 0,
  activeAvatar = null,
  onUnlock,
  onEquip,
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loadingItemId, setLoadingItemId] = useState(null);
  const [actionMessage, setActionMessage] = useState("");

  const defaultItems =
    catalog.length > 0
      ? catalog
      : [
          {
            id: "1",
            item_name: "Superhero Cape",
            category: "costume",
            icon: "🦸‍♂️",
            cost_points: 100,
            is_unlocked: true,
            is_equipped: true,
          },
          {
            id: "2",
            item_name: "Veggie Crown",
            category: "hat",
            icon: "👑",
            cost_points: 50,
            is_unlocked: true,
            is_equipped: false,
          },
          {
            id: "3",
            item_name: "Chef Hat",
            category: "hat",
            icon: "🧑‍🍳",
            cost_points: 75,
            is_unlocked: false,
            is_equipped: false,
          },
          {
            id: "4",
            item_name: "Rainbow Glasses",
            category: "accessory",
            icon: "🕶️",
            cost_points: 80,
            is_unlocked: false,
            is_equipped: false,
          },
          {
            id: "5",
            item_name: "Dino Suit",
            category: "costume",
            icon: "🦖",
            cost_points: 150,
            is_unlocked: false,
            is_equipped: false,
          },
          {
            id: "6",
            item_name: "Space Explorer Helmet",
            category: "hat",
            icon: "🚀",
            cost_points: 200,
            is_unlocked: false,
            is_equipped: false,
          },
        ];

  const equippedItem =
    defaultItems.find((i) => i.is_equipped) || defaultItems[0];

  const handleUnlockClick = async (item) => {
    if (currentPoints < item.cost_points) {
      setActionMessage(
        `You need ${item.cost_points - currentPoints} more points to unlock this!`,
      );
      setTimeout(() => setActionMessage(""), 3000);
      return;
    }

    try {
      setLoadingItemId(item.id);
      if (onUnlock) {
        await onUnlock(item);
      }
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
      setActionMessage(`🎉 Unlocked ${item.item_name}!`);
      setTimeout(() => setActionMessage(""), 3000);
    } catch {
      setActionMessage("Failed to unlock item. Please try again.");
      setTimeout(() => setActionMessage(""), 3000);
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleEquipClick = async (item) => {
    try {
      setLoadingItemId(item.id);
      if (onEquip) {
        await onEquip(item);
      }
      setActionMessage(`✨ Equipped ${item.item_name}!`);
      setTimeout(() => setActionMessage(""), 3000);
    } catch {
      setActionMessage("Failed to equip item. Please try again.");
      setTimeout(() => setActionMessage(""), 3000);
    } finally {
      setLoadingItemId(null);
    }
  };

  const filteredItems =
    selectedCategory === "all"
      ? defaultItems
      : defaultItems.filter((i) => i.category === selectedCategory);

  return (
    <div className="space-y-6">
      {actionMessage && (
        <div className="bg-amber-100 text-amber-900 border border-amber-300 px-4 py-2.5 rounded-2xl text-center text-sm font-bold animate-pulse">
          {actionMessage}
        </div>
      )}

      {/* Avatar Stage */}
      <div className="bg-gradient-to-b from-amber-50 to-emerald-50 rounded-3xl p-8 border border-amber-200 text-center shadow-inner relative overflow-hidden">
        <div className="inline-block bg-white/80 backdrop-blur px-4 py-1.5 rounded-full text-xs font-bold text-amber-800 border border-amber-200 mb-4 shadow-sm">
          Active Wardrobe
        </div>

        <div className="relative inline-block my-2">
          <div className="w-36 h-36 mx-auto bg-white rounded-full shadow-lg border-4 border-amber-300 flex items-center justify-center text-7xl transform hover:scale-110 transition-transform cursor-pointer">
            <span role="img" aria-label="avatar">
              🌱{equippedItem?.icon || "🎩"}
            </span>
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white text-xs px-3 py-0.5 rounded-full font-bold shadow-md">
            Lv. 5 Sprout
          </div>
        </div>

        <h3 className="font-heading font-bold text-xl text-slate-800 mt-4">
          Leo the Super Sprout
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Equipped:{" "}
          <span className="font-semibold text-emerald-600">
            {equippedItem?.item_name || "Basic Sprout"}
          </span>
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        {["all", "costume", "hat", "accessory"].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
              selectedCategory === cat
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`bg-white p-4 rounded-2xl border transition-all ${
              item.is_equipped
                ? "border-emerald-400 bg-emerald-50/30 ring-2 ring-emerald-300"
                : item.is_unlocked
                  ? "border-slate-200 hover:border-amber-300 shadow-sm"
                  : "border-slate-200 opacity-90"
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="text-4xl p-2 bg-slate-50 rounded-2xl">
                {item.icon}
              </span>
              <div className="text-right">
                {item.is_equipped ? (
                  <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3 mr-0.5" /> Equipped
                  </span>
                ) : item.is_unlocked ? (
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    Unlocked
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    ⭐ {item.cost_points} Pts
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3">
              <h4 className="font-bold text-sm text-slate-800">
                {item.item_name}
              </h4>
              <p className="text-xs text-slate-500 capitalize">
                {item.category}
              </p>
            </div>

            <div className="mt-4">
              {item.is_equipped ? (
                <button
                  disabled
                  className="w-full py-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-xl cursor-default"
                >
                  In Use
                </button>
              ) : item.is_unlocked ? (
                <button
                  onClick={() => handleEquipClick(item)}
                  disabled={loadingItemId === item.id}
                  className="w-full py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
                >
                  {loadingItemId === item.id ? "Equipping..." : "Equip Gear"}
                </button>
              ) : (
                <button
                  onClick={() => handleUnlockClick(item)}
                  disabled={
                    loadingItemId === item.id ||
                    currentPoints < item.cost_points
                  }
                  className={`w-full py-1.5 text-xs font-bold rounded-xl flex items-center justify-center space-x-1 shadow-sm transition-all ${
                    currentPoints >= item.cost_points
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  <span>
                    {loadingItemId === item.id
                      ? "Unlocking..."
                      : `Unlock (${item.cost_points} Pts)`}
                  </span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
