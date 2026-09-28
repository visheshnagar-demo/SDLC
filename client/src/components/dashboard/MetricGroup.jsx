import React from "react";
import { Award, Flame, CheckCircle2, Clock } from "lucide-react";

export const MetricGroup = ({
  completionPercentage = 42.5,
  completedModules = 8,
  totalModules = 20,
  streakDays = 14,
  quizzesPassed = 8,
  totalQuizzes = 8,
  avgScore = 92,
  studyHours = 36.5,
}) => {
  const metrics = [
    {
      label: "Overall Completion",
      value: `${completionPercentage}%`,
      subtext: `${completedModules} / ${totalModules} Modules Done`,
      icon: CheckCircle2,
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/20",
    },
    {
      label: "Learning Streak",
      value: `${streakDays} Days 🔥`,
      subtext: "Active Daily Habit",
      icon: Flame,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      label: "Quizzes Passed",
      value: `${quizzesPassed} / ${totalQuizzes}`,
      subtext: `Avg Score: ${avgScore}%`,
      icon: Award,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      label: "Study Hours",
      value: `${studyHours}h`,
      subtext: "Total Time Invested",
      icon: Clock,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {metrics.map((m, idx) => {
        const Icon = m.icon;
        return (
          <div
            key={idx}
            className="bg-[#171B26] border border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-600 transition-all shadow-lg shadow-black/20"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">
                {m.label}
              </span>
              <div
                className={`p-2 rounded-xl ${m.bgColor} border ${m.borderColor} ${m.color}`}
              >
                <Icon size={16} />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {m.value}
              </div>
              <span className="text-xs font-medium text-slate-400 mt-1 block">
                {m.subtext}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MetricGroup;
