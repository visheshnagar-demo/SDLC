import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  PlayCircle,
  Lock,
  BookOpen,
  HelpCircle,
  Clock,
} from "lucide-react";

export const ModuleAccordion = ({
  module,
  moduleIndex = 1,
  isOpenDefault = false,
  isCompleted = false,
  userProgress = {},
  onSelectTutorial,
}) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault);
  const navigate = useNavigate();

  const tutorials = module.tutorials || [];
  const quiz = module.quiz;
  const estimatedMin = module.estimated_minutes || 45;

  const handleTutorialClick = (tutorial) => {
    if (onSelectTutorial) {
      onSelectTutorial(tutorial);
    } else {
      navigate(`/tutorials/${tutorial.slug || tutorial.id}`);
    }
  };

  const handleQuizClick = (e) => {
    e.stopPropagation();
    navigate(`/quiz/${module.id}`);
  };

  return (
    <div
      className={`bg-[#171B26] border rounded-2xl transition-all overflow-hidden ${
        isCompleted
          ? "border-emerald-500/30"
          : isOpen
            ? "border-indigo-500/50 shadow-lg shadow-indigo-950/20"
            : "border-slate-800 hover:border-slate-700"
      }`}
    >
      {/* Module Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-5 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
              isCompleted
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
            }`}
          >
            {isCompleted ? "✓" : moduleIndex}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-bold text-base hover:text-indigo-300 transition-colors">
                {module.title}
              </span>
              <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] text-slate-400 font-medium">
                {module.difficulty || "Intermediate"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {tutorials.length} Lessons &bull; {estimatedMin} mins{" "}
              {quiz && "&bull; Practice Quiz Included"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isCompleted ? (
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-full font-semibold hidden sm:inline-block">
              Completed ✓
            </span>
          ) : (
            <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs rounded-full font-semibold hidden sm:inline-block">
              In Progress
            </span>
          )}
          <button className="p-1 text-slate-400 hover:text-white">
            {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* Module Content / Lessons List */}
      {isOpen && (
        <div className="px-5 pb-5 pt-1 border-t border-slate-800/80 space-y-2">
          {module.summary && (
            <p className="text-xs text-slate-300 py-2 leading-relaxed bg-slate-900/50 px-3 rounded-lg border border-slate-800/60 mb-3">
              {module.summary}
            </p>
          )}

          <div className="space-y-2">
            {tutorials.map((tutorial, idx) => {
              const tutCompleted =
                userProgress[`tutorial_${tutorial.id}`] || false;
              return (
                <div
                  key={tutorial.id || idx}
                  onClick={() => handleTutorialClick(tutorial)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/90 border border-slate-700/40 hover:border-indigo-500/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-slate-400 group-hover:text-indigo-400">
                      {tutCompleted ? (
                        <CheckCircle size={16} className="text-emerald-400" />
                      ) : (
                        <PlayCircle size={16} className="text-indigo-400" />
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                        {idx + 1}. {tutorial.title}
                      </span>
                      {tutorial.math_formulas && (
                        <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 rounded">
                          Math
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg opacity-90 group-hover:opacity-100 transition-opacity">
                      {tutCompleted ? "Review" : "Start"}
                    </button>
                  </div>
                </div>
              );
            })}

            {quiz && (
              <div
                onClick={handleQuizClick}
                className="flex items-center justify-between p-3 rounded-xl bg-indigo-950/20 hover:bg-indigo-950/40 border border-indigo-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle size={16} className="text-indigo-400" />
                  <span className="text-sm font-bold text-indigo-300">
                    Assessment: {quiz.title || `${module.title} Quiz`}
                  </span>
                </div>
                <button className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm">
                  Take Quiz →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleAccordion;
