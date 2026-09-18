import React from "react";
import PropTypes from "prop-types";
import TaskItem from "./TaskItem";

export default function TaskList({
  tasks,
  loading,
  error,
  onToggle,
  onEdit,
  onDelete,
  onRetry,
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3 py-8 items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-medium">Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
        <p className="text-sm font-semibold text-red-700">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
        <div className="w-12 h-12 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-xl mb-3">
          📋
        </div>
        <h3 className="text-sm font-semibold text-slate-800">No tasks found</h3>
        <p className="text-xs text-slate-500 mt-1">
          Create a new task above or adjust your filter/search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

TaskList.propTypes = {
  tasks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      is_completed: PropTypes.bool.isRequired,
      created_at: PropTypes.string,
      updated_at: PropTypes.string,
    }),
  ).isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onToggle: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRetry: PropTypes.func,
};
