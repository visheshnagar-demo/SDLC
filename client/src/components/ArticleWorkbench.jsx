import React, { useState, useEffect } from "react";
import {
  FileText,
  Send,
  CheckCircle2,
  Lock,
  AlertTriangle,
  Radio,
  Tag,
  Clock,
} from "lucide-react";

export default function ArticleWorkbench({
  article,
  channels = [],
  onSave,
  onStatusChange,
  onCancel,
}) {
  const [headline, setHeadline] = useState(article?.headline || "");
  const [summary, setSummary] = useState(article?.summary || "");
  const [body, setBody] = useState(article?.body || "");
  const [channelId, setChannelId] = useState(
    article?.channel_id || channels[0]?.id || "",
  );
  const [priority, setPriority] = useState(article?.priority || "NORMAL");
  const [isTickerItem, setIsTickerItem] = useState(
    article?.is_ticker_item || false,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showLockWarning, setShowLockWarning] = useState(false);

  useEffect(() => {
    if (article) {
      setHeadline(article.headline || "");
      setSummary(article.summary || "");
      setBody(article.body || "");
      setChannelId(article.channel_id || channels[0]?.id || "");
      setPriority(article.priority || "NORMAL");
      setIsTickerItem(article.is_ticker_item || false);
    }
  }, [article, channels]);

  const handleSaveArticle = async () => {
    if (!headline.trim()) {
      setErrorMsg("Headline is required.");
      return;
    }
    setErrorMsg("");
    setIsSaving(true);
    try {
      await onSave({
        id: article?.id,
        headline,
        summary,
        body,
        channel_id: channelId || null,
        priority,
        is_ticker_item: isTickerItem,
        status: article?.status || "DRAFT",
        version: (article?.version || 1) + 1,
      });
    } catch (err) {
      if (err.response?.status === 409) {
        setShowLockWarning(true);
      }
      setErrorMsg(err.response?.data?.detail || "Failed to save article.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTransition = async (newStatus) => {
    if (!article?.id) {
      setErrorMsg("Save article draft before transitioning status.");
      return;
    }
    setIsSaving(true);
    try {
      await onStatusChange(article.id, newStatus);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to transition status.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-6 space-y-6">
      {/* Header & Status Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-teal-950 text-teal-400 border border-teal-800 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              {article
                ? "Edit News Story & Ticker Draft"
                : "Draft New News Story"}
            </h2>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
              <span>Status:</span>
              <span className="font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                {article?.status || "DRAFT"}
              </span>
              <span>• Version {article?.version || 1}</span>
            </div>
          </div>
        </div>

        {/* Workflow Action Buttons */}
        {article?.id && (
          <div className="flex items-center space-x-2 text-xs">
            {article.status === "DRAFT" && (
              <button
                onClick={() => handleTransition("REVIEW")}
                disabled={isSaving}
                className="flex items-center space-x-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit for Editor Review</span>
              </button>
            )}
            {article.status === "REVIEW" && (
              <button
                onClick={() => handleTransition("APPROVED")}
                disabled={isSaving}
                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve News Asset</span>
              </button>
            )}
            {article.status === "APPROVED" && (
              <button
                onClick={() => handleTransition("PUBLISHED")}
                disabled={isSaving}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>Publish to Ticker & Live Feed</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lock Warning Banner for Concurrent Edits */}
      {showLockWarning && (
        <div className="bg-amber-950/50 border border-amber-800/80 p-4 rounded-xl flex items-start space-x-3 text-xs text-amber-200">
          <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">CONCURRENT EDIT NOTICE:</span> Another
            editor modified this article while you were editing. Please review
            changes before overwriting to prevent version conflicts.
          </div>
        </div>
      )}

      {/* Inputs */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-mono font-medium text-slate-400 mb-1">
            Article Headline / Breaking Ticker Title *
          </label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Enter high-impact news headline..."
            className="w-full bg-slate-950 border border-slate-700 text-slate-100 font-bold px-4 py-2.5 rounded-lg text-base focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-mono font-medium text-slate-400 mb-1">
              Target Channel
            </label>
            <select
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="">All Channels / Syndicated</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-400 mb-1">
              Priority Tag
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="NORMAL">NORMAL BULLETIN</option>
              <option value="HIGH">HIGH PRIORITY</option>
              <option value="URGENT">URGENT BREAKING</option>
              <option value="FLASH">FLASH OVERRIDE</option>
            </select>
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center space-x-2 text-xs font-semibold text-teal-400 cursor-pointer">
              <input
                type="checkbox"
                checked={isTickerItem}
                onChange={(e) => setIsTickerItem(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-700 focus:ring-teal-500"
              />
              <span>Send to Lower-Third News Ticker Queue</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono font-medium text-slate-400 mb-1">
            Summary / Ticker Except (1-2 sentences)
          </label>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Short summary rendered on broadcast ticker overlay..."
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-medium text-slate-400 mb-1">
            Full Story Copy / Teleprompter Script
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            placeholder="Draft the complete news report, anchor notes, or teleprompter copy here..."
            className="w-full bg-slate-950 border border-slate-700 text-slate-100 p-4 rounded-lg text-xs leading-relaxed focus:outline-none focus:border-teal-500 font-mono"
          />
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="text-xs text-red-400 font-medium bg-red-950/40 p-2 rounded border border-red-800"
        >
          {errorMsg}
        </div>
      )}

      {/* Footer Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSaveArticle}
          disabled={isSaving}
          className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-teal-600/20 transition-all"
        >
          {isSaving ? "Saving..." : "Save Article Draft"}
        </button>
      </div>
    </div>
  );
}
