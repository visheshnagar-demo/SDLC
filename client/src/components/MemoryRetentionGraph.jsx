import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BrainCircuit } from "lucide-react";

export function MemoryRetentionGraph() {
  const retentionData = [
    { day: "Day 1", standardRetention: 100, aiRepetitionRetention: 100 },
    { day: "Day 2", standardRetention: 55, aiRepetitionRetention: 92 },
    { day: "Day 4", standardRetention: 35, aiRepetitionRetention: 88 },
    { day: "Day 7", standardRetention: 25, aiRepetitionRetention: 94 },
    { day: "Day 14", standardRetention: 18, aiRepetitionRetention: 90 },
    { day: "Day 30", standardRetention: 12, aiRepetitionRetention: 86 },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <BrainCircuit className="w-5 h-5 text-purple-600" />
          <h3 className="text-base font-bold text-slate-900">
            Memory Retention Forecast (Spaced Repetition)
          </h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
          Ebbinghaus Curve Model
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={retentionData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E2E8F0"
            />
            <XAxis
              dataKey="day"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#CBD5E1" }}
            />
            <YAxis
              unit="%"
              domain={[0, 100]}
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#CBD5E1" }}
            />
            <Tooltip
              formatter={(value) => `${value}%`}
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderColor: "#E2E8F0",
                borderRadius: "0.75rem",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                fontSize: "12px",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              iconType="circle"
            />
            <Line
              type="monotone"
              dataKey="aiRepetitionRetention"
              name="With AI Spaced Repetition"
              stroke="#7C3AED"
              strokeWidth={3}
              dot={{ r: 4, fill: "#7C3AED" }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="standardRetention"
              name="Standard Cramming / Single Study"
              stroke="#94A3B8"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: "#94A3B8" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
        <span>
          💡 AI schedule strategically injects review intervals at Day 2, 7, and
          14 to maintain 85%+ retention.
        </span>
      </div>
    </div>
  );
}

export default MemoryRetentionGraph;
