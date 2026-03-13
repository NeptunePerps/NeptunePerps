"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

// Mini sparkline data for each period
function generateSparkline(trend: "down" | "up", points = 12) {
  const data = [];
  let val = 50;
  for (let i = 0; i < points; i++) {
    const direction = trend === "up" ? 1 : -1;
    val += direction * (Math.random() * 4 - 1);
    val = Math.max(10, Math.min(90, val));
    data.push({ v: val });
  }
  return data;
}

const performanceData = [
  { label: "1W", value: -5.25, trend: "down" as const },
  { label: "1M", value: -7.15, trend: "down" as const },
  { label: "3M", value: -8.4, trend: "down" as const },
  { label: "6M", value: -5.14, trend: "down" as const },
  { label: "YTD", value: -4.16, trend: "down" as const },
  { label: "1Y", value: 3.89, trend: "up" as const },
];

export function PerformancePanel() {
  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Performance</h3>

      <div className="grid grid-cols-3 gap-2">
        {performanceData.map((item) => {
          const isPositive = item.value >= 0;
          const color = isPositive ? "#22c55e" : "#ef4444";
          const sparkData = generateSparkline(item.trend);

          return (
            <div
              key={item.label}
              className="group relative flex flex-col rounded-lg bg-[#1a1a1a] hover:bg-[#222] transition-all cursor-default overflow-hidden"
            >
              {/* Sparkline background */}
              <div className="h-10 w-full opacity-60 group-hover:opacity-80 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`perf-grad-${item.label}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke={color}
                      strokeWidth={1.5}
                      fill={`url(#perf-grad-${item.label})`}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Value + label */}
              <div className="flex items-center justify-between px-2.5 pb-2 pt-0.5">
                <span className="text-[10px] text-muted-foreground font-medium">{item.label}</span>
                <span
                  className={`text-xs font-mono font-bold ${
                    isPositive ? "text-gain" : "text-loss"
                  }`}
                >
                  {isPositive ? "+" : ""}{item.value.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
