import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { BarChart3, ShieldCheck } from "lucide-react";

export function GateVelocityChart({ gateMetrics }) {
  const chartData =
    gateMetrics && gateMetrics.length > 0
      ? gateMetrics
      : [
          { time: "18:00", gate1: 120, gate2: 95, gate3VIP: 60, gate4West: 80 },
          {
            time: "19:00",
            gate1: 240,
            gate2: 180,
            gate3VIP: 110,
            gate4West: 150,
          },
          {
            time: "20:00",
            gate1: 480,
            gate2: 390,
            gate3VIP: 210,
            gate4West: 310,
          },
          {
            time: "21:00",
            gate1: 620,
            gate2: 540,
            gate3VIP: 290,
            gate4West: 420,
          },
          {
            time: "22:00",
            gate1: 410,
            gate2: 360,
            gate3VIP: 190,
            gate4West: 280,
          },
          {
            time: "23:00",
            gate1: 180,
            gate2: 140,
            gate3VIP: 80,
            gate4West: 110,
          },
        ];

  const gateSummary = [
    {
      name: "Gate 1 North",
      count: 1840,
      color: "bg-amber-400",
      stroke: "#f59e0b",
    },
    {
      name: "Gate 2 South",
      count: 1510,
      color: "bg-emerald-400",
      stroke: "#10b981",
    },
    { name: "Gate 3 VIP", count: 720, color: "bg-rose-400", stroke: "#f43f5e" },
    {
      name: "Gate 4 West",
      count: 1210,
      color: "bg-indigo-400",
      stroke: "#6366f1",
    },
  ];

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-xl text-slate-950 font-bold">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className='text-lg font-bold text-white font-["Syne"]'>
              Real-Time Gate Velocity & Scan Throughput
            </h2>
            <p className="text-xs text-slate-400">
              Live attendee validation flow monitored across all 4 arena gates.
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {gateSummary.map((g, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${g.color}`} />
              <span className="text-slate-300 font-medium">{g.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recharts Area Container */}
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorGate1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorGate2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorGate3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
            />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                borderRadius: "0.75rem",
                fontSize: "12px",
                color: "#fff",
              }}
            />
            <Area
              type="monotone"
              dataKey="gate1"
              name="Gate 1 North"
              stroke="#f59e0b"
              fillOpacity={1}
              fill="url(#colorGate1)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="gate2"
              name="Gate 2 South"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorGate2)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="gate3VIP"
              name="Gate 3 VIP"
              stroke="#f43f5e"
              fillOpacity={1}
              fill="url(#colorGate3)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Gate Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {gateSummary.map((g, idx) => (
          <div
            key={idx}
            className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs"
          >
            <span className="text-slate-400 block text-[10px]">
              {g.name} Total
            </span>
            <span className="text-base font-bold text-white font-mono mt-0.5 block">
              {g.count.toLocaleString()} check-ins
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GateVelocityChart;
