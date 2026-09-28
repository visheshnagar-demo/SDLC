import React from "react";
import {
  Award,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  XCircle,
  Sparkles,
} from "lucide-react";

export const QuizScorecard = ({
  result = {
    scorePercentage: 80,
    passed: true,
    correctCount: 4,
    totalQuestions: 5,
    xpEarned: 100,
  },
  onRetry,
  onContinue,
}) => {
  const {
    scorePercentage = 0,
    passed = false,
    correctCount = 0,
    totalQuestions = 0,
  } = result;

  return (
    <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-8 max-w-lg mx-auto text-center shadow-2xl space-y-6">
      <div
        className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center border-2 shadow-xl ${
          passed
            ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-emerald-500/20"
            : "bg-red-500/10 border-red-500 text-red-400 shadow-red-500/20"
        }`}
      >
        {passed ? <Award size={40} /> : <XCircle size={40} />}
      </div>

      <div>
        <div className="text-5xl font-black text-white tracking-tight">
          {scorePercentage}%
        </div>
        <div className="mt-2">
          {passed ? (
            <span className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-full inline-flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Assessment Passed
            </span>
          ) : (
            <span className="px-4 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider rounded-full inline-flex items-center gap-1.5">
              <XCircle size={14} /> Needs Improvement
            </span>
          )}
        </div>
        <p className="text-sm text-slate-400 mt-3">
          You answered{" "}
          <span className="text-white font-bold">{correctCount}</span> out of{" "}
          <span className="text-white font-bold">{totalQuestions}</span>{" "}
          questions correctly.
        </p>
      </div>

      {passed && (
        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-4 flex items-center justify-center gap-3">
          <Sparkles className="text-indigo-400" size={18} />
          <span className="text-xs font-semibold text-indigo-300">
            +120 XP Earned &bull; Module Completion Badge Unlocked!
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          onClick={onRetry}
          className="w-full sm:w-1/2 py-3 px-4 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw size={14} />
          <span>Retake Quiz</span>
        </button>

        <button
          onClick={onContinue}
          className="w-full sm:w-1/2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
        >
          <span>Continue Journey</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default QuizScorecard;
