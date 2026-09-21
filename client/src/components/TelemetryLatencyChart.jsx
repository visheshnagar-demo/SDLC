import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Activity } from "lucide-react";

export default function TelemetryLatencyChart({
  timeSeriesData = [],
  timeframe = "24h",
  onTimeframeChange,
  slaThresholdMs = 500,
}) {
  const formattedData = (timeSeriesData || []).map((pt) => {
    let displayTime = pt.timestamp;
    try {
      const d = new Date(pt.timestamp);
      if (timeframe === "24h") {
        displayTime = d.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else {
        displayTime = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
      }
    } catch {
      displayTime = pt.timestamp;
    }

    return {
      time: displayTime,
      avgLatency: Number(pt.avg_latency_ms?.toFixed(1)) || 0,
      p95Latency: Number(pt.p95_latency_ms?.toFixed(1)) || 0,
      uptimePct: Number(pt.uptime_pct?.toFixed(1)) || 100,
      failureCount: pt.failure_count || 0,
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f131c] border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1">
          <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1 mb-1 font-mono">
            {label}
          </div>
          <div className="flex items-center justify-between space-x-4">
            <span className="text-cyan-400">Avg Latency:</span>
            <span className="font-mono font-bold text-slate-100">
              {payload[0]?.value} ms
            </span>
          </div>
          {payload[1] && (
            <div className="flex items-center justify-between space-x-4">
              <span className="text-amber-400">P95 Latency:</span>
              <span className="font-mono font-bold text-slate-100">
                {payload[1]?.value} ms
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#111622] rounded-2xl border border-slate-800 p-5 shadow-xl">
      {/* Header with Timeframe Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Response Latency & Telemetry
            </h3>
            <p className="text-xs text-slate-400">
              Average vs P95 tail latency with SLA baseline ({slaThresholdMs}ms)
            </p>
          </div>
        </div>

        {onTimeframeChange && (
          <div className="flex items-center bg-[#0b0f17] p-1 rounded-lg border border-slate-800 text-xs">
            {["24h", "7d", "30d"].map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-3 py-1 rounded font-medium transition ${
                  timeframe === tf
                    ? "bg-slate-800 text-cyan-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Line Chart */}
      <div className="w-full h-72 sm:h-80">
        {formattedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickLine={{ stroke: "#334155" }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickLine={{ stroke: "#334155" }}
                unit="ms"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: "10px", fontSize: "12px" }}
              />
              <ReferenceLine
                y={slaThresholdMs}
                label={{
                  value: `SLA (${slaThresholdMs}ms)`,
                  fill: "#f43f5e",
                  fontSize: 10,
                  position: "insideTopRight",
                }}
                stroke="#f43f5e"
                strokeDasharray="4 4"
              />
              <Line
                type="monotone"
                dataKey="avgLatency"
                name="Avg Latency (ms)"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: "#06b6d4" }}
              />
              <Line
                type="monotone"
                dataKey="p95Latency"
                name="P95 Latency (ms)"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
                activeDot={{ r: 5, fill: "#f59e0b" }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
            <Activity className="w-8 h-8 text-slate-600 mb-2" />
            <span>
              No telemetry time-series points recorded in this timeframe yet.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
