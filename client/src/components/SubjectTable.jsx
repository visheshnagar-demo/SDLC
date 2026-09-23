import React from "react";
import { BookOpen, Calendar, Clock, Trash2, CheckCircle2 } from "lucide-react";

export function SubjectTable({
  subjects = [],
  selectedSubjectIds = [],
  onToggleSelect,
  onDeleteSubject,
  isLoading,
}) {
  const getDaysRemaining = (targetDateStr) => {
    if (!targetDateStr) return null;
    const target = new Date(targetDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDifficultyBadge = (level) => {
    switch (level) {
      case 1:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            1 - Easy
          </span>
        );
      case 2:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            2 - Moderate
          </span>
        );
      case 3:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
            3 - Intermediate
          </span>
        );
      case 4:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
            4 - Hard
          </span>
        );
      case 5:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            5 - Intense
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
            Level {level}
          </span>
        );
    }
  };

  if (!subjects || subjects.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 mx-auto flex items-center justify-center mb-3">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">
          No subjects added yet
        </h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          Add your courses, exam topics, or learning modules using the form to
          let AI build your study plan.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">
            Configured Subjects ({subjects.length})
          </h2>
        </div>
        <div className="text-xs text-slate-500">
          {selectedSubjectIds.length} of {subjects.length} selected for AI
          schedule
        </div>
      </div>

      <div className="overflow-x-auto">
        <table
          className="w-full text-left text-sm text-slate-600"
          aria-label="Configured Subjects Table"
        >
          <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th scope="col" className="p-3.5 w-10 text-center">
                Select
              </th>
              <th scope="col" className="p-3.5">
                Subject
              </th>
              <th scope="col" className="p-3.5">
                Difficulty
              </th>
              <th scope="col" className="p-3.5">
                Target Exam Date
              </th>
              <th scope="col" className="p-3.5">
                Est. Hours
              </th>
              <th scope="col" className="p-3.5 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subjects.map((subj) => {
              const daysLeft = getDaysRemaining(subj.target_date);
              const isSelected = selectedSubjectIds.includes(subj.id);

              return (
                <tr
                  key={subj.id || subj.name}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isSelected ? "bg-blue-50/30" : ""
                  }`}
                >
                  <td className="p-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect && onToggleSelect(subj.id)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                      aria-label={`Select ${subj.name}`}
                    />
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: subj.color_tag || "#2563EB" }}
                      />
                      <span className="font-semibold text-slate-900">
                        {subj.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-3.5">
                    {getDifficultyBadge(subj.difficulty_level)}
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center space-x-1.5 text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{subj.target_date}</span>
                      {daysLeft !== null && (
                        <span
                          className={`ml-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${
                            daysLeft < 0
                              ? "bg-red-100 text-red-700"
                              : daysLeft <= 7
                                ? "bg-amber-100 text-amber-700 font-semibold"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {daysLeft < 0
                            ? "Overdue"
                            : daysLeft === 0
                              ? "Today"
                              : `${daysLeft}d left`}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center space-x-1 font-medium text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{subj.estimated_total_hours}h</span>
                    </div>
                  </td>
                  <td className="p-3.5 text-right">
                    {onDeleteSubject && (
                      <button
                        type="button"
                        onClick={() => onDeleteSubject(subj.id)}
                        disabled={isLoading}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete subject"
                        aria-label={`Delete ${subj.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SubjectTable;
