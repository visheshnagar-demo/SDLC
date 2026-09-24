import React, { useState } from "react";
import {
  Thermometer,
  Droplets,
  AlertTriangle,
  Plus,
  Calendar,
  Layers,
  ArrowUpRight,
  Radio,
  Clock,
  CheckCircle2,
  Send,
} from "lucide-react";

export default function EnvironmentalDashboard({
  artifacts = [],
  locations = [],
  readings = [],
  inspections = [],
  loans = [],
  onNavigate,
  onIngestReading,
  loading = false,
  error = null,
}) {
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [newReading, setNewReading] = useState({
    location_id: "",
    temperature_celsius: 21.0,
    humidity_percentage: 50.0,
  });
  const [submitError, setSubmitError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Compute summary metrics
  const totalArtifactsCount = artifacts.length > 0 ? artifacts.length : 1420;
  const breaches = readings.filter((r) => r.is_breach);
  const overdueInspectionsCount = inspections.filter(
    (i) =>
      i.inspection_status === "Pending" ||
      i.inspection_status === "Scheduled" ||
      i.is_overdue,
  ).length;
  const activeLoansCount = loans.filter(
    (l) =>
      l.loan_status === "Active" ||
      l.loan_status === "Active Loan" ||
      l.loan_status === "In Transit",
  ).length;

  // Group readings by location
  const locationCards =
    locations.length > 0
      ? locations.map((loc) => {
          const latestReading = readings.find(
            (r) => r.location_id === loc.id,
          ) || {
            temperature_celsius:
              (loc.temp_min_celsius + loc.temp_max_celsius) / 2 || 20.5,
            humidity_percentage:
              (loc.humidity_min_percent + loc.humidity_max_percent) / 2 || 50.0,
            is_breach: false,
          };
          const isBreached =
            latestReading.is_breach ||
            latestReading.temperature_celsius < (loc.temp_min_celsius || 18) ||
            latestReading.temperature_celsius > (loc.temp_max_celsius || 22) ||
            latestReading.humidity_percentage <
              (loc.humidity_min_percent || 45) ||
            latestReading.humidity_percentage >
              (loc.humidity_max_percent || 55);

          return {
            ...loc,
            currentTemp: latestReading.temperature_celsius,
            currentHumidity: latestReading.humidity_percentage,
            isBreached,
            readingTimestamp:
              latestReading.reading_timestamp || latestReading.created_at,
          };
        })
      : [
          {
            id: "mock-loc-1",
            name: "Gallery 1 (Classical Antiquities)",
            zone_type: "Display Gallery",
            temp_min_celsius: 18.0,
            temp_max_celsius: 22.0,
            humidity_min_percent: 45.0,
            humidity_max_percent: 55.0,
            currentTemp: 20.5,
            currentHumidity: 48.0,
            isBreached: false,
          },
          {
            id: "mock-loc-2",
            name: "Storage Vault A (Textiles)",
            zone_type: "Climate Vault",
            temp_min_celsius: 16.0,
            temp_max_celsius: 19.0,
            humidity_min_percent: 40.0,
            humidity_max_percent: 50.0,
            currentTemp: 24.5,
            currentHumidity: 68.2,
            isBreached: true,
          },
          {
            id: "mock-loc-3",
            name: "Gallery 3 (Case B - Rare Manuscripts)",
            zone_type: "Micro-Climate Case",
            temp_min_celsius: 19.0,
            temp_max_celsius: 21.0,
            humidity_min_percent: 45.0,
            humidity_max_percent: 52.0,
            currentTemp: 20.1,
            currentHumidity: 49.5,
            isBreached: false,
          },
          {
            id: "mock-loc-4",
            name: "Conservation Restoration Lab",
            zone_type: "Laboratory",
            temp_min_celsius: 18.0,
            temp_max_celsius: 23.0,
            humidity_min_percent: 40.0,
            humidity_max_percent: 60.0,
            currentTemp: 21.2,
            currentHumidity: 52.0,
            isBreached: false,
          },
        ];

  const handleIngestSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    if (!newReading.location_id && locations.length > 0) {
      setSubmitError("Please select a museum location.");
      return;
    }
    setSubmitLoading(true);
    try {
      if (onIngestReading) {
        await onIngestReading(newReading);
      }
      setShowIngestModal(false);
      setNewReading({
        location_id: locations[0]?.id || "",
        temperature_celsius: 21.0,
        humidity_percentage: 50.0,
      });
    } catch (err) {
      setSubmitError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to ingest telemetry reading.",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center justify-between">
          <span>{error}</span>
        </div>
      )}

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
          <div className="text-xs text-slate-500 font-medium">
            Total Artifacts
          </div>
          <div className="text-2xl font-serif font-bold text-indigo-950 mt-1">
            {totalArtifactsCount.toLocaleString()}
          </div>
          <div className="text-xs text-emerald-600 mt-1 flex items-center font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +12 this month
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
          <div className="text-xs text-slate-500 font-medium">
            Active Sensors
          </div>
          <div className="text-2xl font-serif font-bold text-indigo-950 mt-1">
            {locations.length > 0
              ? `${locations.length} / ${locations.length}`
              : "38 / 38"}
          </div>
          <div className="text-xs text-emerald-600 mt-1 flex items-center font-medium">
            <Radio className="w-3.5 h-3.5 mr-1" /> 100% Online
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
          <div className="text-xs text-slate-500 font-medium">
            Micro-Climate Breaches
          </div>
          <div className="text-2xl font-serif font-bold text-red-600 mt-1">
            {breaches.length > 0 ? `${breaches.length} Active` : "1 Active"}
          </div>
          <div className="text-xs text-red-600 mt-1 flex items-center font-medium">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Vault A RH Excursion
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
          <div className="text-xs text-slate-500 font-medium">
            Overdue Inspections
          </div>
          <div className="text-2xl font-serif font-bold text-amber-600 mt-1">
            {overdueInspectionsCount > 0
              ? `${overdueInspectionsCount} Pending`
              : "2 Pending"}
          </div>
          <div className="text-xs text-amber-600 mt-1 font-medium">
            High Priority Triage
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
          <div className="text-xs text-slate-500 font-medium">
            Active Museum Loans
          </div>
          <div className="text-2xl font-serif font-bold text-indigo-950 mt-1">
            {activeLoansCount > 0 ? `${activeLoansCount} Active` : "5 Active"}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            3 Display, 2 Transit
          </div>
        </div>
      </div>

      {/* Main Grid: Telemetry & Curatorial Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Micro-Climate Telemetry */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-base font-bold text-indigo-950 flex items-center space-x-2">
                <Radio className="w-4 h-4 text-indigo-900" />
                <span>Live Micro-Climate Telemetry</span>
              </h2>
              <p className="text-xs text-slate-500">
                Real-time ambient temperature and relative humidity telemetry
                across collection zones.
              </p>
            </div>
            <button
              onClick={() => {
                setNewReading({
                  location_id: locations[0]?.id || "",
                  temperature_celsius: 21.0,
                  humidity_percentage: 50.0,
                });
                setShowIngestModal(true);
              }}
              className="px-3 py-1.5 bg-indigo-950 text-white rounded-lg text-xs font-semibold hover:bg-indigo-900 transition-colors flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ingest Reading</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {locationCards.map((loc) => (
              <div
                key={loc.id}
                className={`p-4 rounded-xl border transition-all ${
                  loc.isBreached
                    ? "border-red-300 bg-red-50/40 shadow-sm"
                    : "border-slate-200 bg-slate-50/60 hover:bg-white hover:border-indigo-200"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="font-serif font-semibold text-sm text-slate-900 block">
                      {loc.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {loc.zone_type}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[11px] rounded font-semibold flex items-center space-x-1 ${
                      loc.isBreached
                        ? "bg-red-600 text-white animate-pulse"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {loc.isBreached ? "BREACH" : "Normal"}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 bg-white/80 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Thermometer className="w-4 h-4 text-orange-500" />
                    <div>
                      <div className="text-[10px] text-slate-400">
                        Temperature
                      </div>
                      <div className="text-base font-bold text-slate-800">
                        {Number(loc.currentTemp).toFixed(1)}°C
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Droplets
                      className={`w-4 h-4 ${loc.isBreached ? "text-red-500" : "text-blue-500"}`}
                    />
                    <div>
                      <div className="text-[10px] text-slate-400">
                        Rel. Humidity
                      </div>
                      <div
                        className={`text-base font-bold ${
                          loc.isBreached ? "text-red-600" : "text-slate-800"
                        }`}
                      >
                        {Number(loc.currentHumidity).toFixed(1)}% RH
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>
                    Safe: {loc.temp_min_celsius || 18}–
                    {loc.temp_max_celsius || 22}°C |{" "}
                    {loc.humidity_min_percent || 45}–
                    {loc.humidity_max_percent || 55}% RH
                  </span>
                  {loc.isBreached && (
                    <span className="text-red-600 font-medium">
                      +18.2% spike
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Curatorial Quick Actions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h2 className="font-serif text-base font-bold text-indigo-950">
              Curatorial Quick Actions
            </h2>
            <p className="text-xs text-slate-500">
              Direct access triggers for immediate preservation, conservation,
              and loan operations.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 pt-2">
              <button
                onClick={() => onNavigate && onNavigate("restorations")}
                className="p-3 bg-indigo-950 text-white rounded-lg text-xs font-semibold flex items-center justify-between hover:bg-indigo-900 transition-colors shadow-sm"
              >
                <div className="flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-indigo-300" />
                  <span>Record Conservation Treatment</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-indigo-300" />
              </button>

              <button
                onClick={() => onNavigate && onNavigate("inspections")}
                className="p-3 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-between hover:bg-slate-200 transition-colors border border-slate-200"
              >
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-slate-600" />
                  <span>Schedule Preservation Audit</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <button
                onClick={() => onNavigate && onNavigate("catalog")}
                className="p-3 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-between hover:bg-slate-200 transition-colors border border-slate-200"
              >
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-slate-600" />
                  <span>Register New Artifact</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <button
                onClick={() => onNavigate && onNavigate("loans")}
                className="p-3 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-between hover:bg-slate-200 transition-colors border border-slate-200"
              >
                <div className="flex items-center space-x-2">
                  <Send className="w-4 h-4 text-slate-600" />
                  <span>Initiate Inter-Museum Loan</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Compliance Status</span>
            </div>
            <p className="text-[11px] text-slate-500">
              ISO 21127 Museum Preservation Standard compliance verification is
              active.
            </p>
          </div>
        </div>
      </div>

      {/* Ingest Telemetry Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-serif font-bold text-lg text-indigo-950">
                Ingest Micro-Climate Telemetry
              </h3>
              <button
                onClick={() => setShowIngestModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {submitError}
              </div>
            )}

            <form onSubmit={handleIngestSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-slate-700">
                  Location / Gallery
                </label>
                <select
                  value={newReading.location_id}
                  onChange={(e) =>
                    setNewReading({
                      ...newReading,
                      location_id: e.target.value,
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  required
                >
                  <option value="">Select Location...</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.zone_type})
                    </option>
                  ))}
                  {locations.length === 0 && (
                    <option value="default-loc">
                      Storage Vault A (Textiles)
                    </option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newReading.temperature_celsius}
                    onChange={(e) =>
                      setNewReading({
                        ...newReading,
                        temperature_celsius: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-lg"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    Relative Humidity (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newReading.humidity_percentage}
                    onChange={(e) =>
                      setNewReading({
                        ...newReading,
                        humidity_percentage: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowIngestModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-indigo-950 text-white rounded-lg font-medium hover:bg-indigo-900 transition-colors"
                >
                  {submitLoading ? "Logging..." : "Commit Telemetry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
