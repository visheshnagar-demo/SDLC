import React from "react";
import { Search, SlidersHorizontal, Filter, X } from "lucide-react";

export const FilterBar = ({
  searchQuery,
  onSearchChange,
  selectedDifficulty,
  onDifficultyChange,
  selectedCategory,
  onCategoryChange,
  categories = [
    "All Categories",
    "Mathematics",
    "Supervised",
    "Unsupervised",
    "Deep Learning",
    "NLP",
    "Computer Vision",
    "MLOps",
  ],
  difficulties = ["All Levels", "Beginner", "Intermediate", "Advanced"],
  totalCount = 0,
}) => {
  return (
    <div className="bg-[#1E293B]/70 border border-slate-700/80 rounded-2xl p-4 mb-8 backdrop-blur-sm space-y-4">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search learning tracks, algorithms, neural architectures..."
            className="w-full bg-[#0F172A] border border-slate-700 pl-10 pr-10 py-2.5 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Difficulty Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <Filter
            size={16}
            className="text-slate-400 shrink-0 hidden sm:block"
          />
          <div className="flex items-center gap-1.5 bg-[#0F172A] p-1 border border-slate-700 rounded-xl">
            {difficulties.map((diff) => {
              const isSelected =
                selectedDifficulty === diff ||
                (!selectedDifficulty && diff === "All Levels");
              return (
                <button
                  key={diff}
                  onClick={() =>
                    onDifficultyChange(diff === "All Levels" ? "" : diff)
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {diff}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-700/50 no-scrollbar">
        <span className="text-xs text-slate-400 font-medium shrink-0">
          Topic:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {categories.map((cat) => {
            const isSelected =
              selectedCategory === cat ||
              (!selectedCategory && cat === "All Categories");
            return (
              <button
                key={cat}
                onClick={() =>
                  onCategoryChange(cat === "All Categories" ? "" : cat)
                }
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-semibold"
                    : "bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
        <div className="ml-auto text-xs text-slate-400 font-medium shrink-0 hidden sm:block">
          Showing{" "}
          <span className="text-indigo-400 font-bold">{totalCount}</span> tracks
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
