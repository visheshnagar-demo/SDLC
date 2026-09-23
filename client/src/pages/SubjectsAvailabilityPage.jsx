import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSubjects,
  createSubject,
  deleteSubject,
  getAvailability,
  saveAvailability,
  generateSchedule,
} from "../services/api";
import SubjectInputForm from "../components/SubjectInputForm";
import SubjectTable from "../components/SubjectTable";
import AvailabilityGrid from "../components/AvailabilityGrid";
import { Sparkles, Calendar, ArrowRight, AlertCircle } from "lucide-react";

export function SubjectsAvailabilityPage() {
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [genSuccessMsg, setGenSuccessMsg] = useState("");

  // Schedule generation form fields
  const [planTitle, setPlanTitle] = useState("Semester Study & Exam Prep");
  const todayDate = new Date().toISOString().split("T")[0];
  const defaultEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const [startDate, setStartDate] = useState(todayDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [dailyMaxMinutes, setDailyMaxMinutes] = useState(240);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const [subjData, availData] = await Promise.allSettled([
        getSubjects(),
        getAvailability(),
      ]);

      if (subjData.status === "fulfilled" && Array.isArray(subjData.value)) {
        setSubjects(subjData.value);
        setSelectedSubjectIds(subjData.value.map((s) => s.id));
      }
      if (availData.status === "fulfilled" && availData.value) {
        const slots = Array.isArray(availData.value)
          ? availData.value
          : availData.value.weekly_slots || [];
        setAvailability(slots);
      }
    } catch (err) {
      setErrorMsg("Failed to load setup data from server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSubject = async (newSubjPayload) => {
    setIsLoading(true);
    try {
      const created = await createSubject(newSubjPayload);
      setSubjects((prev) => [...prev, created]);
      if (created.id) {
        setSelectedSubjectIds((prev) => [...prev, created.id]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    if (!subjectId) return;
    setIsLoading(true);
    try {
      await deleteSubject(subjectId);
      setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
      setSelectedSubjectIds((prev) => prev.filter((id) => id !== subjectId));
    } catch (err) {
      setErrorMsg("Failed to delete subject.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelectSubject = (id) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSaveAvailability = async (availPayload) => {
    setIsLoading(true);
    try {
      const saved = await saveAvailability(availPayload);
      const slots = Array.isArray(saved) ? saved : saved.weekly_slots || [];
      setAvailability(slots);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSchedule = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setGenSuccessMsg("");

    if (subjects.length === 0) {
      setErrorMsg(
        "Please add at least one subject before generating a schedule.",
      );
      return;
    }

    const targetSubjectIds =
      selectedSubjectIds.length > 0
        ? selectedSubjectIds
        : subjects.map((s) => s.id);

    const payload = {
      plan_title: planTitle || "Personalized AI Study Schedule",
      start_date: startDate,
      end_date: endDate,
      subject_ids: targetSubjectIds,
      daily_max_minutes: Number(dailyMaxMinutes) || 240,
    };

    setIsGenerating(true);
    try {
      const generated = await generateSchedule(payload);
      setGenSuccessMsg(
        "AI Schedule successfully generated! Navigating to dashboard...",
      );
      setTimeout(() => {
        navigate("/schedule", { state: { planId: generated?.id } });
      }, 800);
    } catch (err) {
      setErrorMsg(
        err?.response?.data?.detail ||
          err.message ||
          "Failed to generate AI schedule. Please verify your subjects and availability.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold mb-4 border border-white/20">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>AI Curriculum & Constraint Optimization</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Configure Subjects & Availability
          </h1>
          <p className="mt-3 text-blue-100 text-sm sm:text-base leading-relaxed">
            Enter your study subjects, target exam dates, and available weekly
            time. Our AI engine balances difficulty weights, spaced repetitions,
            and available time slots.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-sm"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {genSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-sm font-semibold">
          <Sparkles className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{genSuccessMsg}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Subjects */}
        <div className="lg:col-span-7 space-y-8">
          <SubjectInputForm
            onAddSubject={handleAddSubject}
            isLoading={isLoading}
          />
          <SubjectTable
            subjects={subjects}
            selectedSubjectIds={selectedSubjectIds}
            onToggleSelect={handleToggleSelectSubject}
            onDeleteSubject={handleDeleteSubject}
            isLoading={isLoading}
          />
        </div>

        {/* Right Column: Availability & Schedule Generator */}
        <div className="lg:col-span-5 space-y-8">
          <AvailabilityGrid
            initialAvailability={availability}
            onSaveAvailability={handleSaveAvailability}
            isLoading={isLoading}
          />

          {/* AI Generator Card */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl border border-indigo-800 shadow-md space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-indigo-800/80">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold">
                Generate AI Study Schedule
              </h3>
            </div>

            <form onSubmit={handleGenerateSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-indigo-200 mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  required
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-indigo-950/60 border border-indigo-700/60 rounded-xl text-white placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="e.g. Midterm Acceleration Plan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-indigo-200 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-indigo-950/60 border border-indigo-700/60 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-indigo-200 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-indigo-950/60 border border-indigo-700/60 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-indigo-200 mb-1">
                  Daily Maximum Study Time (mins)
                </label>
                <input
                  type="number"
                  min="30"
                  max="720"
                  step="30"
                  value={dailyMaxMinutes}
                  onChange={(e) => setDailyMaxMinutes(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-indigo-950/60 border border-indigo-700/60 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div className="text-xs text-indigo-300">
                AI will optimize schedule for{" "}
                <strong>{selectedSubjectIds.length}</strong> selected subjects.
              </div>

              <button
                type="submit"
                disabled={isGenerating || subjects.length === 0}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>
                  {isGenerating
                    ? "Synthesizing Schedule..."
                    : "Generate AI Study Schedule"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubjectsAvailabilityPage;
