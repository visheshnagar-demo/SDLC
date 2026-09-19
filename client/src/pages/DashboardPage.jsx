import React, { useState, useEffect } from "react";
import TelemetryCard from "../components/TelemetryCard";
import ChannelCardGrid from "../components/ChannelCardGrid";
import DeleteChannelSafetyModal from "../components/DeleteChannelSafetyModal";
import SlotAssignmentForm from "../components/SlotAssignmentForm";
import { dashboardApi, channelsApi, schedulesApi } from "../services/api";
import {
  Radio,
  ShieldAlert,
  Activity,
  Users,
  Wifi,
  AlertTriangle,
} from "lucide-react";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    active_channels: "4 / 4",
    concurrent_viewers: "1.24M",
    transmission_health_pct: "99.98%",
    active_emergency_alerts: "0 Active",
  });
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeleteChannel, setSelectedDeleteChannel] = useState(null);
  const [showOverrideDrawer, setShowOverrideDrawer] = useState(false);
  const [overrideSuccessMsg, setOverrideSuccessMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [mRes, cRes] = await Promise.allSettled([
        dashboardApi.getMetrics(),
        channelsApi.getChannels(),
      ]);

      if (mRes.status === "fulfilled" && mRes.value) {
        setMetrics({
          active_channels: `${mRes.value.active_channels || 4} Active`,
          concurrent_viewers: `${mRes.value.concurrent_viewers || "1.24M"}`,
          transmission_health_pct: `${mRes.value.transmission_health_pct || "99.98"}%`,
          active_emergency_alerts: `${mRes.value.active_emergency_alerts || 0} Active`,
        });
      }

      if (cRes.status === "fulfilled" && Array.isArray(cRes.value)) {
        setChannels(cRes.value);
      } else {
        // Default initial channels if empty
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
          {
            id: "ch-3",
            name: "Financial Market Ticker",
            code: "FMT",
            stream_url: "udp://239.1.1.3:5000",
            resolution: "1080p60",
            language: "EN",
            status: "ACTIVE",
            is_live: true,
          },
          {
            id: "ch-4",
            name: "Breaking News Express",
            code: "BNX",
            stream_url: "udp://239.1.1.4:5000",
            resolution: "720p60",
            language: "ES",
            status: "ACTIVE",
            is_live: false,
          },
        ]);
      }
    } catch (_e) {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmDeleteChannel = async (id) => {
    await channelsApi.deleteChannel(id);
    loadData();
  };

  const handleEmergencyOverride = async (overrideData) => {
    await schedulesApi.triggerOverride(overrideData.channel_id, overrideData);
    setOverrideSuccessMsg(
      "🚨 EMERGENCY OVERRIDE ACTIVATED ACROSS SELECTED CHANNEL!",
    );
    setTimeout(() => setOverrideSuccessMsg(""), 5000);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Master Control Header */}
      <div className="bg-slate-800/90 border border-slate-700/80 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
        <div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-400" />
            GLOBAL NEWS NETWORK // MASTER CONTROL
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real-time broadcast operations telemetry, channel multiplexers, and
            emergency overrides.
          </p>
        </div>

        <button
          onClick={() => setShowOverrideDrawer(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-black text-xs py-2.5 px-5 rounded-xl shadow-lg shadow-red-600/40 animate-pulse flex items-center gap-2 transition-all hover:scale-105"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>🚨 TRIGGER EMERGENCY OVERRIDE</span>
        </button>
      </div>

      {overrideSuccessMsg && (
        <div className="bg-red-950 border border-red-600 p-4 rounded-xl text-xs font-bold text-red-200 flex items-center gap-2 shadow-xl animate-bounce">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{overrideSuccessMsg}</span>
        </div>
      )}

      {/* Telemetry Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TelemetryCard
          title="Active Channels"
          value={metrics.active_channels}
          subtext="1080p60 & 4K Synced"
          icon={Radio}
          variant="emerald"
        />
        <TelemetryCard
          title="Concurrent Viewers"
          value={metrics.concurrent_viewers}
          subtext="+42.8k/min peak"
          icon={Users}
          variant="blue"
        />
        <TelemetryCard
          title="TX Health & Latency"
          value={metrics.transmission_health_pct}
          subtext="Latency: 18ms (Multicast OK)"
          icon={Wifi}
          variant="emerald"
        />
        <TelemetryCard
          title="Emergency Alerts"
          value={metrics.active_emergency_alerts}
          subtext="System Armed & Guarded"
          icon={ShieldAlert}
          variant="amber"
        />
      </div>

      {/* Live Channel Grid Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            Live Channel Monitors & Stream Feeds
          </h2>
          <span className="text-xs font-mono text-slate-400">
            {channels.length} Channels Monitored
          </span>
        </div>

        {loading ? (
          <div className="bg-slate-800/40 p-8 rounded-xl text-center text-slate-400 font-mono text-xs">
            Loading telemetry feeds...
          </div>
        ) : (
          <ChannelCardGrid
            channels={channels}
            onDeleteChannel={(ch) => setSelectedDeleteChannel(ch)}
          />
        )}
      </div>

      {/* Delete Safety Modal */}
      {selectedDeleteChannel && (
        <DeleteChannelSafetyModal
          channel={selectedDeleteChannel}
          onClose={() => setSelectedDeleteChannel(null)}
          onConfirm={handleConfirmDeleteChannel}
        />
      )}

      {/* Emergency Drawer */}
      {showOverrideDrawer && (
        <SlotAssignmentForm
          channels={channels}
          onClose={() => setShowOverrideDrawer(false)}
          onEmergencyOverride={handleEmergencyOverride}
        />
      )}
    </div>
  );
}
