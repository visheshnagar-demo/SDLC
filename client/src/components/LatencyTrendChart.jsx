import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Activity, Clock } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111827] border border-[#334155] p-3 rounded-lg shadow-xl text-xs font-mono space-y-1 text-[#f8fafc]">
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div
            key={`item-${index}`}
            className="flex items-center justify-between gap-4"
          >
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-bold">
              {Number(entry.value).toFixed(1)} ms
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const LatencyTrendChart = ({
  data = [],
  timeWindow = "24h",
  onTimeWindowChange,
  isLoading = false,
}) => {
  const windows = [
    { label: "Last 24 Hours", value: "24h" },
    { label: "Last 7 Days", value: "7d" },
    { label: "Last 30 Days", value: "30d" },
  ];

  return (
    <div
      data-testid="latency-trend-chart"
      className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 shadow-xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1e293b]">
        <div className="flex items-center gap-2">
          <Activity className="text-[#06b6d4] w-5 h-5" />
          <h3 className="font-semibold text-sm text-[#f8fafc]">
            Latency Trend & Percentiles
          </h3>
        </div>

        {onTimeWindowChange && (
          <div className="flex items-center gap-1 bg-[#0b0f17] p-1 rounded-lg border border-[#1e293b] text-xs">
            {windows.map((w) => (
              <button
                key={w.value}
                onClick={() => onTimeWindowChange(w.value)}
                className={`px-3 py-1 rounded-md transition font-medium ${
                  timeWindow === w.value
                    ? "bg-[#1e293b] text-[#06b6d4] font-semibold"
                    : "text-[#94a3b8] hover:text-[#f8fafc]"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 h-72 w-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#06b6d4] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#94a3b8] p-6">
            <Clock className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-sm font-medium text-[#f8fafc]">
              No Telemetry Logs in Selected Window
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Data will populate automatically as probes execute.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickLine={{ stroke: "#334155" }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickLine={{ stroke: "#334155" }}
                unit="ms"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }}
                formatter={(value) => (
                  <span className="text-slate-300">{value}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey="avg_latency"
                name="Average Latency"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="p95_latency"
                name="P95 Latency"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="p99_latency"
                name="P99 Latency"
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default LatencyTrendChart;
