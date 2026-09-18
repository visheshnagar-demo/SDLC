import React, { useState } from "react";
import PropTypes from "prop-types";
import { createTodo } from "../services/api";

export default function TaskCreateForm({ onTaskCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Task title is required.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const newTask = await createTodo({
        title: trimmedTitle,
        description: description.trim() ? description.trim() : null,
      });
      setTitle("");
      setDescription("");
      if (onTaskCreated) {
        onTaskCreated(newTask);
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d) => d.msg).join(", "));
      } else if (typeof detail === "string") {
        setError(detail);
      } else {
        setError("Failed to create task. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 mb-4">Create New Task</h2>
      {error && (
        <div
          role="alert"
          className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg"
        >
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="task-title" className="sr-only">
            Task title
          </label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title (e.g. Buy groceries)"
            disabled={loading}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="task-description" className="sr-only">
            Task description
          </label>
          <textarea
            id="task-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional details, items, notes...)"
            rows={3}
            disabled={loading}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:opacity-50"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm px-6 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? "Adding..." : "+ Add Task"}
          </button>
        </div>
      </form>
    </div>
  );
}

TaskCreateForm.propTypes = {
  onTaskCreated: PropTypes.func.isRequired,
};
