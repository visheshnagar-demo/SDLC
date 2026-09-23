import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Compass,
  Sparkles,
  DollarSign,
  ArrowRight,
  Share2,
} from "lucide-react";
import HeaderNav from "../components/HeaderNav";
import TripInputForm from "../components/TripInputForm";

const SAMPLE_TRIPS = [
  {
    id: "demo-tokyo",
    destination: "Tokyo, Japan",
    budget: 2000,
    total_estimated_cost: 1750,
    currency: "USD",
    duration_days: 7,
    interests: ["Food", "Culture", "Anime"],
    image: "🗼",
    tagline: "Sushi, Temples & Neon Streets",
  },
  {
    id: "demo-paris",
    destination: "Paris, France",
    budget: 2500,
    total_estimated_cost: 2150,
    currency: "EUR",
    duration_days: 5,
    interests: ["Art", "History", "Food"],
    image: "🥐",
    tagline: "Louvre, Cafes & Seine Strolls",
  },
  {
    id: "demo-rome",
    destination: "Rome, Italy",
    budget: 1800,
    total_estimated_cost: 1620,
    currency: "EUR",
    duration_days: 4,
    interests: ["History", "Architecture", "Food"],
    image: "🏛️",
    tagline: "Colosseum, Gelato & Ancient Ruins",
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const [recentTrips, setRecentTrips] = useState(SAMPLE_TRIPS);

  const handleItineraryCreated = (newItinerary) => {
    if (newItinerary && newItinerary.id) {
      setRecentTrips((prev) => [newItinerary, ...prev]);
    }
  };

  const formatMoney = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <HeaderNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-900 via-indigo-900 to-slate-900 text-white pt-12 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.15),transparent_50%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-primary-200 mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span>AI-Driven Itinerary Generator & Budget Tracker</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Plan Personalized Trips in Seconds with{" "}
            <span className="bg-gradient-to-r from-primary-400 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
              AI Intelligence
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 mb-8 leading-relaxed">
            Enter your destination, budget, duration, and interests. WanderAI
            curates structured day-by-day schedules with live cost calculations,
            map routes, and exportable calendars.
          </p>

          {/* Test Account Note */}
          <div className="inline-block px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300">
            <span>Test account credentials: </span>
            <code className="text-primary-300 font-mono font-semibold">
              test@example.com / testpassword
            </code>
          </div>
        </div>
      </section>

      {/* Main Interactive Form Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 -mt-16 relative z-20 w-full mb-16">
        <TripInputForm onItineraryCreated={handleItineraryCreated} />
      </main>

      {/* Key Feature Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Engineered for Effortless Travel Planning
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Everything you need from initial brainstorming to departure day
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Smart AI Curations
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tailored morning, lunch, afternoon, and evening recommendations
              tuned to your custom interests, timing, and local tips.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Live Budget Recalculator
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every added, removed, or swapped activity dynamically updates
              daily costs and alerts you before exceeding your budget.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Export & Share
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Instant PDF downloads, iCalendar (.ics) calendar synchronization,
              and shareable links for family and travel companions.
            </p>
          </div>
        </div>
      </section>

      {/* Saved / Sample Trips Section */}
      <section
        id="saved-trips"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 w-full"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Popular & Recent Itineraries
            </h2>
            <p className="text-xs text-slate-500">
              Explore itineraries or customize one of these templates
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentTrips.map((trip) => (
            <div
              key={trip.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-3xl">{trip.image || "✈️"}</span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
                    {trip.duration_days} Days
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {trip.destination}
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  {trip.tagline || `${trip.interests?.join(" • ")}`}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {trip.interests?.map((i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium"
                    >
                      {i}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">
                    Estimated Cost
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {formatMoney(
                      trip.total_estimated_cost || trip.budget,
                      trip.currency,
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/itineraries/${trip.id}`)}
                  className="px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                >
                  <span>View Itinerary</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-8 px-4 sm:px-6 border-t border-slate-800 text-xs text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white font-bold">
            <Compass className="w-4 h-4 text-primary-400" />
            <span>WanderAI — AI Travel Planner</span>
          </div>
          <p>
            © {new Date().getFullYear()} WanderAI. Built for seamless global
            adventures.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
