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
import { Activity, Clock } from "lucide-react";

export default function TelemetryLatencyChart({
  timeSeriesData = [],
  slaThresholdMs = 200,
  timeframe = "24h",
}) {
  if (!timeSeriesData || timeSeriesData.length === 0) {
    return (
      <div className="bg-[#0f131c] rounded-xl border border-slate-800 p-6 flex flex-col items-center justify-center min-h-[300px] text-slate-500">
        <Activity className="w-8 h-8 text-slate-600 mb-2" />
        <p className="text-sm font-semibold text-slate-300">
          No Telemetry Data Available
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Probe execution history will appear here once health checks run.
        </p>
      </div>
    );
  }

  // Format data for chart
  const formattedData = timeSeriesData.map((point) => {
    let label = point.timestamp || point.time || "";
    if (label.includes("T")) {
      const d = new Date(label);
      label =
        timeframe === "30d"
          ? `${d.getMonth() + 1}/${d.getDate()}`
          : `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    }
    return {
      timestamp: label,
      avg_latency_ms: point.avg_latency_ms ?? point.latency_ms ?? 0,
      p95_latency_ms:
        point.p95_latency_ms ?? (point.latency_ms ? point.latency_ms * 1.2 : 0),
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111622] border border-slate-700 p-3 rounded-lg shadow-xl text-xs font-mono">
          <p className="text-slate-400 font-bold mb-1.5 flex items-center space-x-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>{label}</span>
          </p>
          {payload.map((entry, index) => (
            <p
              key={index}
              className="flex items-center justify-between space-x-3"
              style={{ color: entry.color }}
            >
              <span>{entry.name}:</span>
              <span className="font-bold">
                {Number(entry.value).toFixed(1)} ms
              </span>
            </p>
          ))}
          <p className="text-slate-500 text-[10px] mt-1 pt-1 border-t border-slate-800">
            SLA Baseline: {slaThresholdMs} ms
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#0f131c] rounded-xl border border-slate-800 p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Response Latency Telemetry (Avg vs P95)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Time-series latency monitoring across the selected timeframe (
            {timeframe})
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span className="text-slate-300">Avg Latency</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-slate-300">P95 Tail</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-0.5 bg-rose-500"></span>
            <span className="text-slate-400">SLA ({slaThresholdMs}ms)</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              vertical={false}
            />
            <XAxis
              dataKey="timestamp"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
              tickFormatter={(val) => `${val}ms`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={slaThresholdMs}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              label={{
                value: "SLA Limit",
                fill: "#f43f5e",
                fontSize: 10,
                position: "right",
              }}
            />
            <Line
              type="monotone"
              dataKey="avg_latency_ms"
              name="Avg Latency"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={{ r: 2, fill: "#06b6d4" }}
              activeDot={{
                r: 5,
                stroke: "#06b6d4",
                strokeWidth: 2,
                fill: "#0891b2",
              }}
            />
            <Line
              type="monotone"
              dataKey="p95_latency_ms"
              name="P95 Tail"
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="2 2"
              dot={false}
              activeDot={{
                r: 4,
                stroke: "#f59e0b",
                strokeWidth: 2,
                fill: "#d97706",
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
