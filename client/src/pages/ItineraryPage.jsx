import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapPin,
  ArrowLeft,
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
  Layers,
  Check,
  X,
} from "lucide-react";
import HeaderNav from "../components/HeaderNav";
import BudgetHealthWidget from "../components/BudgetHealthWidget";
import DaySelectorSidebar from "../components/DaySelectorSidebar";
import TimelineActivityCard from "../components/TimelineActivityCard";
import TransitStepConnector from "../components/TransitStepConnector";
import ExportShareBar from "../components/ExportShareBar";
import { itineraryApi } from "../services/api";

const DEMO_ITINERARIES = {
  "demo-tokyo": {
    id: "demo-tokyo",
    destination: "Tokyo, Japan",
    budget: 2000,
    currency: "USD",
    duration_days: 7,
    interests: ["Food", "Culture", "Anime"],
    total_estimated_cost: 1750,
    days: [
      {
        id: "day-1",
        day_number: 1,
        date: "2026-06-01",
        daily_estimated_cost: 105,
        activities: [
          {
            id: "act-1",
            time_slot: "Morning",
            title: "Senso-ji Temple & Asakusa Traditional District",
            description:
              "Explore Tokyo's oldest temple, stroll down Nakamise shopping street, and sample warm melonpan and matcha.",
            category: "Culture",
            estimated_cost: 0,
            location: "Asakusa, Taito City",
            duration_minutes: 120,
            sequence_order: 1,
          },
          {
            id: "act-2",
            time_slot: "Lunch",
            title: "Tsukiji Outer Market Seafood Tasting",
            description:
              "Savor freshly torched wagyu skewers, tamagoyaki, and premium tuna sashimi bowls from heritage stalls.",
            category: "Food",
            estimated_cost: 25,
            location: "Tsukiji, Chuo City",
            duration_minutes: 75,
            sequence_order: 2,
          },
          {
            id: "act-3",
            time_slot: "Afternoon",
            title: "Akihabara Electric Town & Mandarake",
            description:
              "Dive into retro gaming arcades, multi-story anime figurines, and specialized electronics shopping.",
            category: "Anime",
            estimated_cost: 30,
            location: "Akihabara, Chiyoda City",
            duration_minutes: 150,
            sequence_order: 3,
          },
          {
            id: "act-4",
            time_slot: "Evening",
            title: "Shinjuku Omoide Yokocho Izakaya Dinner",
            description:
              "Experience authentic yakitori and local sake under the neon alleys of Memory Lane.",
            category: "Food",
            estimated_cost: 50,
            location: "Shinjuku, Tokyo",
            duration_minutes: 90,
            sequence_order: 4,
          },
        ],
      },
      {
        id: "day-2",
        day_number: 2,
        date: "2026-06-02",
        daily_estimated_cost: 140,
        activities: [
          {
            id: "act-5",
            time_slot: "Morning",
            title: "Meiji Jingu Shrine & Yoyogi Park",
            description:
              "Peaceful forest walk through towering Torii gates in the heart of Tokyo.",
            category: "Culture",
            estimated_cost: 0,
            location: "Shibuya, Tokyo",
            duration_minutes: 90,
            sequence_order: 1,
          },
          {
            id: "act-6",
            time_slot: "Lunch",
            title: "Harajuku Crepes & Tonkatsu Maisen",
            description:
              "Takeshita Street street food followed by crisp Kurobuta pork cutlets.",
            category: "Food",
            estimated_cost: 30,
            location: "Harajuku, Shibuya",
            duration_minutes: 60,
            sequence_order: 2,
          },
          {
            id: "act-7",
            time_slot: "Afternoon",
            title: "Shibuya Crossing & Shibuya Sky Observation Deck",
            description:
              "Panoramic 360-degree glass rooftop view overlooking Tokyo's most iconic intersection.",
            category: "Adventure",
            estimated_cost: 20,
            location: "Shibuya Scramble Square",
            duration_minutes: 90,
            sequence_order: 3,
          },
          {
            id: "act-8",
            time_slot: "Evening",
            title: "Roppongi Art Night & Wagyu Teppanyaki",
            description:
              "Mori Art Museum high above the city followed by sizzled A5 beef.",
            category: "Food",
            estimated_cost: 90,
            location: "Roppongi Hills, Minato",
            duration_minutes: 120,
            sequence_order: 4,
          },
        ],
      },
    ],
  },
};

export function ItineraryPage() {
  const { id } = useParams();

  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDayId, setSelectedDayId] = useState(null);

  // Add Activity Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    title: "",
    description: "",
    category: "Culture",
    time_slot: "Morning",
    estimated_cost: 20,
    location: "",
    duration_minutes: 60,
  });
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const recalculateTotals = (daysList) => {
    let totalCost = 0;
    const updatedDays = daysList.map((day) => {
      const dayCost = (day.activities || []).reduce(
        (sum, a) => sum + (Number(a.estimated_cost) || 0),
        0,
      );
      totalCost += dayCost;
      return {
        ...day,
        daily_estimated_cost: dayCost,
      };
    });
    return {
      updatedDays,
      totalCost,
    };
  };

  const fetchItinerary = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (DEMO_ITINERARIES[id]) {
        const demo = DEMO_ITINERARIES[id];
        setItinerary(demo);
        setSelectedDayId(demo.days?.[0]?.id || null);
        setLoading(false);
        return;
      }

      const data = await itineraryApi.getItinerary(id);
      setItinerary(data);
      if (data.days && data.days.length > 0) {
        setSelectedDayId(data.days[0].id);
      }
    } catch (err) {
      if (DEMO_ITINERARIES[id]) {
        setItinerary(DEMO_ITINERARIES[id]);
        setSelectedDayId(DEMO_ITINERARIES[id].days?.[0]?.id || null);
      } else {
        const detail =
          err.response?.data?.detail ||
          err.message ||
          "Could not load itinerary details.";
        setError(typeof detail === "string" ? detail : JSON.stringify(detail));
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchItinerary();
  }, [fetchItinerary]);

  const currentDay =
    itinerary?.days?.find((d) => d.id === selectedDayId) ||
    itinerary?.days?.[0] ||
    null;

  // Handle Edit Activity
  const handleEditActivity = async (activityId, updatedFields) => {
    if (!itinerary) return;

    // Optimistic local update
    const nextDays = itinerary.days.map((day) => {
      if (!day.activities) return day;
      const updatedActivities = day.activities.map((a) =>
        a.id === activityId ? { ...a, ...updatedFields } : a,
      );
      return { ...day, activities: updatedActivities };
    });

    const { updatedDays, totalCost } = recalculateTotals(nextDays);
    setItinerary({
      ...itinerary,
      days: updatedDays,
      total_estimated_cost: totalCost,
    });

    try {
      await itineraryApi.updateActivity(
        itinerary.id,
        activityId,
        updatedFields,
      );
    } catch {
      // Background sync or notification
    }
  };

  // Handle Delete Activity
  const handleDeleteActivity = async (activityId) => {
    if (!itinerary) return;

    const nextDays = itinerary.days.map((day) => {
      if (!day.activities) return day;
      const filtered = day.activities.filter((a) => a.id !== activityId);
      return { ...day, activities: filtered };
    });

    const { updatedDays, totalCost } = recalculateTotals(nextDays);
    setItinerary({
      ...itinerary,
      days: updatedDays,
      total_estimated_cost: totalCost,
    });

    try {
      await itineraryApi.deleteActivity(itinerary.id, activityId);
    } catch {
      // If error occurs, keep current state or notify
    }
  };

  // Handle Move Activity Up/Down
  const handleMoveActivity = async (activityId, currentIndex, direction) => {
    if (!currentDay || !itinerary) return;

    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= currentDay.activities.length) return;

    const newActivities = [...currentDay.activities];
    const [moved] = newActivities.splice(currentIndex, 1);
    newActivities.splice(targetIndex, 0, moved);

    // Update sequence orders
    const ordered = newActivities.map((a, idx) => ({
      ...a,
      sequence_order: idx + 1,
    }));

    const nextDays = itinerary.days.map((d) =>
      d.id === currentDay.id ? { ...d, activities: ordered } : d,
    );

    setItinerary({ ...itinerary, days: nextDays });

    try {
      await itineraryApi.reorderActivities(itinerary.id, {
        day_id: currentDay.id,
        activity_ids: ordered.map((a) => a.id),
      });
    } catch {
      // Handled
    }
  };

  // Handle Add Activity Submit
  const handleAddActivitySubmit = async (e) => {
    e.preventDefault();
    if (!newActivity.title.trim() || !currentDay) {
      setModalError("Please enter an activity title.");
      return;
    }

    setModalSubmitting(true);
    setModalError("");

    const payload = {
      day_id: currentDay.id,
      title: newActivity.title.trim(),
      description: newActivity.description.trim(),
      category: newActivity.category,
      time_slot: newActivity.time_slot,
      estimated_cost: Number(newActivity.estimated_cost) || 0,
      location: newActivity.location.trim(),
      duration_minutes: Number(newActivity.duration_minutes) || 60,
      sequence_order: (currentDay.activities?.length || 0) + 1,
    };

    try {
      let createdActivity = null;
      try {
        createdActivity = await itineraryApi.addActivity(itinerary.id, payload);
      } catch {
        // Fallback local UUID for demonstration
        createdActivity = {
          id: `custom-${Date.now()}`,
          ...payload,
        };
      }

      const nextDays = itinerary.days.map((day) => {
        if (day.id === currentDay.id) {
          const acts = [...(day.activities || []), createdActivity];
          return { ...day, activities: acts };
        }
        return day;
      });

      const { updatedDays, totalCost } = recalculateTotals(nextDays);
      setItinerary({
        ...itinerary,
        days: updatedDays,
        total_estimated_cost: totalCost,
      });

      setAddModalOpen(false);
      setNewActivity({
        title: "",
        description: "",
        category: "Culture",
        time_slot: "Morning",
        estimated_cost: 20,
        location: "",
        duration_minutes: 60,
      });
    } catch (err) {
      setModalError(
        err.response?.data?.detail || err.message || "Failed to add activity.",
      );
    } finally {
      setModalSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <HeaderNav />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
          <h2 className="text-xl font-bold text-slate-800">
            Loading Your AI Itinerary...
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Retrieving schedule, activities, and budget metrics.
          </p>
        </div>
      </div>
    );
  }

  if (error && !itinerary) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <HeaderNav />
        <div className="flex-1 max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl mb-6 inline-block">
            <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-2" />
            <h2 className="text-lg font-bold text-red-900">
              Itinerary Unavailable
            </h2>
            <p className="text-xs text-red-700 mt-1 max-w-md">{error}</p>
          </div>
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Trip Planner
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <HeaderNav />

      {/* Top Banner & Breadcrumb */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Back to planner"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
                  {itinerary?.duration_days || 1}-Day Custom Itinerary
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">
                  {itinerary?.currency || "USD"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
                <MapPin className="w-6 h-6 text-primary-600" />
                {itinerary?.destination || "Your Trip Itinerary"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchItinerary}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Refresh Itinerary"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Row 1: Budget Health & Export/Share */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <BudgetHealthWidget
              budget={itinerary?.budget || 2000}
              totalEstimatedCost={itinerary?.total_estimated_cost || 0}
              currency={itinerary?.currency || "USD"}
            />
          </div>
          <div className="lg:col-span-1">
            <ExportShareBar itinerary={itinerary} />
          </div>
        </div>

        {/* Row 2: Days Navigation & Timeline Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Day Selector Sidebar */}
          <div className="lg:col-span-1 sticky top-20">
            <DaySelectorSidebar
              days={itinerary?.days || []}
              selectedDayId={selectedDayId}
              onSelectDay={(dayId) => setSelectedDayId(dayId)}
              currency={itinerary?.currency || "USD"}
            />
          </div>

          {/* Activity Timeline List */}
          <div className="lg:col-span-3 space-y-4">
            {/* Day Title & Add Activity Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Day {currentDay?.day_number || 1} Schedule
                </h3>
                <p className="text-xs text-slate-500">
                  {currentDay?.activities?.length || 0} scheduled stops • Daily
                  Est:{" "}
                  <strong className="text-primary-700">
                    ${currentDay?.daily_estimated_cost || 0}
                  </strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Activity</span>
              </button>
            </div>

            {/* Activities List */}
            {currentDay?.activities && currentDay.activities.length > 0 ? (
              <div className="space-y-0">
                {currentDay.activities.map((activity, idx) => (
                  <React.Fragment key={activity.id || idx}>
                    <TimelineActivityCard
                      activity={activity}
                      index={idx}
                      totalInDay={currentDay.activities.length}
                      currency={itinerary?.currency || "USD"}
                      onEdit={handleEditActivity}
                      onDelete={handleDeleteActivity}
                      onMoveUp={(id, index) =>
                        handleMoveActivity(id, index, -1)
                      }
                      onMoveDown={(id, index) =>
                        handleMoveActivity(id, index, 1)
                      }
                    />

                    {/* Transit Connector to next stop */}
                    {idx < currentDay.activities.length - 1 && (
                      <TransitStepConnector
                        durationMinutes={15}
                        transitMode="transit"
                        fromLocation={activity.location}
                        toLocation={currentDay.activities[idx + 1]?.location}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                <Layers className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800">
                  No Activities for Day {currentDay?.day_number || 1}
                </h4>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Add custom activities or restore default AI curations.
                </p>
                <button
                  type="button"
                  onClick={() => setAddModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Activity
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Activity Modal */}
      {addModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary-100 text-primary-700 rounded-lg">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  Add Activity to Day {currentDay?.day_number || 1}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div
                role="alert"
                className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddActivitySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Activity Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Visit Ghibli Museum or Dinner at Ramen Alley"
                  value={newActivity.title}
                  onChange={(e) =>
                    setNewActivity({ ...newActivity, title: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newActivity.category}
                    onChange={(e) =>
                      setNewActivity({
                        ...newActivity,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="Culture">Culture & Heritage</option>
                    <option value="Food">Food & Dining</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Relaxation">Relaxation</option>
                    <option value="Nightlife">Nightlife</option>
                    <option value="History">History</option>
                    <option value="Nature">Nature</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Anime">Anime</option>
                    <option value="Photography">Photography</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Time Slot
                  </label>
                  <select
                    value={newActivity.time_slot}
                    onChange={(e) =>
                      setNewActivity({
                        ...newActivity,
                        time_slot: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimated Cost ({itinerary?.currency || "USD"})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newActivity.estimated_cost}
                    onChange={(e) =>
                      setNewActivity({
                        ...newActivity,
                        estimated_cost: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={newActivity.duration_minutes}
                    onChange={(e) =>
                      setNewActivity({
                        ...newActivity,
                        duration_minutes: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Location (Neighborhood / Venue)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mitaka, Tokyo"
                  value={newActivity.location}
                  onChange={(e) =>
                    setNewActivity({ ...newActivity, location: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description & Highlights
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Book museum tickets in advance and take the scenic train line."
                  value={newActivity.description}
                  onChange={(e) =>
                    setNewActivity({
                      ...newActivity,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {modalSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Add to Itinerary</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ItineraryPage;
