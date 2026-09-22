import React, { useState } from "react";

export default function TelemetryChart({
  title = "CPU Utilization",
  metricKey = "cpu_utilization_pct",
  unit = "%",
  color = "#06b6d4",
  data = [],
  threshold = 85,
}) {
  const [timeRange, setTimeRange] = useState("1h");

  // Generate fallback data points if empty
  const chartPoints =
    data && data.length > 0
      ? data
      : [
          { timestamp: "10:00", [metricKey]: 24 },
          { timestamp: "10:10", [metricKey]: 38 },
          { timestamp: "10:20", [metricKey]: 45 },
          { timestamp: "10:30", [metricKey]: 62 },
          { timestamp: "10:40", [metricKey]: 54 },
          { timestamp: "10:50", [metricKey]: 78 },
          { timestamp: "11:00", [metricKey]: 65 },
        ];

  const values = chartPoints.map((p) => Number(p[metricKey]) || 0);
  const maxValue = Math.max(...values, threshold || 100, 10);
  const currentVal = values[values.length - 1] || 0;
  const avgVal = (
    values.reduce((a, b) => a + b, 0) / (values.length || 1)
  ).toFixed(1);
  const peakVal = Math.max(...values, 0);

  // SVG dimensions
  const svgWidth = 400;
  const svgHeight = 140;
  const padding = 20;

  const pointsString = chartPoints
    .map((p, idx) => {
      const x =
        padding +
        (idx / Math.max(chartPoints.length - 1, 1)) * (svgWidth - padding * 2);
      const val = Number(p[metricKey]) || 0;
      const y =
        svgHeight - padding - (val / maxValue) * (svgHeight - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const areaString = `${padding},${svgHeight - padding} ${pointsString} ${svgWidth - padding},${svgHeight - padding}`;

  const thresholdY =
    svgHeight - padding - (threshold / maxValue) * (svgHeight - padding * 2);

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 flex flex-col justify-between hover:border-[#334155] transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
          ></div>
          <h3 className="text-xs font-semibold text-[#dae2fd]">{title}</h3>
        </div>

        {/* Time Range Filter */}
        <div className="flex items-center gap-1 bg-[#0b1326] p-0.5 rounded-md border border-[#1e293b] text-[10px] font-mono">
          {["1h", "6h", "24h"].map((tr) => (
            <button
              key={tr}
              onClick={() => setTimeRange(tr)}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                timeRange === tr
                  ? "bg-[#1e293b] text-[#06b6d4] font-bold"
                  : "text-[#64748b] hover:text-[#dae2fd]"
              }`}
            >
              {tr}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-3 gap-2 mb-2 text-center bg-[#0b1326]/60 p-2 rounded-lg border border-[#1e293b]/50">
        <div>
          <span className="text-[10px] text-[#64748b]">Current</span>
          <p
            className="text-sm font-bold font-mono text-[#dae2fd]"
            style={{ color }}
          >
            {currentVal}
            {unit}
          </p>
        </div>
        <div>
          <span className="text-[10px] text-[#64748b]">Average</span>
          <p className="text-sm font-bold font-mono text-[#bcc9cd]">
            {avgVal}
            {unit}
          </p>
        </div>
        <div>
          <span className="text-[10px] text-[#64748b]">Peak</span>
          <p className="text-sm font-bold font-mono text-[#f59e0b]">
            {peakVal}
            {unit}
          </p>
        </div>
      </div>

      {/* Responsive SVG Chart */}
      <div className="w-full relative">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-28 overflow-visible"
        >
          <defs>
            <linearGradient
              id={`grad-${metricKey}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background grid lines */}
          <line
            x1={padding}
            y1={padding}
            x2={svgWidth - padding}
            y2={padding}
            stroke="#1e293b"
            strokeDasharray="3 3"
          />
          <line
            x1={padding}
            y1={svgHeight / 2}
            x2={svgWidth - padding}
            y2={svgHeight / 2}
            stroke="#1e293b"
            strokeDasharray="3 3"
          />
          <line
            x1={padding}
            y1={svgHeight - padding}
            x2={svgWidth - padding}
            y2={svgHeight - padding}
            stroke="#1e293b"
          />

          {/* Threshold alert line if defined */}
          {threshold &&
            thresholdY >= padding &&
            thresholdY <= svgHeight - padding && (
              <line
                x1={padding}
                y1={thresholdY}
                x2={svgWidth - padding}
                y2={thresholdY}
                stroke="#f43f5e"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
            )}

          {/* Area polygon */}
          <polygon points={areaString} fill={`url(#grad-${metricKey})`} />

          {/* Line stroke */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pointsString}
          />

          {/* Data point dots */}
          {chartPoints.map((p, idx) => {
            const x =
              padding +
              (idx / Math.max(chartPoints.length - 1, 1)) *
                (svgWidth - padding * 2);
            const val = Number(p[metricKey]) || 0;
            const y =
              svgHeight -
              padding -
              (val / maxValue) * (svgHeight - padding * 2);
            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r="3"
                fill="#0f172a"
                stroke={color}
                strokeWidth="2"
              />
            );
          })}
        </svg>
      </div>

      {/* Footer Timestamp labels */}
      <div className="flex justify-between text-[9px] font-mono text-[#64748b] mt-2 px-1">
        <span>{chartPoints[0]?.timestamp || "0m ago"}</span>
        <span>
          {chartPoints[Math.floor(chartPoints.length / 2)]?.timestamp ||
            "30m ago"}
        </span>
        <span>{chartPoints[chartPoints.length - 1]?.timestamp || "Live"}</span>
      </div>
    </div>
  );
}
