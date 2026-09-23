import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";

export function WorkloadAnalyticsChart({ subjects = [], sessions = [] }) {
  const chartData = React.useMemo(() => {
    if (!subjects || subjects.length === 0) {
      return [
        { name: "Mathematics", planned: 20, completed: 14, recommended: 24 },
        {
          name: "Computer Science",
          planned: 25,
          completed: 18,
          recommended: 28,
        },
        { name: "Physics", planned: 15, completed: 10, recommended: 16 },
      ];
    }

    return subjects.map((subj) => {
      const subjectSessions = sessions.filter((s) => s.subject_id === subj.id);
      const completedMins = subjectSessions
        .filter((s) => s.status === "COMPLETED")
        .reduce((acc, s) => acc + (s.duration_minutes || 60), 0);
      const plannedMins = subjectSessions.reduce(
        (acc, s) => acc + (s.duration_minutes || 60),
        0,
      );

      const completedHours = Number((completedMins / 60).toFixed(1));
      const plannedHours =
        plannedMins > 0
          ? Number((plannedMins / 60).toFixed(1))
          : Number(subj.estimated_total_hours || 10);
      const recommendedHours = Math.round(
        plannedHours * (1 + (subj.difficulty_level || 3) * 0.08),
      );

      return {
        name:
          subj.name.length > 12
            ? `${subj.name.substring(0, 10)}...`
            : subj.name,
        planned: plannedHours,
        completed: completedHours,
        recommended: recommendedHours,
      };
    });
  }, [subjects, sessions]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-900">
            Workload Distribution & Hours Allocation
          </h3>
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Planned vs AI Recommended
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E2E8F0"
            />
            <XAxis
              dataKey="name"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#CBD5E1" }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#CBD5E1" }}
            />
            <Tooltip
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
            <Bar
              dataKey="completed"
              name="Completed Hours"
              fill="#10B981"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="planned"
              name="Planned Target"
              fill="#2563EB"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="recommended"
              name="AI Recommended"
              fill="#8B5CF6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default WorkloadAnalyticsChart;
