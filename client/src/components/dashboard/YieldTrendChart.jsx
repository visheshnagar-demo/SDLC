import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export const YieldTrendChart = ({ data = [], loading = false }) => {
  const [timeRange, setTimeRange] = useState("30d");

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center h-80">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const chartData =
    data && data.length > 0
      ? data
      : [
          {
            date: "Day 1",
            morning_yield: 620,
            evening_yield: 580,
            total_yield: 1200,
          },
          {
            date: "Day 5",
            morning_yield: 640,
            evening_yield: 610,
            total_yield: 1250,
          },
          {
            date: "Day 10",
            morning_yield: 655,
            evening_yield: 625,
            total_yield: 1280,
          },
          {
            date: "Day 15",
            morning_yield: 630,
            evening_yield: 600,
            total_yield: 1230,
          },
          {
            date: "Day 20",
            morning_yield: 670,
            evening_yield: 640,
            total_yield: 1310,
          },
          {
            date: "Day 25",
            morning_yield: 685,
            evening_yield: 650,
            total_yield: 1335,
          },
          {
            date: "Day 30",
            morning_yield: 700,
            evening_yield: 660,
            total_yield: 1360,
          },
        ];

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Milk Production Trends (Liters)
          </h2>
          <p className="text-xs text-slate-500">
            Morning vs. Evening yield logs & 30-day aggregate progression
          </p>
        </div>
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setTimeRange("7d")}
            className={`px-3 py-1 rounded-md transition ${timeRange === "7d" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            7 Days
          </button>
          <button
            type="button"
            onClick={() => setTimeRange("30d")}
            className={`px-3 py-1 rounded-md transition ${timeRange === "30d" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            30 Days
          </button>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="morningGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="eveningGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderRadius: "8px",
                border: "none",
                color: "#fff",
                fontSize: "12px",
              }}
              itemStyle={{ color: "#fff" }}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
            <Area
              type="monotone"
              dataKey="morning_yield"
              name="Morning Yield (L)"
              stroke="#0284c7"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#morningGradient)"
            />
            <Area
              type="monotone"
              dataKey="evening_yield"
              name="Evening Yield (L)"
              stroke="#16a34a"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#eveningGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default YieldTrendChart;
