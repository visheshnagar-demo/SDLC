import React, { useState } from "react";
import { Calculator, CloudRain, Sparkles } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export function YieldCalculator({ yieldData = {} }) {
  const [area, setArea] = useState(yieldData.catchment_area_sqm || 500);
  const [rainfall, setRainfall] = useState(yieldData.precipitation_mm || 25);
  const [efficiency, setEfficiency] = useState(
    yieldData.efficiency_factor || 0.9,
  );

  const calculatedYield = Math.round(area * rainfall * efficiency);

  const chartData = yieldData.historical_rainfall || [
    { date: "Mon", precipitation_mm: 12, yield_liters: 12 * area * efficiency },
    { date: "Tue", precipitation_mm: 5, yield_liters: 5 * area * efficiency },
    { date: "Wed", precipitation_mm: 35, yield_liters: 35 * area * efficiency },
    { date: "Thu", precipitation_mm: 0, yield_liters: 0 },
    { date: "Fri", precipitation_mm: 18, yield_liters: 18 * area * efficiency },
    { date: "Sat", precipitation_mm: 25, yield_liters: 25 * area * efficiency },
    { date: "Sun", precipitation_mm: 8, yield_liters: 8 * area * efficiency },
  ];

  return (
    <div className="space-y-6">
      {/* Interactive Yield Calculator Tool */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-sky-500/10 p-2.5 rounded-lg border border-sky-500/20 text-sky-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Rainwater Harvest Yield Calculator
            </h3>
            <p className="text-xs text-slate-400">
              Formula: Catchment Area (m²) &times; Precipitation Depth (mm)
              &times; Runoff Efficiency (0.9)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="space-y-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                <span>Rooftop Catchment Area:</span>
                <span className="font-mono text-sky-400">{area} m²</span>
              </div>
              <input
                type="range"
                min="50"
                max="5000"
                step="25"
                value={area}
                onChange={(e) => setArea(Number(e.target.value))}
                className="w-full accent-sky-500 bg-slate-700 h-2 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                <span>Rainfall Event Depth:</span>
                <span className="font-mono text-sky-400">{rainfall} mm</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={rainfall}
                onChange={(e) => setRainfall(Number(e.target.value))}
                className="w-full accent-sky-500 bg-slate-700 h-2 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                <span>Runoff Efficiency Factor:</span>
                <span className="font-mono text-sky-400">
                  {efficiency.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={efficiency}
                onChange={(e) => setEfficiency(Number(e.target.value))}
                className="w-full accent-sky-500 bg-slate-700 h-2 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Forecast Output Result Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-sky-900/40 to-slate-900 border border-sky-500/30 rounded-xl p-6 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Estimated Harvest Volume</span>
              </div>
              <div className="mt-4 flex items-baseline space-x-3">
                <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight font-mono">
                  {calculatedYield.toLocaleString()}
                </span>
                <span className="text-lg font-bold text-sky-300">Liters</span>
              </div>
              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                A{" "}
                <span className="font-semibold text-white">{rainfall} mm</span>{" "}
                rainfall event across a{" "}
                <span className="font-semibold text-white">{area} m²</span>{" "}
                rooftop surface with an efficiency of{" "}
                <span className="font-semibold text-white">{efficiency}</span>{" "}
                yields approx.{" "}
                <span className="font-semibold text-sky-300">
                  {(calculatedYield / 1000).toFixed(2)} m³
                </span>{" "}
                of purified rainwater.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-sky-500/20 text-xs text-slate-400 flex items-center justify-between">
              <span>Non-Potable Supply Potential:</span>
              <span className="text-emerald-400 font-semibold">
                Sufficient for ~{Math.round(calculatedYield / 150)} Toilet Flush
                Cycles
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Yield & Rainfall Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <CloudRain className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Historical Precipitation & Harvest Yield
            </h3>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis yAxisId="left" stroke="#38bdf8" fontSize={12} unit=" L" />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#a855f7"
                fontSize={12}
                unit=" mm"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="yield_liters"
                name="Harvested Yield (L)"
                fill="#0284c7"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="precipitation_mm"
                name="Rainfall Depth (mm)"
                fill="#a855f7"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default YieldCalculator;
