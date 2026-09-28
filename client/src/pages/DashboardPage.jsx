import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { progressApi, bookmarksApi } from "../services/api";
import MetricGroup from "../components/dashboard/MetricGroup";
import BookmarkList from "../components/dashboard/BookmarkList";
import { Sparkles, Play, ArrowRight, BookOpen, Layers } from "lucide-react";

const DEFAULT_BOOKMARKS = [
  {
    id: "b1",
    tutorial_id: "t-backprop",
    title: "Backpropagation Matrix Calculus & Tensor Gradients",
    track_title: "Deep Learning Architectures",
    reading_time: "15 min read",
    slug: "backpropagation-matrix-calculus",
  },
  {
    id: "b2",
    tutorial_id: "t-self-attention",
    title: "Self-Attention Mechanism & Scaled Dot-Product",
    track_title: "NLP & Large Language Models",
    reading_time: "25 min read",
    slug: "self-attention-mechanism",
  },
];

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [progress, setProgress] = useState(null);
  const [bookmarks, setBookmarks] = useState(DEFAULT_BOOKMARKS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [progData, bmarkData] = await Promise.allSettled([
          progressApi.getProgress(),
          bookmarksApi.getBookmarks(),
        ]);

        if (progData.status === "fulfilled" && progData.value) {
          setProgress(progData.value);
        }
        if (
          bmarkData.status === "fulfilled" &&
          Array.isArray(bmarkData.value) &&
          bmarkData.value.length > 0
        ) {
          setBookmarks(bmarkData.value);
        }
      } catch {
        // Fallback default state
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleRemoveBookmark = async (tutorialId) => {
    try {
      await bookmarksApi.removeBookmark(tutorialId);
    } catch {
      // non-blocking
    }
    setBookmarks((prev) =>
      prev.filter((b) => b.id !== tutorialId && b.tutorial_id !== tutorialId),
    );
  };

  const displayName = user?.full_name || "AI/ML Learner";

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      {/* Welcome Hero Card */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-3xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              LEARNER PROFILE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome back, {displayName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Level 14 &bull; ML Practitioner &bull; 1,420 XP Earned
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-bold rounded-xl flex items-center gap-1.5">
            <Sparkles size={14} className="text-indigo-400" />
            <span>PRO PRACTITIONER</span>
          </span>
        </div>
      </div>

      {/* KPI Metric Group */}
      <MetricGroup
        completionPercentage={progress?.overall_completion_percentage || 42.5}
        completedModules={progress?.completed_modules || 8}
        totalModules={progress?.total_modules || 20}
        streakDays={14}
        quizzesPassed={progress?.quizzes_passed || 8}
        totalQuizzes={8}
        avgScore={92}
        studyHours={36.5}
      />

      {/* Two-Column Grid: Continue Learning & Saved Bookmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Continue Learning Active Card */}
        <div className="lg:col-span-7 bg-[#1E293B] border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Play size={18} className="text-indigo-400 fill-indigo-400" />
                <span>Continue Learning</span>
              </h3>
              <span className="text-xs text-indigo-400 font-semibold">
                In Progress
              </span>
            </div>

            <div className="bg-[#171B26] border border-indigo-500/30 rounded-2xl p-5 mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-indigo-400 uppercase">
                  Supervised Learning Mastery
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold">
                  60% Complete
                </span>
              </div>
              <h4 className="text-base font-bold text-white mt-1">
                Decision Trees & Information Gain
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Lesson 2 of 4 &bull; Entropy & Shannon Information Formulations
              </p>

              <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
                <div className="bg-indigo-500 h-full w-[60%] rounded-full" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Estimated remaining: 20 mins
            </span>
            <button
              onClick={() =>
                navigate("/tutorials/gradient-descent-optimization")
              }
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2"
            >
              <span>Resume Lesson</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Saved Bookmarks */}
        <div className="lg:col-span-5 bg-[#1E293B] border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen size={18} className="text-cyan-400" />
              <span>Saved Bookmarks</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {bookmarks.length} Items
            </span>
          </div>

          <div className="flex-1">
            <BookmarkList
              bookmarks={bookmarks}
              onRemoveBookmark={handleRemoveBookmark}
            />
          </div>
        </div>
      </div>
    </main>
  );
};

export default DashboardPage;
