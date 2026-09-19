import React from "react";
import {
  Radio,
  ArrowUp,
  ArrowDown,
  Play,
  Pause,
  Trash2,
  CheckCircle2,
} from "lucide-react";

export default function TickerQueueManager({
  articles = [],
  onPublishTicker,
  onRemoveTicker,
}) {
  const tickerItems = articles.filter(
    (a) =>
      a.is_ticker_item || a.priority === "URGENT" || a.priority === "FLASH",
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl p-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center space-x-2">
          <Radio className="w-5 h-5 text-teal-400 animate-pulse" />
          <h3 className="font-bold text-sm text-slate-100">
            Lower-Third Live News Ticker Stream Manager
          </h3>
        </div>
        <span className="text-xs font-mono bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded">
          {tickerItems.length} Queue Items Active
        </span>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {tickerItems.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 font-mono">
            No active lower-third ticker headlines. Flag news articles as
            "Ticker Item" to queue them here.
          </div>
        ) : (
          tickerItems.map((item, index) => (
            <div
              key={item.id}
              className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 p-3 rounded-lg flex items-center justify-between gap-3 text-xs transition-colors"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <span className="font-mono font-bold text-slate-500 w-5 text-right">
                  #{index + 1}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                    item.priority === "FLASH" || item.priority === "URGENT"
                      ? "bg-red-950 text-red-400 border border-red-800 animate-pulse"
                      : "bg-teal-950 text-teal-300 border border-teal-800"
                  }`}
                >
                  {item.priority || "TICKER"}
                </span>
                <span className="font-medium text-slate-200 truncate">
                  {item.headline}
                </span>
              </div>

              <div className="flex items-center space-x-1 shrink-0">
                {item.status !== "PUBLISHED" && (
                  <button
                    onClick={() => onPublishTicker && onPublishTicker(item.id)}
                    className="p-1 text-emerald-400 hover:bg-emerald-950/60 rounded"
                    title="Push Live to Ticker"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => onRemoveTicker && onRemoveTicker(item.id)}
                  className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/60 rounded"
                  title="Remove from Ticker Queue"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
