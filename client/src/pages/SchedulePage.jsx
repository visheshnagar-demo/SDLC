import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  getSchedules,
  getSchedule,
  getSubjects,
  updateSessionStatus,
} from "../services/api";
import ScheduleTimetable from "../components/ScheduleTimetable";
import TodayProgressWidget from "../components/TodayProgressWidget";
import {
  Calendar,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ChevronDown,
} from "lucide-react";

export function SchedulePage() {
  const location = useLocation();
  const passedPlanId = location.state?.planId;

  const [schedules, setSchedules] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const [schedRes, subjRes] = await Promise.allSettled([
        getSchedules(),
        getSubjects(),
      ]);

      if (subjRes.status === "fulfilled" && Array.isArray(subjRes.value)) {
        setSubjects(subjRes.value);
      }

      if (
        schedRes.status === "fulfilled" &&
        Array.isArray(schedRes.value) &&
        schedRes.value.length > 0
      ) {
        setSchedules(schedRes.value);

        let selected = schedRes.value[0];
        if (passedPlanId) {
          const matched = schedRes.value.find((p) => p.id === passedPlanId);
          if (matched) selected = matched;
        }

        // Fetch deep details for selected plan if needed
        if (selected?.id) {
          try {
            const fullPlan = await getSchedule(selected.id);
            setCurrentPlan(fullPlan || selected);
          } catch {
            setCurrentPlan(selected);
          }
        } else {
          setCurrentPlan(selected);
        }
      }
    } catch (err) {
      setErrorMessage("Failed to load study schedule.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [passedPlanId]);

  const handleSelectPlan = async (planId) => {
    setIsLoading(true);
    try {
      const fullPlan = await getSchedule(planId);
      setCurrentPlan(fullPlan);
    } catch (err) {
      const found = schedules.find((s) => s.id === planId);
      if (found) setCurrentPlan(found);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSessionStatus = async (sessionId, newStatus) => {
    try {
      await updateSessionStatus(sessionId, newStatus);
      // Optimistically update local session status
      if (currentPlan && currentPlan.sessions) {
        setCurrentPlan((prev) => ({
          ...prev,
          sessions: prev.sessions.map((s) =>
            s.id === sessionId ? { ...s, status: newStatus } : s,
          ),
        }));
      }
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.detail || "Failed to update session status.",
      );
    }
  };

  const sessions = currentPlan?.sessions || [];
  const completedCount = sessions.filter(
    (s) => s.status === "COMPLETED",
  ).length;
  const pendingCount = sessions.filter((s) => s.status === "PENDING").length;
  const totalHours =
    currentPlan?.total_study_hours ||
    (
      sessions.reduce((acc, s) => acc + (s.duration_minutes || 60), 0) / 60
    ).toFixed(1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Plan Selector */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>AI Dynamic Timetable</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {currentPlan?.title || "Active Study Schedule"}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
            {currentPlan?.start_date && currentPlan?.end_date && (
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {currentPlan.start_date} → {currentPlan.end_date}
              </span>
            )}
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {totalHours} Total Hours
            </span>
            <span className="px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {currentPlan?.status || "ACTIVE"}
            </span>
          </div>
        </div>

        {/* Plan Picker & Actions */}
        <div className="flex items-center space-x-3">
          {schedules.length > 1 && (
            <div className="relative">
              <select
                value={currentPlan?.id || ""}
                onChange={(e) => handleSelectPlan(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-8 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                aria-label="Select study plan"
              >
                {schedules.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.title || `Plan (${plan.start_date})`}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          )}

          <Link
            to="/"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New / Adjust Plan</span>
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-sm"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Timetable + Progress Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <ScheduleTimetable
            sessions={sessions}
            subjects={subjects}
            onUpdateStatus={handleUpdateSessionStatus}
            isLoading={isLoading}
          />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <TodayProgressWidget
            sessions={sessions}
            subjects={subjects}
            onCompleteSession={handleUpdateSessionStatus}
          />

          {/* Quick Schedule Statistics Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Plan Overview
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <div className="text-2xl font-extrabold text-blue-600">
                  {sessions.length}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Total Sessions
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                <div className="text-2xl font-extrabold text-emerald-600">
                  {completedCount}
                </div>
                <div className="text-xs text-emerald-700 mt-0.5">Completed</div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                <div className="text-2xl font-extrabold text-amber-600">
                  {pendingCount}
                </div>
                <div className="text-xs text-amber-700 mt-0.5">
                  Upcoming / Pending
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-center">
                <div className="text-2xl font-extrabold text-purple-600">
                  {totalHours}h
                </div>
                <div className="text-xs text-purple-700 mt-0.5">
                  Total Volume
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/analytics"
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <span>View Retention & Urgency Directives</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SchedulePage;
