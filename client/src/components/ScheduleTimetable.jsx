import React, { useState } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  BookOpen,
  Filter,
} from "lucide-react";

export function ScheduleTimetable({
  sessions = [],
  subjects = [],
  onUpdateStatus,
  isLoading,
}) {
  const [selectedDay, setSelectedDay] = useState("ALL");
  const [selectedSubjectId, setSelectedSubjectId] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const subjectMap = React.useMemo(() => {
    const map = {};
    if (subjects && subjects.length > 0) {
      subjects.forEach((s) => {
        map[s.id] = s;
      });
    }
    return map;
  }, [subjects]);

  const filteredSessions = sessions.filter((session) => {
    if (selectedDay !== "ALL" && session.session_date !== selectedDay) {
      return false;
    }
    if (
      selectedSubjectId !== "ALL" &&
      session.subject_id !== selectedSubjectId
    ) {
      return false;
    }
    if (statusFilter !== "ALL" && session.status !== statusFilter) {
      return false;
    }
    return true;
  });

  // Group by session_date
  const groupedByDate = filteredSessions.reduce((acc, sess) => {
    const dateKey = sess.session_date || "Upcoming";
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(sess);
    return acc;
  }, {});

  const dates = Object.keys(groupedByDate).sort();

  const getStatusBadge = (status) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Completed
          </span>
        );
      case "SKIPPED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle className="w-3 h-3 text-slate-500" />
            Skipped
          </span>
        );
      case "RESCHEDULED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <RotateCcw className="w-3 h-3 text-purple-600" />
            Rescheduled
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-500" />
            Scheduled
          </span>
        );
    }
  };

  const handleStatusChange = (sessionId, newStatus) => {
    if (onUpdateStatus) {
      onUpdateStatus(sessionId, newStatus);
    }
  };

  if (!sessions || sessions.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
        <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-500 mx-auto flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">
          No Study Schedule Generated Yet
        </h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Add your study subjects and availability profile, then click{" "}
          <strong>"Generate AI Schedule"</strong> to automatically create an
          optimized calendar timetable.
        </p>
      </div>
    );
  }

  // Get unique dates for filter dropdown
  const allUniqueDates = Array.from(
    new Set(sessions.map((s) => s.session_date).filter(Boolean)),
  ).sort();

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filter Timetable:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              aria-label="Filter by date"
            >
              <option value="ALL">
                All Dates ({allUniqueDates.length} days)
              </option>
              {allUniqueDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              aria-label="Filter by subject"
            >
              <option value="ALL">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              aria-label="Filter by status"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Scheduled / Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="SKIPPED">Skipped</option>
              <option value="RESCHEDULED">Rescheduled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Date Sessions List */}
      <div className="space-y-6">
        {dates.map((dateKey) => {
          const daySessions = groupedByDate[dateKey];
          const formattedDate = new Date(dateKey).toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          });

          return (
            <div
              key={dateKey}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-sm text-slate-900">
                    {isNaN(new Date(dateKey).getTime())
                      ? dateKey
                      : formattedDate}
                  </span>
                  <span className="text-xs text-slate-500">({dateKey})</span>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                  {daySessions.length}{" "}
                  {daySessions.length === 1 ? "session" : "sessions"}
                </span>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {daySessions.map((session) => {
                  const subject = subjectMap[session.subject_id] || {
                    name: session.subject_name || "Study Subject",
                    color_tag: "#2563EB",
                  };

                  return (
                    <div
                      key={session.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: subject.color_tag || "#2563EB",
                              }}
                            />
                            <span className="font-bold text-sm text-slate-900">
                              {subject.name}
                            </span>
                          </div>
                          {getStatusBadge(session.status)}
                        </div>

                        <div className="text-xs text-slate-600 font-medium flex items-center space-x-3 mb-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {session.start_time || "Flexible"} (
                            {session.duration_minutes || 60} mins)
                          </span>
                        </div>

                        {session.topic_focus && (
                          <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-700 mb-3 flex items-start gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                            <span>
                              <strong>Focus:</strong> {session.topic_focus}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                        {session.status !== "COMPLETED" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(session.id, "COMPLETED")
                            }
                            disabled={isLoading}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1 border border-emerald-200"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Mark Complete
                          </button>
                        )}
                        {session.status !== "SKIPPED" &&
                          session.status !== "COMPLETED" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(session.id, "SKIPPED")
                              }
                              disabled={isLoading}
                              className="px-2.5 py-1 text-xs font-semibold bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                            >
                              Skip
                            </button>
                          )}
                        {session.status !== "RESCHEDULED" &&
                          session.status !== "COMPLETED" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(session.id, "RESCHEDULED")
                              }
                              disabled={isLoading}
                              className="px-2.5 py-1 text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
                            >
                              Reschedule
                            </button>
                          )}
                        {session.status === "COMPLETED" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(session.id, "PENDING")
                            }
                            disabled={isLoading}
                            className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ScheduleTimetable;
