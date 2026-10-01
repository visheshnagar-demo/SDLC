import React, { useState, useEffect } from "react";
import { avatarService, rewardService } from "../services/api";
import AvatarCustomizer from "../components/AvatarCustomizer";
import {
  Award,
  Sparkles,
  CheckCircle2,
  Lock,
  Flame,
  Shield,
} from "lucide-react";

export default function AvatarShop({
  activeChild,
  currentPoints = 150,
  onPointsChange,
}) {
  const [catalog, setCatalog] = useState([]);
  const [badges, setBadges] = useState([]);
  const [points, setPoints] = useState(currentPoints);

  useEffect(() => {
    fetchShopData();
  }, [activeChild]);

  const fetchShopData = async () => {
    try {
      const items = await avatarService.getCatalog(activeChild?.id);
      if (Array.isArray(items) && items.length > 0) {
        setCatalog(items);
      }
    } catch {
      // Catalog fallback in AvatarCustomizer
    }

    try {
      const badgeList = await rewardService.getBadges(activeChild?.id);
      if (Array.isArray(badgeList) && badgeList.length > 0) {
        setBadges(badgeList);
      } else {
        setBadges([
          {
            id: "b1",
            name: "Veggie Hero",
            icon: "🥦",
            description: "5 consecutive days meeting vegetable target",
            is_unlocked: true,
            points_reward: 100,
          },
          {
            id: "b2",
            name: "Hydration Master",
            icon: "💧",
            description: "Drank 6 glasses of water daily for 3 days",
            is_unlocked: true,
            points_reward: 50,
          },
          {
            id: "b3",
            name: "Rainbow Eater",
            icon: "🌈",
            description: "Logged all 4 food groups in a single day",
            is_unlocked: true,
            points_reward: 150,
          },
          {
            id: "b4",
            name: "Streak Superstar",
            icon: "🔥",
            description: "Maintained a 7-day healthy eating streak",
            is_unlocked: false,
            points_reward: 200,
          },
          {
            id: "b5",
            name: "Breakfast Champ",
            icon: "🥞",
            description: "Logged breakfast before 9 AM for 5 days",
            is_unlocked: false,
            points_reward: 80,
          },
        ]);
      }
    } catch {
      setBadges([
        {
          id: "b1",
          name: "Veggie Hero",
          icon: "🥦",
          description: "5 consecutive days meeting vegetable target",
          is_unlocked: true,
          points_reward: 100,
        },
        {
          id: "b2",
          name: "Hydration Master",
          icon: "💧",
          description: "Drank 6 glasses of water daily for 3 days",
          is_unlocked: true,
          points_reward: 50,
        },
        {
          id: "b3",
          name: "Rainbow Eater",
          icon: "🌈",
          description: "Logged all 4 food groups in a single day",
          is_unlocked: true,
          points_reward: 150,
        },
        {
          id: "b4",
          name: "Streak Superstar",
          icon: "🔥",
          description: "Maintained a 7-day healthy eating streak",
          is_unlocked: false,
          points_reward: 200,
        },
        {
          id: "b5",
          name: "Breakfast Champ",
          icon: "🥞",
          description: "Logged breakfast before 9 AM for 5 days",
          is_unlocked: false,
          points_reward: 80,
        },
      ]);
    }
  };

  const handleUnlockItem = async (item) => {
    try {
      await avatarService.unlockAvatar({
        child_id: activeChild?.id || "00000000-0000-0000-0000-000000000001",
        avatar_item_id: item.id,
      });
    } catch {
      // Local optimistic update
    }

    const nextPoints = Math.max(0, points - item.cost_points);
    setPoints(nextPoints);
    if (onPointsChange) onPointsChange(nextPoints);

    setCatalog((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_unlocked: true } : i)),
    );
  };

  const handleEquipItem = async (item) => {
    try {
      await avatarService.equipAvatar({
        child_id: activeChild?.id || "00000000-0000-0000-0000-000000000001",
        avatar_item_id: item.id,
      });
    } catch {
      // Local optimistic update
    }

    setCatalog((prev) =>
      prev.map((i) => ({
        ...i,
        is_equipped: i.id === item.id,
      })),
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 text-white p-6 sm:p-8 rounded-3xl shadow-md flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-white/20 rounded-xl text-2xl">🌟</span>
            <h1 className="font-heading font-bold text-2xl sm:text-3xl">
              Rewards & Sprout Shop
            </h1>
          </div>
          <p className="text-purple-100 text-xs sm:text-sm mt-1">
            Redeem healthy habit points for awesome gear, costumes, and
            achievement badges!
          </p>
        </div>

        <div className="bg-white text-amber-600 px-6 py-3 rounded-full font-bold text-lg sm:text-xl shadow-lg flex items-center space-x-2">
          <span>⭐</span>
          <span>{points} Pts</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Avatar Customizer Stage & Catalog */}
        <div className="lg:col-span-2">
          <AvatarCustomizer
            catalog={catalog}
            currentPoints={points}
            onUnlock={handleUnlockItem}
            onEquip={handleEquipItem}
          />
        </div>

        {/* Right 1 Col: Achievement Badges & Trophies */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center space-x-2 mb-4">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="font-heading font-bold text-lg text-slate-800">
                Achievement Badges
              </h3>
            </div>

            <div className="space-y-3">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className={`p-3.5 rounded-2xl border flex items-center space-x-3 transition-all ${
                    b.is_unlocked
                      ? "bg-emerald-50/60 border-emerald-200 shadow-sm"
                      : "bg-slate-50 border-slate-200 opacity-60"
                  }`}
                >
                  <span className="text-3xl p-2 bg-white rounded-xl shadow-xs">
                    {b.icon}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-800">
                        {b.name}
                      </h4>
                      {b.is_unlocked ? (
                        <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold flex items-center">
                          <CheckCircle2 className="w-3 h-3 mr-0.5" /> +
                          {b.points_reward} Pts
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full font-bold flex items-center">
                          <Lock className="w-3 h-3 mr-0.5" /> Locked
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {b.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
