import React from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, Trash2, ArrowRight, BookOpen } from "lucide-react";

export const BookmarkList = ({ bookmarks = [], onRemoveBookmark }) => {
  const navigate = useNavigate();

  if (!bookmarks || bookmarks.length === 0) {
    return (
      <div className="p-8 border border-slate-800 bg-[#171B26]/60 rounded-2xl text-center">
        <Bookmark size={32} className="mx-auto text-slate-600 mb-2" />
        <h4 className="text-sm font-bold text-slate-300">No Saved Bookmarks</h4>
        <p className="text-xs text-slate-500 mt-1">
          Bookmark tutorials during your study sessions for quick reference and
          spaced repetition.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookmarks.map((b) => {
        const tutorial = b.tutorial || b;
        const title = tutorial.title || "Introduction to Neural Activations";
        const trackTitle =
          tutorial.track_title || tutorial.module_title || "AI/ML Fundamentals";
        const readTime = tutorial.reading_time || "15 min read";
        const slug = tutorial.slug || tutorial.id;

        return (
          <div
            key={b.id || tutorial.id || slug}
            className="p-4 bg-[#171B26] border border-slate-700/70 hover:border-indigo-500/40 rounded-xl flex items-center justify-between gap-4 transition-all group"
          >
            <div
              onClick={() => navigate(`/tutorials/${slug}`)}
              className="flex-1 cursor-pointer"
            >
              <div className="font-semibold text-white text-sm group-hover:text-indigo-300 transition-colors">
                {title}
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                <span className="text-indigo-400 font-medium">
                  {trackTitle}
                </span>
                <span>&bull;</span>
                <span>{readTime}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/tutorials/${slug}`)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Read Lesson"
              >
                <ArrowRight size={16} />
              </button>
              {onRemoveBookmark && (
                <button
                  onClick={() => onRemoveBookmark(tutorial.id || b.id)}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Remove Bookmark"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BookmarkList;
