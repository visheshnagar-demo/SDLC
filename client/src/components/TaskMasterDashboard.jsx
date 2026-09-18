import React, { useState, useEffect, useCallback, useMemo } from "react";
import StatCard from "./StatCard";
import TaskCreateForm from "./TaskCreateForm";
import TaskFilterToolbar from "./TaskFilterToolbar";
import TaskList from "./TaskList";
import TaskEditModal from "./TaskEditModal";
import { getTodos, updateTodo, deleteTodo } from "../services/api";

export default function TaskMasterDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all to maintain consistent client-side metrics and instant tab filtering
      const data = await getTodos({ status: "all", limit: 100 });
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        "Failed to load tasks from server. Please verify the backend is running.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Handle task created
  const handleTaskCreated = (newTask) => {
    if (newTask && newTask.id) {
      setTasks((prev) => [newTask, ...prev]);
    }
  };

  // Handle toggle task completion
  const handleToggleTask = async (task) => {
    try {
      const updated = await updateTodo(task.id, {
        is_completed: !task.is_completed,
      });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      setError("Failed to update task completion status.");
    }
  };

  // Handle open edit modal
  const handleEditClick = (task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  // Handle save from modal
  const handleSaveTask = async (id, payload) => {
    const updated = await updateTodo(id, payload);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  // Handle delete task
  const handleDeleteTask = async (id) => {
    await deleteTodo(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Dynamic statistics
  const metrics = useMemo(() => {
    const total = tasks.length;
    const active = tasks.filter((t) => !t.is_completed).length;
    const completed = tasks.filter((t) => t.is_completed).length;
    const rate = total > 0 ? ((completed / total) * 100).toFixed(1) : "0";

    return {
      total,
      active,
      completed,
      completionRate: `${rate}% Completion Rate`,
    };
  }, [tasks]);

  // Filtered and searched tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Status filter
      if (filter === "active" && task.is_completed) return false;
      if (filter === "completed" && !task.is_completed) return false;

      // Search keyword filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = task.title?.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query);
        return matchesTitle || matchesDesc;
      }

      return true;
    });
  }, [tasks, filter, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-inner">
            ✓
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            TaskMaster
          </span>
        </div>
        <div className="flex-1 max-w-md w-full relative">
          <label htmlFor="header-search" className="sr-only">
            Search tasks
          </label>
          <input
            id="header-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks by keyword..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
            🔍
          </span>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label="Total Tasks"
            value={metrics.total}
            subtext="All tracked items"
            colorScheme="slate"
          />
          <StatCard
            label="Active Tasks"
            value={metrics.active}
            subtext={`${metrics.active} pending`}
            colorScheme="indigo"
          />
          <StatCard
            label="Completed Tasks"
            value={metrics.completed}
            subtext={metrics.completionRate}
            colorScheme="emerald"
          />
        </div>

        {/* Task Creation Form */}
        <TaskCreateForm onTaskCreated={handleTaskCreated} />

        {/* Task List Section */}
        <div className="flex flex-col gap-4">
          <TaskFilterToolbar
            filter={filter}
            onFilterChange={setFilter}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            counts={{
              all: metrics.total,
              active: metrics.active,
              completed: metrics.completed,
            }}
          />

          <TaskList
            tasks={filteredTasks}
            loading={loading}
            error={error}
            onToggle={handleToggleTask}
            onEdit={handleEditClick}
            onDelete={handleDeleteTask}
            onRetry={fetchTasks}
          />
        </div>
      </main>

      {/* Edit Modal */}
      <TaskEditModal
        task={editingTask}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}
