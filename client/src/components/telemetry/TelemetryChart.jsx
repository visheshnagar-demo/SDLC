import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { LineChart as ChartIcon } from "lucide-react";

export default function TelemetryChart({ telemetryData = [] }) {
  const [selectedMetric, setSelectedMetric] = useState("all");

  const formattedData = telemetryData.map((item) => ({
    ...item,
    time: item.recorded_at
      ? new Date(item.recorded_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
  }));

  return (
    <div className="p-6 rounded-xl bg-[#141c27] border border-[#1e2e45] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ChartIcon className="w-5 h-5 text-[#00e5ff]" />
          <h2 className="text-base font-bold font-mono text-[#00e5ff]">
            24-Hour Parameter Trend Analytics
          </h2>
        </div>

        <div className="flex items-center gap-1.5 bg-[#0c141f] p-1 rounded-lg border border-[#1e2e45] text-xs font-mono">
          <button
            type="button"
            onClick={() => setSelectedMetric("all")}
            className={`px-2.5 py-1 rounded transition-colors ${
              selectedMetric === "all"
                ? "bg-[#1e2e45] text-[#00e5ff] font-bold"
                : "text-[#bac9cc] hover:text-[#dbe3f3]"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setSelectedMetric("ph")}
            className={`px-2.5 py-1 rounded transition-colors ${
              selectedMetric === "ph"
                ? "bg-[#1e2e45] text-[#00e5ff] font-bold"
                : "text-[#bac9cc] hover:text-[#dbe3f3]"
            }`}
          >
            pH
          </button>
          <button
            type="button"
            onClick={() => setSelectedMetric("do")}
            className={`px-2.5 py-1 rounded transition-colors ${
              selectedMetric === "do"
                ? "bg-[#1e2e45] text-[#34d399] font-bold"
                : "text-[#bac9cc] hover:text-[#dbe3f3]"
            }`}
          >
            Oxygen
          </button>
          <button
            type="button"
            onClick={() => setSelectedMetric("temp")}
            className={`px-2.5 py-1 rounded transition-colors ${
              selectedMetric === "temp"
                ? "bg-[#1e2e45] text-[#38bdf8] font-bold"
                : "text-[#bac9cc] hover:text-[#dbe3f3]"
            }`}
          >
            Temp
          </button>
          <button
            type="button"
            onClick={() => setSelectedMetric("nh3")}
            className={`px-2.5 py-1 rounded transition-colors ${
              selectedMetric === "nh3"
                ? "bg-[#1e2e45] text-[#fbbf24] font-bold"
                : "text-[#bac9cc] hover:text-[#dbe3f3]"
            }`}
          >
            Ammonia
          </button>
        </div>
      </div>

      {formattedData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-[#bac9cc] text-sm font-mono border border-dashed border-[#1e2e45] rounded-lg">
          <ChartIcon className="w-8 h-8 text-[#1e2e45] mb-2" />
          <span>No historical telemetry readings available for this tank</span>
        </div>
      ) : (
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e2e45"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                stroke="#8899a6"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="#8899a6"
                fontSize={11}
                tickLine={false}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0c141f",
                  borderColor: "#1e2e45",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  color: "#dbe3f3",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", fontFamily: "monospace" }}
              />

              {(selectedMetric === "all" || selectedMetric === "ph") && (
                <Line
                  type="monotone"
                  dataKey="ph_level"
                  name="pH Level"
                  stroke="#00e5ff"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              )}
              {(selectedMetric === "all" || selectedMetric === "do") && (
                <Line
                  type="monotone"
                  dataKey="dissolved_oxygen"
                  name="DO (mg/L)"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              )}
              {(selectedMetric === "all" || selectedMetric === "temp") && (
                <Line
                  type="monotone"
                  dataKey="temperature_c"
                  name="Temp (°C)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              )}
              {(selectedMetric === "all" || selectedMetric === "nh3") && (
                <Line
                  type="monotone"
                  dataKey="ammonia_ppm"
                  name="Ammonia (ppm)"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
