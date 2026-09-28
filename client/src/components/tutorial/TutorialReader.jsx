import React from "react";
import { BookOpen, Sigma, Lightbulb, CheckCircle2 } from "lucide-react";

export const TutorialReader = ({
  tutorial,
  onMarkCompleted,
  isCompleted = false,
}) => {
  if (!tutorial) {
    return (
      <div className="p-8 text-center text-slate-400">
        <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
        <p>Select a lesson from the syllabus to start reading.</p>
      </div>
    );
  }

  // Helper to format mathematical formulas if present
  const renderMathSection = (formulas) => {
    if (!formulas) return null;
    return (
      <div className="bg-[#171B26] border border-indigo-500/30 rounded-2xl p-6 my-6 shadow-lg shadow-indigo-950/10">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-3">
          <Sigma size={16} />
          <span>Mathematical Formulation</span>
        </div>
        <div className="my-4 text-center bg-[#0B0F19] p-4 rounded-xl border border-slate-800 text-cyan-300 font-mono text-base sm:text-lg overflow-x-auto">
          {formulas}
        </div>
        <p className="text-xs text-slate-400 italic">
          Formal notation represents parameter updates across discrete
          time-steps or tensor dimensions.
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold rounded-md">
            LESSON GUIDE
          </span>
          {isCompleted && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
              <CheckCircle2 size={14} /> Completed
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
          {tutorial.title}
        </h1>
      </div>

      {/* Main Content Markdown / Paragraphs */}
      <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed space-y-4 text-sm sm:text-base">
        {tutorial.content_markdown ? (
          tutorial.content_markdown.split("\n\n").map((paragraph, idx) => {
            if (paragraph.startsWith("### ")) {
              return (
                <h3
                  key={idx}
                  className="text-lg font-bold text-white pt-4 pb-1 border-b border-slate-800"
                >
                  {paragraph.replace("### ", "")}
                </h3>
              );
            }
            if (paragraph.startsWith("## ")) {
              return (
                <h2
                  key={idx}
                  className="text-xl font-bold text-indigo-300 pt-6 pb-2 border-b border-slate-800"
                >
                  {paragraph.replace("## ", "")}
                </h2>
              );
            }
            if (paragraph.startsWith("# ")) {
              return (
                <h1
                  key={idx}
                  className="text-2xl font-black text-white pt-6 pb-2"
                >
                  {paragraph.replace("# ", "")}
                </h1>
              );
            }
            if (paragraph.startsWith("- ")) {
              const items = paragraph.split("\n- ");
              return (
                <ul
                  key={idx}
                  className="list-disc pl-5 space-y-1.5 text-slate-300"
                >
                  {items.map((it, i) => (
                    <li key={i}>{it.replace(/^- /, "")}</li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={idx} className="text-slate-300 leading-relaxed">
                {paragraph}
              </p>
            );
          })
        ) : (
          <p className="text-slate-400">
            Comprehensive tutorial notes and theoretical breakdown.
          </p>
        )}
      </div>

      {/* Math Formulation */}
      {renderMathSection(tutorial.math_formulas)}

      {/* Key Takeaways Callout */}
      <div className="bg-gradient-to-r from-slate-900 to-[#171B26] border border-slate-700/80 rounded-2xl p-5 flex items-start gap-4">
        <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
          <Lightbulb size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white mb-1">Key Takeaways</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Practice modifying the hyperparameters in the interactive code
            editor on the right to observe convergence dynamics, gradient
            clipping, or loss variance in real time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TutorialReader;
