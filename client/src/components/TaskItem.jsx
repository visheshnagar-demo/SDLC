import React from "react";
import PropTypes from "prop-types";

export default function TaskItem({ task, onToggle, onEdit, onDelete }) {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      className={`bg-white p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
        task.is_completed
          ? "border-slate-200 opacity-80 bg-slate-50/50"
          : "border-slate-200 hover:border-slate-300 shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <input
          type="checkbox"
          checked={Boolean(task.is_completed)}
          onChange={() => onToggle(task)}
          aria-label={`Mark "${task.title}" as ${task.is_completed ? "incomplete" : "complete"}`}
          className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <h3
            className={`text-sm font-semibold truncate ${
              task.is_completed
                ? "line-through text-slate-400"
                : "text-slate-900"
            }`}
          >
            {task.title}
          </h3>
          {task.description && (
            <p
              className={`text-xs mt-0.5 whitespace-pre-wrap break-words ${
                task.is_completed ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {task.description}
            </p>
          )}
          <span className="inline-block mt-2 text-[10px] font-medium text-slate-400">
            Created {formatDate(task.created_at)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
            task.is_completed
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-blue-50 text-indigo-700 border-blue-200"
          }`}
        >
          {task.is_completed ? "Completed" : "Active"}
        </span>
        <button
          type="button"
          onClick={() => onEdit(task)}
          aria-label={`Edit task "${task.title}"`}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          ✏️
        </button>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          aria-label={`Delete task "${task.title}"`}
          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

TaskItem.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    is_completed: PropTypes.bool.isRequired,
    created_at: PropTypes.string,
    updated_at: PropTypes.string,
  }).isRequired,
  onToggle: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
