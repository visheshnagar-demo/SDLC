import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Activity } from "lucide-react";

export const GateVelocityChart = ({ gateMetrics = [] }) => {
  // Format data for chart
  const data =
    gateMetrics.length > 0
      ? gateMetrics.map((g) => ({
          name: g.gateIdentifier ? g.gateIdentifier.replace(/_/g, " ") : "Gate",
          total: g.totalScans || 0,
          successful: g.successfulScans || 0,
          blocked: g.blockedScans || 0,
        }))
      : [
          { name: "Gate 1 North", total: 450, successful: 430, blocked: 20 },
          { name: "Gate 2 South", total: 520, successful: 505, blocked: 15 },
          { name: "Gate 3 VIP", total: 180, successful: 178, blocked: 2 },
          { name: "Gate 4 West", total: 290, successful: 275, blocked: 15 },
        ];

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h3 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#F59E0B]" />
            <span>Gate Scan Throughput & Security Telemetry</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time breakdown of validated access vs. blocked/duplicate scans
            per checkpoint.
          </p>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1E293B"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0B0F19",
                borderColor: "#334155",
                borderRadius: "0.75rem",
                fontSize: "12px",
                color: "#F8FAFC",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
            <Bar
              dataKey="successful"
              name="Valid Check-ins"
              fill="#10B981"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="blocked"
              name="Blocked / Duplicate"
              fill="#EF4444"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GateVelocityChart;
