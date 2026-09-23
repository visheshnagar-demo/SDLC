import React from "react";
import {
  AlertTriangle,
  Sparkles,
  TrendingUp,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export function PriorityDirectiveList({
  priorities = [],
  subjects = [],
  onApplyAdjustment,
}) {
  const subjectMap = React.useMemo(() => {
    const map = {};
    if (subjects && subjects.length > 0) {
      subjects.forEach((s) => {
        map[s.id] = s;
      });
    }
    return map;
  }, [subjects]);

  const sortedPriorities = [...priorities].sort(
    (a, b) => (a.priority_rank || 99) - (b.priority_rank || 99),
  );

  const getUrgencyBadge = (score) => {
    if (score >= 80) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
          Urgency: {score}% (High)
        </span>
      );
    }
    if (score >= 50) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          Urgency: {score}% (Moderate)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        Urgency: {score}% (Stable)
      </span>
    );
  };

  if (!priorities || priorities.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 mx-auto flex items-center justify-center mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">
          No Priority Recommendations Yet
        </h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          Generate an AI study schedule to receive tailored priority rankings
          and study pacing directives.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-bold text-slate-900">
            AI Ranked Study Priorities & Recommendations
          </h2>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
          {priorities.length} Action Directives
        </span>
      </div>

      <div className="space-y-4">
        {sortedPriorities.map((item, idx) => {
          const subject = subjectMap[item.subject_id] || {
            name: item.subject_name || `Subject ${idx + 1}`,
            color_tag: "#7C3AED",
          };

          return (
            <div
              key={item.id || idx}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start space-x-3.5">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
                  #{item.priority_rank || idx + 1}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{
                        backgroundColor: subject.color_tag || "#7C3AED",
                      }}
                    />
                    <h3 className="font-bold text-sm text-slate-900">
                      {subject.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {item.recommendation_text ||
                      "Focus intense problem-solving sessions during peak energy hours to ensure retention before target exam."}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end space-x-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
                {getUrgencyBadge(item.urgency_score || 75)}
                {onApplyAdjustment && (
                  <button
                    type="button"
                    onClick={() => onApplyAdjustment(item)}
                    className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Optimize allocation"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PriorityDirectiveList;
