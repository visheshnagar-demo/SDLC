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
import {
  TrendingUp,
  Award,
  Flame,
  Droplet,
  Sparkles,
  CheckCircle,
  Info,
} from "lucide-react";

export default function ParentAnalyticsChart({
  weeklyData = null,
  childName = "Leo",
}) {
  const defaultChartData = [
    { day: "Mon", fruits: 2, veggies: 3, grains: 3, protein: 2, target: 10 },
    { day: "Tue", fruits: 2, veggies: 2, grains: 4, protein: 2, target: 10 },
    { day: "Wed", fruits: 3, veggies: 3, grains: 3, protein: 2, target: 10 },
    { day: "Thu", fruits: 1, veggies: 3, grains: 3, protein: 3, target: 10 },
    { day: "Fri", fruits: 2, veggies: 4, grains: 2, protein: 2, target: 10 },
    { day: "Sat", fruits: 3, veggies: 3, grains: 4, protein: 3, target: 10 },
    { day: "Sun", fruits: 2, veggies: 3, grains: 3, protein: 2, target: 10 },
  ];

  const chartData = weeklyData?.daily_breakdown || defaultChartData;
  const completionRate = weeklyData?.completion_rate_percentage ?? 92.5;
  const streak = weeklyData?.active_streak_days ?? 5;
  const mealsLogged = weeklyData?.meals_logged_count ?? "21 / 21";
  const hydrationScore = weeklyData?.hydration_score ?? 95;

  const recommendations = weeklyData?.recommendations || [
    "Add more leafy greens to lunch to boost daily iron intake.",
    "Great job on fruit intake! Keep encouraging fresh berries.",
    "Consider replacing sweetened snack bars with crunchy carrot sticks or nuts.",
    "Hydration is on point! Maintain 6 glasses daily.",
  ];

  return (
    <div className="space-y-6">
      {/* 4 Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Target Completion</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-heading text-emerald-600">
            {completionRate}%
          </div>
          <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium inline-block mt-1">
            +4.2% vs last week
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Healthy Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-heading text-amber-600">
            {streak} Days 🔥
          </div>
          <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-medium inline-block mt-1">
            Active Streak!
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Meals Logged</span>
            <Award className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-heading text-blue-600">
            {mealsLogged}
          </div>
          <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-medium inline-block mt-1">
            100% adherence
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Hydration Score</span>
            <Droplet className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold font-heading text-sky-600">
            {hydrationScore}%
          </div>
          <span className="text-[11px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full font-medium inline-block mt-1">
            Excellent intake
          </span>
        </div>
      </div>

      {/* Main Nutrition Compliance Chart */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <div>
            <h3 className="font-heading font-bold text-lg text-slate-800">
              Weekly Nutrient Intake Breakdown
            </h3>
            <p className="text-xs text-slate-500">
              Tracking servings of key food groups for {childName}
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-2 sm:mt-0 text-xs text-slate-500">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
            <span>Fruits</span>
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
            <span>Veggies</span>
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
            <span>Grains</span>
            <span className="w-3 h-3 rounded-full bg-purple-500 inline-block"></span>
            <span>Protein</span>
          </div>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#F1F5F9"
              />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748B", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748B", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1E293B",
                  borderRadius: "12px",
                  color: "#FFF",
                  border: "none",
                }}
                itemStyle={{ color: "#FFF", fontSize: "12px" }}
              />
              <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
              <Bar
                dataKey="fruits"
                name="Fruits 🍎"
                fill="#F43F5E"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="veggies"
                name="Vegetables 🥦"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="grains"
                name="Whole Grains 🌾"
                fill="#F59E0B"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="protein"
                name="Proteins 🍗"
                fill="#8B5CF6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pediatric Recommendations & Actionable Insights */}
      <div className="bg-amber-50/70 p-6 rounded-3xl border border-amber-200">
        <div className="flex items-center space-x-2.5 mb-4">
          <div className="p-2 bg-amber-500 text-white rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-slate-800">
              Pediatric Nutritionist Insights & Tips
            </h4>
            <p className="text-xs text-amber-800">
              Tailored automated advice based on this week's meal logs
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {recommendations.map((tip, idx) => (
            <div
              key={idx}
              className="bg-white p-3.5 rounded-2xl border border-amber-100 flex items-start space-x-2.5 shadow-sm"
            >
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-700 leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
