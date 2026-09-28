import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { tracksApi, bookmarksApi, progressApi } from "../services/api";
import ModuleAccordion from "../components/curriculum/ModuleAccordion";
import {
  BookOpen,
  Bookmark,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronLeft,
  Award,
  Layers,
} from "lucide-react";

const FALLBACK_MODULES = [
  {
    id: "m1",
    title: "Linear Regression & Cost Functions",
    slug: "linear-regression-and-cost-functions",
    summary:
      "Mathematical formulation of ordinary least squares, mean squared error loss surfaces, and analytical normal equations.",
    difficulty: "Beginner",
    estimated_minutes: 45,
    order_index: 1,
    tutorials: [
      {
        id: "t1",
        title: "Hypothesis Function & Residuals",
        slug: "hypothesis-function-and-residuals",
      },
      {
        id: "t2",
        title: "Mean Squared Error (MSE) Derivation",
        slug: "mean-squared-error-derivation",
      },
      {
        id: "t3",
        title: "Analytical Solution via Normal Equations",
        slug: "normal-equations-solution",
      },
    ],
    quiz: {
      id: "q1",
      title: "Linear Regression Fundamentals",
      passing_score: 70,
    },
  },
  {
    id: "m2",
    title: "Gradient Descent & Convex Optimization",
    slug: "gradient-descent-optimization",
    summary:
      "First-order iterative optimization algorithms, learning rate schedules, stochastic gradient descent (SGD), and momentum.",
    difficulty: "Intermediate",
    estimated_minutes: 60,
    order_index: 2,
    tutorials: [
      {
        id: "t4",
        title: "Gradient Vector & Direction of Steepest Descent",
        slug: "gradient-vector-derivation",
      },
      {
        id: "t5",
        title: "Batch vs Stochastic Gradient Descent",
        slug: "batch-vs-sgd",
      },
      {
        id: "t6",
        title: "Adaptive Learning Rates: Adam & RMSprop",
        slug: "adam-rmsprop-optimizers",
      },
    ],
    quiz: { id: "q2", title: "Gradient Descent Assessment", passing_score: 70 },
  },
  {
    id: "m3",
    title: "Decision Trees & Information Gain",
    slug: "decision-trees-and-information-gain",
    summary:
      "Recursive partitioning, Shannon Entropy, Gini Impurity, ID3 / CART algorithms, and cost-complexity pruning.",
    difficulty: "Intermediate",
    estimated_minutes: 50,
    order_index: 3,
    tutorials: [
      {
        id: "t7",
        title: "Shannon Entropy & Information Entropy",
        slug: "shannon-entropy-calculation",
      },
      {
        id: "t8",
        title: "Splitting Criteria: Gini Impurity vs Entropy",
        slug: "gini-impurity-splits",
      },
      {
        id: "t9",
        title: "Pruning Strategies & Overfitting Prevention",
        slug: "tree-pruning-overfitting",
      },
    ],
    quiz: {
      id: "q3",
      title: "Decision Tree Evaluation Quiz",
      passing_score: 70,
    },
  },
  {
    id: "m4",
    title: "Support Vector Machines & Kernel Trick",
    slug: "svm-and-kernel-trick",
    summary:
      "Maximum margin hyperplanes, Lagrange multipliers, dual optimization, and Radial Basis Function (RBF) kernel mapping.",
    difficulty: "Advanced",
    estimated_minutes: 75,
    order_index: 4,
    tutorials: [
      {
        id: "t10",
        title: "Hard vs Soft Margin Formulation",
        slug: "svm-margin-formulation",
      },
      {
        id: "t11",
        title: "The Kernel Trick & Mercer Theorem",
        slug: "kernel-trick-rbf",
      },
    ],
    quiz: {
      id: "q4",
      title: "Support Vector Machines Quiz",
      passing_score: 70,
    },
  },
];

export const TrackDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [userProgress, setUserProgress] = useState({});

  useEffect(() => {
    const fetchTrackDetail = async () => {
      setLoading(true);
      try {
        const data = await tracksApi.getTrackBySlug(slug);
        if (data && data.title) {
          setTrack(data);
        } else {
          setTrack({
            id: "2",
            title: "Supervised Learning Mastery",
            slug: slug || "supervised-learning-mastery",
            description:
              "From statistical hypothesis testing and linear regression to non-linear decision trees, support vector machines, and ensemble methods.",
            difficulty: "Beginner",
            estimated_hours: 16,
            modules: FALLBACK_MODULES,
          });
        }
      } catch {
        setTrack({
          id: "2",
          title: "Supervised Learning Mastery",
          slug: slug || "supervised-learning-mastery",
          description:
            "From statistical hypothesis testing and linear regression to non-linear decision trees, support vector machines, and ensemble methods.",
          difficulty: "Beginner",
          estimated_hours: 16,
          modules: FALLBACK_MODULES,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTrackDetail();
  }, [slug]);

  const handleEnroll = () => {
    setIsEnrolled(true);
  };

  const handleToggleBookmark = async () => {
    setIsBookmarked(!isBookmarked);
  };

  const modules =
    track?.modules && track.modules.length > 0
      ? track.modules
      : FALLBACK_MODULES;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link
          to="/tracks"
          className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
        >
          <ChevronLeft size={16} />
          <span>Back to All Tracks</span>
        </Link>
      </div>

      {/* Track Hero Banner */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-3xl p-6 sm:p-8 mb-8 shadow-xl">
        <div className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
          <span>TRACKS</span>
          <span>&gt;</span>
          <span className="text-slate-300">
            {track?.title || "Track Curriculum"}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
          {track?.title}
        </h1>

        <p className="text-slate-300 mt-2.5 max-w-3xl text-sm sm:text-base leading-relaxed">
          {track?.description}
        </p>

        <div className="mt-6 pt-6 border-t border-slate-700/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleEnroll}
              className={`px-6 py-2.5 text-xs font-bold rounded-xl transition-all shadow-md ${
                isEnrolled
                  ? "bg-emerald-600 text-white shadow-emerald-600/20"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
              }`}
            >
              {isEnrolled ? "Enrolled in Track ✓" : "Enroll in Track"}
            </button>

            <button
              onClick={handleToggleBookmark}
              className={`px-4 py-2.5 border text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
                isBookmarked
                  ? "bg-indigo-950/40 border-indigo-500/50 text-indigo-300"
                  : "bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-300"
              }`}
            >
              <Bookmark
                size={14}
                className={
                  isBookmarked ? "fill-indigo-400 text-indigo-400" : ""
                }
              />
              <span>{isBookmarked ? "Bookmarked" : "Bookmark"}</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div>
              Progress:{" "}
              <span className="text-emerald-400 font-bold">38% Completed</span>{" "}
              (Module 1 of {modules.length})
            </div>
            <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full w-[38%] rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Modules List & Syllabus Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Modules Accordion List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers size={18} className="text-indigo-400" />
              <span>Curriculum Modules</span>
            </h2>
            <span className="text-xs text-slate-400">
              {modules.length} Core Modules
            </span>
          </div>

          {modules.map((mod, idx) => (
            <ModuleAccordion
              key={mod.id || idx}
              module={mod}
              moduleIndex={idx + 1}
              isOpenDefault={idx === 0}
              isCompleted={idx === 0}
              userProgress={userProgress}
            />
          ))}
        </div>

        {/* Syllabus & Skills Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-400" />
              <span>Skills & Competencies</span>
            </h3>

            <ul className="text-xs text-slate-300 space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">&bull;</span>
                <span>NumPy vectorization & loss gradient computation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">&bull;</span>
                <span>Decision tree recursive boundary splitting</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">&bull;</span>
                <span>Support vector dual margin optimization</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">&bull;</span>
                <span>Cross-validation & hyperparameter tuning</span>
              </li>
            </ul>

            <div className="mt-6 pt-5 border-t border-slate-700/60">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Prerequisites
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Basic Python proficiency and foundational linear algebra
                (vectors, matrix multiplication).
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl text-center">
            <Award size={36} className="mx-auto text-indigo-400 mb-2" />
            <h4 className="text-sm font-bold text-white">Track Certificate</h4>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Pass all module practice quizzes with &ge; 70% to unlock your
              verifiable AI/ML completion credential.
            </p>
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-lg border border-indigo-500/30 inline-block">
              Certificate of Mastery
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackDetailPage;
