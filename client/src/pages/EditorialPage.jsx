import React, { useState, useEffect } from "react";
import ArticleWorkbench from "../components/ArticleWorkbench";
import TickerQueueManager from "../components/TickerQueueManager";
import { articlesApi, channelsApi } from "../services/api";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Radio,
  Trash2,
  Edit2,
  CheckCircle2,
} from "lucide-react";

export default function EditorialPage() {
  const [articles, setArticles] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeArticle, setActiveArticle] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aRes, cRes] = await Promise.allSettled([
        articlesApi.getArticles(),
        channelsApi.getChannels(),
      ]);

      if (cRes.status === "fulfilled" && Array.isArray(cRes.value)) {
        setChannels(cRes.value);
      } else {
        setChannels([
          { id: "ch-1", name: "Global News HD", code: "GNN-HD" },
          { id: "ch-2", name: "World News 24/7", code: "WN24" },
        ]);
      }

      if (aRes.status === "fulfilled" && Array.isArray(aRes.value)) {
        setArticles(aRes.value);
      } else {
        setArticles([
          {
            id: "art-1",
            headline:
              "Global Central Banks Announce Synchronized Rate Decision",
            summary:
              "Key benchmark rates adjusted following quarterly inflation review.",
            body: "Washington/London -- Monetary policy committees across major central banks have reached consensus...",
            channel_id: "ch-1",
            priority: "HIGH",
            is_ticker_item: true,
            status: "PUBLISHED",
            version: 2,
          },
          {
            id: "art-2",
            headline: "Emergency Weather Alert: Coastal Storm Preparedness",
            summary: "Severe storm system approaching eastern seaboard.",
            body: "Emergency management officials have issued hurricane watch warnings...",
            channel_id: "ch-2",
            priority: "URGENT",
            is_ticker_item: true,
            status: "APPROVED",
            version: 1,
          },
          {
            id: "art-3",
            headline: "Technology Summit Keynote Draft",
            summary: "AI breakthroughs discussed in international tech summit.",
            body: "Industry leaders gathered today to present latest AI governance frameworks...",
            channel_id: "ch-1",
            priority: "NORMAL",
            is_ticker_item: false,
            status: "DRAFT",
            version: 1,
          },
        ]);
      }
    } catch (_e) {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateNew = () => {
    setActiveArticle(null);
    setIsEditing(true);
  };

  const handleEditArticle = (art) => {
    setActiveArticle(art);
    setIsEditing(true);
  };

  const handleSaveArticle = async (articleData) => {
    if (articleData.id) {
      await articlesApi.updateArticle(articleData.id, articleData);
      setNotification("Article updated successfully.");
    } else {
      await articlesApi.createArticle(articleData);
      setNotification("New article draft created.");
    }
    setIsEditing(false);
    setTimeout(() => setNotification(""), 4000);
    fetchData();
  };

  const handleStatusChange = async (id, newStatus) => {
    await articlesApi.updateStatus(id, { status: newStatus });
    setNotification(`Article status updated to ${newStatus}.`);
    setTimeout(() => setNotification(""), 4000);
    fetchData();
  };

  const handleDeleteArticle = async (id) => {
    if (confirm("Delete this news article asset?")) {
      await articlesApi.deleteArticle(id);
      fetchData();
    }
  };

  const filteredArticles = articles.filter((a) => {
    const matchesStatus = statusFilter === "ALL" || a.status === statusFilter;
    const matchesSearch =
      !searchTerm ||
      a.headline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.summary?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" />
            Editorial News Desk & Ticker Feed Manager
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Journalist/editor content drafting, optimistic locking, and
            lower-third ticker feed queue management.
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-lg shadow-teal-600/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Article</span>
        </button>
      </div>

      {notification && (
        <div className="bg-teal-950 border border-teal-800 text-teal-200 p-3 rounded-xl text-xs font-mono">
          {notification}
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Top 2 Cols: Workbench or Article List */}
        <div className="lg:col-span-2 space-y-6">
          {isEditing ? (
            <ArticleWorkbench
              article={activeArticle}
              channels={channels}
              onSave={handleSaveArticle}
              onStatusChange={handleStatusChange}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl p-5 space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search headlines..."
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 pl-9 pr-3 py-2 rounded-lg text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-slate-300 px-3 py-2 rounded-lg text-xs focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="REVIEW">IN REVIEW</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                  </select>
                </div>
              </div>

              {/* Article Cards List */}
              <div className="space-y-3">
                {filteredArticles.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 font-mono text-xs">
                    No news stories found matching criteria. Click "+ Create New
                    Article" to draft one.
                  </div>
                ) : (
                  filteredArticles.map((art) => (
                    <div
                      key={art.id}
                      className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 p-4 rounded-xl shadow transition-all flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-slate-100 text-sm">
                            {art.headline}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                              art.status === "PUBLISHED"
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                : art.status === "APPROVED"
                                  ? "bg-blue-950 text-blue-400 border border-blue-800"
                                  : art.status === "REVIEW"
                                    ? "bg-amber-950 text-amber-400 border border-amber-800"
                                    : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {art.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {art.summary || art.body}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                        <div className="flex items-center space-x-2 font-mono text-[10px] text-slate-400">
                          <span className="bg-slate-800 px-2 py-0.5 rounded">
                            Tag: {art.priority || "NORMAL"}
                          </span>
                          {art.is_ticker_item && (
                            <span className="bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded">
                              TICKER ITEM
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditArticle(art)}
                            className="text-teal-400 hover:text-teal-300 text-xs font-semibold flex items-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit / Review</span>
                          </button>
                          <button
                            onClick={() => handleDeleteArticle(art.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Ticker Queue Manager */}
        <div className="space-y-6">
          <TickerQueueManager
            articles={articles}
            onPublishTicker={(id) => handleStatusChange(id, "PUBLISHED")}
            onRemoveTicker={(id) => handleStatusChange(id, "DRAFT")}
          />
        </div>
      </div>
    </div>
  );
}
