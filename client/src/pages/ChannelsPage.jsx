import React, { useState, useEffect } from "react";
import { channelsApi, programsApi } from "../services/api";
import DeleteChannelSafetyModal from "../components/DeleteChannelSafetyModal";
import {
  Tv,
  Plus,
  Settings,
  Trash2,
  List,
  Edit2,
  X,
  Search,
  Radio,
  CheckCircle,
} from "lucide-react";

export default function ChannelsPage() {
  const [activeTab, setActiveTab] = useState("channels"); // "channels" | "programs"
  const [channels, setChannels] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [deleteChannelTarget, setDeleteChannelTarget] = useState(null);

  // Form State
  const [channelForm, setChannelForm] = useState({
    name: "",
    code: "",
    stream_url: "",
    resolution: "1080p60",
    language: "EN",
    status: "ACTIVE",
    is_live: true,
  });

  const [programForm, setProgramForm] = useState({
    title: "",
    category: "News",
    description: "",
    default_duration_minutes: 60,
    host_name: "",
    is_recurring: true,
  });

  const [errorMsg, setErrorMsg] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.allSettled([
        channelsApi.getChannels(),
        programsApi.getPrograms(),
      ]);

      if (cRes.status === "fulfilled" && Array.isArray(cRes.value)) {
        setChannels(cRes.value);
      } else {
        setChannels([
          {
            id: "ch-1",
            name: "Global News HD",
            code: "GNN-HD",
            stream_url: "udp://239.1.1.1:5000",
            resolution: "1080p60",
            language: "EN",
            status: "ACTIVE",
            is_live: true,
          },
          {
            id: "ch-2",
            name: "World News 24/7",
            code: "WN24",
            stream_url: "udp://239.1.1.2:5000",
            resolution: "4K UHD",
            language: "EN",
            status: "ACTIVE",
            is_live: true,
          },
        ]);
      }

      if (pRes.status === "fulfilled" && Array.isArray(pRes.value)) {
        setPrograms(pRes.value);
      } else {
        setPrograms([
          {
            id: "prg-1",
            title: "Morning Global Bulletin",
            category: "News",
            description: "Daily 9 AM comprehensive world news analysis.",
            default_duration_minutes: 60,
            host_name: "Sarah Jenkins",
            is_recurring: true,
          },
          {
            id: "prg-2",
            title: "Evening Financial Roundtable",
            category: "Finance",
            description: "Prime time stock market and economic deep dive.",
            default_duration_minutes: 60,
            host_name: "David Miller",
            is_recurring: true,
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

  const handleOpenChannelModal = (ch = null) => {
    setErrorMsg("");
    if (ch) {
      setEditingChannel(ch);
      setChannelForm({
        name: ch.name,
        code: ch.code,
        stream_url: ch.stream_url || "",
        resolution: ch.resolution || "1080p60",
        language: ch.language || "EN",
        status: ch.status || "ACTIVE",
        is_live: ch.is_live ?? true,
      });
    } else {
      setEditingChannel(null);
      setChannelForm({
        name: "",
        code: "",
        stream_url: "udp://239.1.1.100:5000",
        resolution: "1080p60",
        language: "EN",
        status: "ACTIVE",
        is_live: true,
      });
    }
    setShowChannelModal(true);
  };

  const handleSaveChannel = async (e) => {
    e.preventDefault();
    if (!channelForm.name || !channelForm.code) {
      setErrorMsg("Channel Name and Code are required.");
      return;
    }
    try {
      if (editingChannel) {
        await channelsApi.updateChannel(editingChannel.id, channelForm);
      } else {
        await channelsApi.createChannel(channelForm);
      }
      setShowChannelModal(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to save channel.");
    }
  };

  const handleConfirmDeleteChannel = async (id) => {
    await channelsApi.deleteChannel(id);
    fetchData();
  };

  const handleOpenProgramModal = (prg = null) => {
    setErrorMsg("");
    if (prg) {
      setEditingProgram(prg);
      setProgramForm({
        title: prg.title,
        category: prg.category || "News",
        description: prg.description || "",
        default_duration_minutes: prg.default_duration_minutes || 60,
        host_name: prg.host_name || "",
        is_recurring: prg.is_recurring ?? true,
      });
    } else {
      setEditingProgram(null);
      setProgramForm({
        title: "",
        category: "News",
        description: "",
        default_duration_minutes: 60,
        host_name: "",
        is_recurring: true,
      });
    }
    setShowProgramModal(true);
  };

  const handleSaveProgram = async (e) => {
    e.preventDefault();
    if (!programForm.title) {
      setErrorMsg("Program Title is required.");
      return;
    }
    try {
      if (editingProgram) {
        await programsApi.updateProgram(editingProgram.id, programForm);
      } else {
        await programsApi.createProgram(programForm);
      }
      setShowProgramModal(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to save program.");
    }
  };

  const handleDeleteProgram = async (id) => {
    if (confirm("Remove program from catalog?")) {
      await programsApi.deleteProgram(id);
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Console Header & Tabs */}
      <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-400" />
            Channel & Program Management Console
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Configure multicast routes, stream resolution, language profiles,
            and program catalogs.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("channels")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "channels"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            News Channels ({channels.length})
          </button>
          <button
            onClick={() => setActiveTab("programs")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "programs"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Program Catalog ({programs.length})
          </button>
        </div>
      </div>

      {/* CHANNELS TAB */}
      {activeTab === "channels" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-200">
              Registered News Channels
            </h2>
            <button
              onClick={() => handleOpenChannelModal(null)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Register New Channel</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-700">
                <tr>
                  <th className="p-3.5">Channel Name & Code</th>
                  <th className="p-3.5">Multicast Stream Route</th>
                  <th className="p-3.5">Resolution</th>
                  <th className="p-3.5">Lang</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {channels.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-800/40">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-100">{ch.name}</div>
                      <div className="font-mono text-[10px] text-blue-400">
                        {ch.code}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">
                      {ch.stream_url || "udp://239.1.1.1:5000"}
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">
                      {ch.resolution}
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">
                      {ch.language}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          ch.is_live || ch.status === "ACTIVE"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {ch.is_live || ch.status === "ACTIVE"
                          ? "ACTIVE / LIVE"
                          : "ARCHIVED"}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenChannelModal(ch)}
                        className="text-blue-400 hover:text-blue-300 p-1"
                        title="Edit Configuration"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteChannelTarget(ch)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Archive/Delete Channel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PROGRAMS TAB */}
      {activeTab === "programs" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-200">
              Registered Show & Program Catalog
            </h2>
            <button
              onClick={() => handleOpenProgramModal(null)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Register New Program</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map((p) => (
              <div
                key={p.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-slate-100 text-sm">
                      {p.title}
                    </h3>
                    <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                      {p.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                    {p.description || "No description provided."}
                  </p>
                  <div className="text-xs text-slate-400 mt-3 space-y-1 font-mono">
                    <div>
                      Host:{" "}
                      <span className="text-slate-200">
                        {p.host_name || "Unassigned"}
                      </span>
                    </div>
                    <div>
                      Duration:{" "}
                      <span className="text-slate-200">
                        {p.default_duration_minutes} min
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => handleOpenProgramModal(p)}
                    className="p-1 text-blue-400 hover:text-blue-300"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProgram(p.id)}
                    className="p-1 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHANNEL MODAL */}
      {showChannelModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100">
                {editingChannel
                  ? "Edit Channel Configuration"
                  : "Register New Channel"}
              </h3>
              <button
                onClick={() => setShowChannelModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChannel} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">
                  Channel Name *
                </label>
                <input
                  type="text"
                  value={channelForm.name}
                  onChange={(e) =>
                    setChannelForm({ ...channelForm, name: e.target.value })
                  }
                  placeholder="e.g. Global News HD"
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 p-2 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">
                    Code / Call Sign *
                  </label>
                  <input
                    type="text"
                    value={channelForm.code}
                    onChange={(e) =>
                      setChannelForm({ ...channelForm, code: e.target.value })
                    }
                    placeholder="GNN-HD"
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 p-2 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono mb-1">
                    Language
                  </label>
                  <input
                    type="text"
                    value={channelForm.language}
                    onChange={(e) =>
                      setChannelForm({
                        ...channelForm,
                        language: e.target.value,
                      })
                    }
                    placeholder="EN"
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 p-2 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">
                  Multicast Stream URL
                </label>
                <input
                  type="text"
                  value={channelForm.stream_url}
                  onChange={(e) =>
                    setChannelForm({
                      ...channelForm,
                      stream_url: e.target.value,
                    })
                  }
                  placeholder="udp://239.1.1.1:5000"
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 p-2 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">
                  Resolution Standard
                </label>
                <select
                  value={channelForm.resolution}
                  onChange={(e) =>
                    setChannelForm({
                      ...channelForm,
                      resolution: e.target.value,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 p-2 rounded-lg"
                >
                  <option value="1080p60">1080p60 HD</option>
                  <option value="4K UHD">4K UHD 2160p</option>
                  <option value="720p60">720p60 SD</option>
                </select>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="text-red-400 bg-red-950/40 p-2 rounded border border-red-800"
                >
                  {errorMsg}
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowChannelModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg"
                >
                  Save Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROGRAM MODAL */}
      {showProgramModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100">
                {editingProgram
                  ? "Edit Program Details"
                  : "Register New Program"}
              </h3>
              <button
                onClick={() => setShowProgramModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">
                  Program Title *
                </label>
                <input
                  type="text"
                  value={programForm.title}
                  onChange={(e) =>
                    setProgramForm({ ...programForm, title: e.target.value })
                  }
                  placeholder="Morning Bulletin"
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 p-2 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={programForm.category}
                    onChange={(e) =>
                      setProgramForm({
                        ...programForm,
                        category: e.target.value,
                      })
                    }
                    placeholder="News / Finance / Weather"
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono mb-1">
                    Host Name
                  </label>
                  <input
                    type="text"
                    value={programForm.host_name}
                    onChange={(e) =>
                      setProgramForm({
                        ...programForm,
                        host_name: e.target.value,
                      })
                    }
                    placeholder="Anchor Name"
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 p-2 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">
                  Default Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={programForm.default_duration_minutes}
                  onChange={(e) =>
                    setProgramForm({
                      ...programForm,
                      default_duration_minutes: parseInt(e.target.value) || 30,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 p-2 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">
                  Description
                </label>
                <textarea
                  value={programForm.description}
                  onChange={(e) =>
                    setProgramForm({
                      ...programForm,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 p-2 rounded-lg"
                />
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="text-red-400 bg-red-950/40 p-2 rounded border border-red-800"
                >
                  {errorMsg}
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowProgramModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg"
                >
                  Save Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE SAFETY MODAL */}
      {deleteChannelTarget && (
        <DeleteChannelSafetyModal
          channel={deleteChannelTarget}
          onClose={() => setDeleteChannelTarget(null)}
          onConfirm={handleConfirmDeleteChannel}
        />
      )}
    </div>
  );
}
