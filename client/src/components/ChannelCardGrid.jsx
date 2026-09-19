import React from "react";
import { Tv, Play, Wifi, Settings, Trash2, Radio } from "lucide-react";

export default function ChannelCardGrid({
  channels = [],
  onSelectChannel,
  onDeleteChannel,
}) {
  if (!channels || channels.length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-8 text-center text-slate-400">
        <Radio className="w-10 h-10 mx-auto text-slate-500 mb-2 animate-pulse" />
        <p className="font-semibold">No active channels registered.</p>
        <p className="text-xs text-slate-500 mt-1">
          Register new channels to display stream telemetry and cards.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {channels.map((channel) => {
        const isLive = channel.is_live || channel.status === "ACTIVE";

        return (
          <div
            key={channel.id}
            className="bg-slate-800 border border-slate-700/80 rounded-xl overflow-hidden shadow-lg hover:border-blue-500/50 transition-all group flex flex-col justify-between"
          >
            {/* Top Video Stream Monitor Simulation */}
            <div className="relative bg-slate-950 aspect-video flex items-center justify-center border-b border-slate-800">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 z-10" />

              {/* Stream Overlay Status */}
              <div className="absolute top-2 left-2 z-20 flex items-center space-x-1.5">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                    isLive
                      ? "bg-red-600 text-white animate-pulse"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {isLive ? "● ON AIR" : "OFFLINE"}
                </span>
                <span className="bg-slate-900/80 backdrop-blur text-slate-300 text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-700">
                  {channel.resolution || "1080p60"}
                </span>
              </div>

              <div className="absolute top-2 right-2 z-20">
                <span className="text-[10px] font-mono bg-slate-900/80 text-blue-400 px-1.5 py-0.5 rounded border border-slate-700">
                  {channel.code || "GNN-HD"}
                </span>
              </div>

              {/* Simulated Live Stream Feed Graphic */}
              <div className="flex flex-col items-center justify-center text-slate-600 z-0">
                <Tv className="w-10 h-10 mb-1 group-hover:text-blue-400 transition-colors" />
                <span className="text-[10px] font-mono tracking-widest text-slate-500">
                  {channel.stream_url || "MULTICAST udp://239.1.1.1:5000"}
                </span>
              </div>

              {/* Ticker Bar at bottom of screen mockup */}
              <div className="absolute bottom-1 left-2 right-2 z-20 text-[10px] font-mono text-slate-300 truncate bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
                <span className="text-red-400 font-bold mr-1">BREAKING:</span>
                Global Markets Rally Following Policy Briefing
              </div>
            </div>

            {/* Channel Info Body */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                    {channel.name}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded">
                    {channel.language || "EN"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Bitrate: 12.5 Mbps</span>
                  <span className="text-slate-600">•</span>
                  <span>Health: 99.9%</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                <button
                  onClick={() => onSelectChannel && onSelectChannel(channel)}
                  className="flex items-center space-x-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Configure</span>
                </button>

                <button
                  onClick={() => onDeleteChannel && onDeleteChannel(channel)}
                  className="flex items-center space-x-1 text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                  title="Archive/Delete Channel"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Archive</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
