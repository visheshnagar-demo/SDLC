import React from "react";
import { useNavigate } from "react-router-dom";
import { Clock, BookMarked, ArrowRight, CheckCircle2 } from "lucide-react";

export const TrackCard = ({
  track,
  onStart,
  onBookmark,
  isBookmarked = false,
}) => {
  const navigate = useNavigate();

  const getDifficultyBadge = (difficulty) => {
    const diff = (difficulty || "Beginner").toLowerCase();
    if (diff === "beginner") {
      return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
    }
    if (diff === "intermediate") {
      return "bg-indigo-500/10 border-indigo-500/30 text-indigo-400";
    }
    return "bg-purple-500/10 border-purple-500/30 text-purple-400";
  };

  const handleStart = () => {
    if (onStart) {
      onStart(track);
    } else {
      navigate(`/tracks/${track.slug || track.id}`);
    }
  };

  const handleCurriculum = () => {
    navigate(`/tracks/${track.slug || track.id}`);
  };

  const modulesCount =
    track.modules_count || (track.modules ? track.modules.length : 6);
  const hours = track.estimated_hours || 10;

  return (
    <div className="bg-[#1E293B] border border-slate-700/80 hover:border-indigo-500/50 transition-all rounded-2xl p-6 flex flex-col justify-between shadow-lg shadow-black/20 group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <span
            className={`px-2.5 py-1 border text-xs rounded-full font-semibold ${getDifficultyBadge(track.difficulty)}`}
          >
            {track.difficulty || "Beginner"}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock size={13} className="text-slate-400" />
            <span>
              {hours}h &bull; {modulesCount} Modules
            </span>
          </div>
        </div>

        <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
          {track.title}
        </h3>

        <p className="text-sm text-slate-400 mt-2 line-clamp-3 leading-relaxed">
          {track.description}
        </p>

        {track.tags && track.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {track.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-slate-800/80 border border-slate-700/60 rounded text-[11px] font-mono text-cyan-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center gap-3">
        <button
          onClick={handleStart}
          className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5"
        >
          <span>Start Track</span>
          <ArrowRight size={14} />
        </button>
        <button
          onClick={handleCurriculum}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-colors"
        >
          Curriculum
        </button>
      </div>
    </div>
  );
};

export default TrackCard;
