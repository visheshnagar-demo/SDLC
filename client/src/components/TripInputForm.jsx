import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Calendar,
  Sparkles,
  AlertCircle,
  Check,
  Plus,
  Loader2,
} from "lucide-react";
import { itineraryApi } from "../services/api";

const PRESET_DESTINATIONS = [
  "Tokyo, Japan",
  "Paris, France",
  "Rome, Italy",
  "Kyoto, Japan",
  "Barcelona, Spain",
  "New York, USA",
  "Bali, Indonesia",
  "London, UK",
  "Reykjavik, Iceland",
  "Cairo, Egypt",
];

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
];

const AVAILABLE_INTERESTS = [
  { id: "Culture", label: "Culture & Heritage", emoji: "🏛️" },
  { id: "Food", label: "Food & Gastronomy", emoji: "🍜" },
  { id: "Adventure", label: "Adventure & Outdoors", emoji: "🧗" },
  { id: "Relaxation", label: "Relaxation & Spa", emoji: "🏖️" },
  { id: "Nightlife", label: "Nightlife & Bars", emoji: "🍸" },
  { id: "History", label: "History & Museums", emoji: "📜" },
  { id: "Nature", label: "Nature & Parks", emoji: "🌲" },
  { id: "Shopping", label: "Shopping & Markets", emoji: "🛍️" },
  { id: "Anime", label: "Anime & Pop Culture", emoji: "🎌" },
  { id: "Photography", label: "Scenic Photography", emoji: "📸" },
];

export function TripInputForm({ onItineraryCreated }) {
  const navigate = useNavigate();

  const [destination, setDestination] = useState("Tokyo, Japan");
  const [budget, setBudget] = useState(2000);
  const [currency, setCurrency] = useState("USD");
  const [durationDays, setDurationDays] = useState(7);
  const [interests, setInterests] = useState(["Food", "Culture", "Anime"]);
  const [customInterest, setCustomInterest] = useState("");

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [apiError, setApiError] = useState("");

  const loadingMessages = [
    "Consulting AI travel intelligence...",
    "Curating top-rated local activities & hidden gems...",
    "Calculating route transit times & schedule...",
    "Optimizing daily budget allocations...",
    "Finalizing customized day-by-day itinerary...",
  ];

  const handleInterestToggle = (interestId) => {
    if (interests.includes(interestId)) {
      setInterests(interests.filter((i) => i !== interestId));
    } else {
      setInterests([...interests, interestId]);
    }
  };

  const handleAddCustomInterest = (e) => {
    e.preventDefault();
    const trimmed = customInterest.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests([...interests, trimmed]);
      setCustomInterest("");
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!destination.trim()) {
      newErrors.destination = "Destination city or country is required.";
    }

    const numericBudget = Number(budget);
    if (isNaN(numericBudget) || numericBudget <= 0) {
      newErrors.budget = "Please enter a valid budget greater than 0.";
    }

    const numericDuration = Number(durationDays);
    if (isNaN(numericDuration) || numericDuration < 1 || numericDuration > 30) {
      newErrors.durationDays = "Trip duration must be between 1 and 30 days.";
    }

    if (interests.length === 0) {
      newErrors.interests = "Select at least one interest category.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) =>
        prev < loadingMessages.length - 1 ? prev + 1 : prev,
      );
    }, 1200);

    const payload = {
      destination: destination.trim(),
      budget: Number(budget),
      currency,
      duration_days: Number(durationDays),
      interests: interests.length > 0 ? interests : ["Culture", "Food"],
    };

    try {
      const result = await itineraryApi.generateItinerary(payload);
      clearInterval(stepInterval);
      setIsLoading(false);

      if (onItineraryCreated) {
        onItineraryCreated(result);
      }

      if (result && result.id) {
        navigate(`/itineraries/${result.id}`);
      }
    } catch (err) {
      clearInterval(stepInterval);
      setIsLoading(false);
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Failed to generate itinerary. Please verify your connection or try again.";
      setApiError(typeof detail === "string" ? detail : JSON.stringify(detail));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8 md:p-10 transition-all">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary-50 rounded-xl text-primary-600">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Design Your Dream Itinerary
          </h2>
          <p className="text-sm text-slate-500">
            Provide your destination, budget, and travel style — our AI crafts a
            tailored schedule.
          </p>
        </div>
      </div>

      {apiError && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-sm"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">
            <span className="font-semibold">Generation Failed: </span>
            {apiError}
          </div>
        </div>
      )}

      <form noValidate onSubmit={handleSubmit} className="space-y-6">
        {/* Destination Section */}
        <div>
          <label
            htmlFor="destination-input"
            className="block text-sm font-semibold text-slate-700 mb-2"
          >
            Destination (City, Region, or Country)
          </label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
            <input
              id="destination-input"
              type="text"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                if (errors.destination)
                  setErrors({ ...errors, destination: null });
              }}
              placeholder="e.g. Tokyo, Japan or Paris, France"
              className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                errors.destination
                  ? "border-red-500 ring-1 ring-red-500"
                  : "border-slate-300"
              }`}
            />
          </div>
          {errors.destination && (
            <p className="mt-1.5 text-xs text-red-600 font-medium">
              {errors.destination}
            </p>
          )}

          {/* Quick Destination Chips */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium mr-1">
              Popular:
            </span>
            {PRESET_DESTINATIONS.slice(0, 5).map((dest) => (
              <button
                key={dest}
                type="button"
                onClick={() => {
                  setDestination(dest);
                  if (errors.destination)
                    setErrors({ ...errors, destination: null });
                }}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  destination === dest
                    ? "bg-primary-100 border-primary-300 text-primary-800 font-semibold"
                    : "bg-slate-100/80 border-slate-200 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {dest}
              </button>
            ))}
          </div>
        </div>

        {/* Budget & Currency Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label
              htmlFor="budget-input"
              className="block text-sm font-semibold text-slate-700 mb-2"
            >
              Total Budget
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-slate-400 font-semibold text-sm">
                {CURRENCIES.find((c) => c.code === currency)?.symbol || "$"}
              </span>
              <input
                id="budget-input"
                type="number"
                value={budget}
                onChange={(e) => {
                  setBudget(e.target.value);
                  if (errors.budget) setErrors({ ...errors, budget: null });
                }}
                className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                  errors.budget
                    ? "border-red-500 ring-1 ring-red-500"
                    : "border-slate-300"
                }`}
              />
            </div>
            {errors.budget && (
              <p className="mt-1.5 text-xs text-red-600 font-medium">
                {errors.budget}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="currency-select"
              className="block text-sm font-semibold text-slate-700 mb-2"
            >
              Currency
            </label>
            <select
              id="currency-select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol}) — {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Duration Slider & Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="duration-slider"
              className="text-sm font-semibold text-slate-700 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4 text-primary-600" />
              Duration:{" "}
              <span className="text-primary-600 font-bold">
                {durationDays} {durationDays === 1 ? "Day" : "Days"}
              </span>
            </label>
            <span className="text-xs text-slate-400 font-medium">
              1 to 30 Days
            </span>
          </div>

          <div className="flex items-center gap-4">
            <input
              id="duration-slider"
              type="range"
              min="1"
              max="30"
              value={durationDays}
              onChange={(e) => {
                setDurationDays(Number(e.target.value));
                if (errors.durationDays)
                  setErrors({ ...errors, durationDays: null });
              }}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <input
              type="number"
              min="1"
              max="30"
              aria-label="Trip duration in days"
              value={durationDays}
              onChange={(e) => {
                setDurationDays(Number(e.target.value));
                if (errors.durationDays)
                  setErrors({ ...errors, durationDays: null });
              }}
              className="w-20 px-3 py-2 text-center bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
          {errors.durationDays && (
            <p className="mt-1.5 text-xs text-red-600 font-medium">
              {errors.durationDays}
            </p>
          )}
        </div>

        {/* Interests Selection Pills */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-slate-700">
              Interests & Travel Style
            </label>
            <span className="text-xs text-slate-400">
              {interests.length} selected
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {AVAILABLE_INTERESTS.map((item) => {
              const isSelected = interests.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleInterestToggle(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    isSelected
                      ? "bg-primary-600 border-primary-600 text-white shadow-sm shadow-primary-500/20"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span>{item.emoji}</span>
                  <span>{item.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
                </button>
              );
            })}

            {/* Custom Added Interests */}
            {interests
              .filter((i) => !AVAILABLE_INTERESTS.some((a) => a.id === i))
              .map((custom) => (
                <button
                  key={custom}
                  type="button"
                  onClick={() => handleInterestToggle(custom)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border bg-primary-600 border-primary-600 text-white shadow-sm"
                >
                  <span>✨</span>
                  <span>{custom}</span>
                  <Check className="w-3.5 h-3.5 ml-0.5" />
                </button>
              ))}
          </div>

          {/* Add custom interest input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add custom interest (e.g. Scuba Diving, Architecture)..."
              value={customInterest}
              onChange={(e) => setCustomInterest(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="button"
              onClick={handleAddCustomInterest}
              disabled={!customInterest.trim()}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg disabled:opacity-40 transition-colors inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          {errors.interests && (
            <p className="mt-1.5 text-xs text-red-600 font-medium">
              {errors.interests}
            </p>
          )}
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold text-base shadow-lg shadow-primary-500/25 transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating {durationDays}-Day AI Itinerary...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Customized Itinerary</span>
              </>
            )}
          </button>

          {/* Loading status progress indicator */}
          {isLoading && (
            <div className="mt-4 p-4 rounded-xl bg-primary-50 border border-primary-200 text-center animate-pulse">
              <p className="text-xs font-semibold text-primary-800">
                {loadingMessages[loadingStep]}
              </p>
              <div className="w-full bg-primary-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-primary-600 h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${((loadingStep + 1) / loadingMessages.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

export default TripInputForm;
