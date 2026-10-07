import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

export const HerdHealthPieChart = ({ breakdown = {}, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center h-80">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const data = [
    { name: "Healthy", value: breakdown.healthy ?? 108, color: "#16a34a" },
    {
      name: "Under Treatment",
      value: breakdown.under_treatment ?? 9,
      color: "#f59e0b",
    },
    {
      name: "Quarantined",
      value: breakdown.quarantined ?? 3,
      color: "#ef4444",
    },
  ].filter((item) => item.value > 0);

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <h2 className="text-base font-bold text-slate-900">
          Herd Health Distribution
        </h2>
        <p className="text-xs text-slate-500">
          Active medical status breakdown
        </p>
      </div>

      <div className="h-56 w-full my-auto">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={50}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={entry.color}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderRadius: "8px",
                border: "none",
                color: "#fff",
                fontSize: "12px",
              }}
              itemStyle={{ color: "#fff" }}
              formatter={(val, name) => [
                `${val} cattle (${total ? Math.round((val / total) * 100) : 0}%)`,
                name,
              ]}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-2 border-t border-slate-100 flex justify-around text-center text-xs">
        {data.map((item) => (
          <div key={item.name}>
            <span className="font-semibold text-slate-900">{item.value}</span>
            <span className="block text-slate-500">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HerdHealthPieChart;
