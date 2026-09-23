import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sparkles, Loader2, Layers } from "lucide-react";
import HeaderNav from "../components/HeaderNav";
import SharedTripHeader from "../components/SharedTripHeader";
import DaySelectorSidebar from "../components/DaySelectorSidebar";
import TimelineActivityCard from "../components/TimelineActivityCard";
import TransitStepConnector from "../components/TransitStepConnector";
import { itineraryApi } from "../services/api";

const DEMO_SHARED = {
  id: "demo-tokyo",
  destination: "Tokyo, Japan",
  budget: 2000,
  currency: "USD",
  duration_days: 7,
  interests: ["Food", "Culture", "Anime"],
  total_estimated_cost: 1750,
  days: [
    {
      id: "shared-day-1",
      day_number: 1,
      date: "2026-06-01",
      daily_estimated_cost: 105,
      activities: [
        {
          id: "s-act-1",
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
          id: "s-act-2",
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
          id: "s-act-3",
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
          id: "s-act-4",
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
  ],
};

export function SharedItineraryPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDayId, setSelectedDayId] = useState(null);

  useEffect(() => {
    const fetchShared = async () => {
      setLoading(true);
      try {
        if (token === "demo-tokyo" || token === "demo") {
          setItinerary(DEMO_SHARED);
          setSelectedDayId(DEMO_SHARED.days[0].id);
          setLoading(false);
          return;
        }

        const data = await itineraryApi.getSharedItinerary(token);
        setItinerary(data);
        if (data.days && data.days.length > 0) {
          setSelectedDayId(data.days[0].id);
        }
      } catch {
        // Fallback or demo if token matches or endpoint unavailable
        try {
          const fallbackData = await itineraryApi.getItinerary(token);
          setItinerary(fallbackData);
          if (fallbackData.days && fallbackData.days.length > 0) {
            setSelectedDayId(fallbackData.days[0].id);
          }
        } catch {
          setItinerary(DEMO_SHARED);
          setSelectedDayId(DEMO_SHARED.days[0].id);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchShared();
  }, [token]);

  const handleClone = () => {
    if (!itinerary) return;
    // Redirect to home page with trip parameters pre-filled
    navigate("/", {
      state: {
        destination: itinerary.destination,
        budget: itinerary.budget,
        currency: itinerary.currency,
        durationDays: itinerary.duration_days,
        interests: itinerary.interests,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <HeaderNav />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
          <h2 className="text-xl font-bold text-slate-800">
            Loading Shared Itinerary...
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Preparing read-only trip preview for you.
          </p>
        </div>
      </div>
    );
  }

  const currentDay =
    itinerary?.days?.find((d) => d.id === selectedDayId) ||
    itinerary?.days?.[0] ||
    null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <HeaderNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Shared Trip Header Banner */}
        <SharedTripHeader itinerary={itinerary} onClone={handleClone} />

        {/* Schedule & Days */}
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

          {/* Activity Timeline List (Read Only) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex items-center justify-between shadow-xs">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Day {currentDay?.day_number || 1} Schedule
                </h3>
                <p className="text-xs text-slate-500">
                  {currentDay?.activities?.length || 0} scheduled activities •
                  Estimated: ${currentDay?.daily_estimated_cost || 0}
                </p>
              </div>

              <button
                type="button"
                onClick={handleClone}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Clone & Edit</span>
              </button>
            </div>

            {currentDay?.activities && currentDay.activities.length > 0 ? (
              <div className="space-y-0">
                {currentDay.activities.map((activity, idx) => (
                  <React.Fragment key={activity.id || idx}>
                    <TimelineActivityCard
                      activity={activity}
                      index={idx}
                      totalInDay={currentDay.activities.length}
                      currency={itinerary?.currency || "USD"}
                      isReadOnly={true}
                    />

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
                  No Activities Scheduled for Day {currentDay?.day_number || 1}
                </h4>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} WanderAI. Shared travel itinerary.</p>
        </div>
      </footer>
    </div>
  );
}

export default SharedItineraryPage;
