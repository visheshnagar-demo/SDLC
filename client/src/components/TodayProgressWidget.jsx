import React from "react";
import { CheckCircle2, Flame, Clock, PlayCircle, Award } from "lucide-react";

export function TodayProgressWidget({
  sessions = [],
  subjects = [],
  onCompleteSession,
}) {
  const todayStr = new Date().toISOString().split("T")[0];

  const todaySessions = sessions.filter(
    (s) =>
      s.session_date === todayStr ||
      (!s.session_date && sessions.indexOf(s) < 3),
  );

  const completedCount = todaySessions.filter(
    (s) => s.status === "COMPLETED",
  ).length;
  const totalCount = todaySessions.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const plannedMinutes = todaySessions.reduce(
    (acc, s) => acc + (s.duration_minutes || 60),
    0,
  );
  const completedMinutes = todaySessions
    .filter((s) => s.status === "COMPLETED")
    .reduce((acc, s) => acc + (s.duration_minutes || 60), 0);

  const nextUpcoming = todaySessions.find((s) => s.status === "PENDING");

  const subjectMap = React.useMemo(() => {
    const map = {};
    if (subjects && subjects.length > 0) {
      subjects.forEach((s) => {
        map[s.id] = s;
      });
    }
    return map;
  }, [subjects]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Today's Study Progress
        </h3>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-bold border border-amber-200">
          <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span>4 Day Streak</span>
        </div>
      </div>

      {/* Progress Bar & Stats */}
      <div>
        <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1.5">
          <span>Completion Rate</span>
          <span className="text-blue-600 font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
          <span>
            {completedCount} of {totalCount} sessions done
          </span>
          <span>
            {(completedMinutes / 60).toFixed(1)} /{" "}
            {(plannedMinutes / 60).toFixed(1)} hrs
          </span>
        </div>
      </div>

      {/* Next Up Session */}
      {nextUpcoming ? (
        <div className="p-4 bg-gradient-to-br from-blue-50/60 to-indigo-50/60 rounded-xl border border-blue-100">
          <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Next Session Up
          </div>
          <div className="font-bold text-sm text-slate-900 mb-1">
            {subjectMap[nextUpcoming.subject_id]?.name || "Study Session"}
          </div>
          {nextUpcoming.topic_focus && (
            <div className="text-xs text-slate-600 mb-3">
              Focus: {nextUpcoming.topic_focus}
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-semibold text-slate-700">
              {nextUpcoming.start_time || "Flexible"} (
              {nextUpcoming.duration_minutes || 60}m)
            </span>
            {onCompleteSession && (
              <button
                type="button"
                onClick={() => onCompleteSession(nextUpcoming.id, "COMPLETED")}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Complete
              </button>
            )}
          </div>
        </div>
      ) : totalCount > 0 && completedCount === totalCount ? (
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
          <div className="text-xs font-bold text-emerald-800">
            All Goals Completed for Today!
          </div>
          <div className="text-xs text-emerald-600 mt-0.5">
            Great job keeping up your study pace.
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
          No active sessions scheduled for today.
        </div>
      )}
    </div>
  );
}

export default TodayProgressWidget;
