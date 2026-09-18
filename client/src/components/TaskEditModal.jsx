import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

export default function TaskEditModal({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setIsCompleted(Boolean(task.is_completed));
      setError(null);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
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

  const handleSave = async (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Task title cannot be empty.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(task.id, {
        title: trimmedTitle,
        description: description.trim() ? description.trim() : null,
        is_completed: isCompleted,
      });
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d) => d.msg).join(", "));
      } else if (typeof detail === "string") {
        setError(detail);
      } else {
        setError("Failed to update task.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      await onDelete(task.id);
      onClose();
    } catch (err) {
      setError("Failed to delete task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
    >
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <h2 id="modal-title" className="text-lg font-bold text-slate-900">
              Edit Task Details
            </h2>
            <span className="text-xs font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
              UUID: {task.id.substring(0, 8)}...
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
          {error && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg"
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="edit-task-title"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Task Title *
            </label>
            <input
              id="edit-task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="edit-task-description"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="edit-task-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none disabled:opacity-50"
            />
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-1">
              Status
            </span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="modal-status"
                  checked={!isCompleted}
                  onChange={() => setIsCompleted(false)}
                  disabled={loading}
                  className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="modal-status"
                  checked={isCompleted}
                  onChange={() => setIsCompleted(true)}
                  disabled={loading}
                  className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                Completed
              </label>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex flex-col sm:flex-row justify-between gap-1">
            <span>Created: {formatDate(task.created_at)}</span>
            <span>Updated: {formatDate(task.updated_at)}</span>
          </div>
        </form>

        {/* Actions Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="text-red-600 hover:bg-red-50 disabled:opacity-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            🗑️ Delete Task
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || !title.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

TaskEditModal.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    is_completed: PropTypes.bool.isRequired,
    created_at: PropTypes.string,
    updated_at: PropTypes.string,
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
