"use client";

import { useState, useMemo, useCallback } from "react";
import {
  AreaChart,
  Area,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Crosshair,
  PenTool,
  Type,
  LayoutGrid,
} from "lucide-react";

type ChartDataPoint = {
  date: string;
  dateObj: Date;
  price: number;
  month: number;
  year: number;
  day: number;
  dayOfWeek: string;
  monthLabel: string;
};

// Generate chart data around a given price (e.g. SOL ~80)
function generateChartData(centerPrice: number): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);
  let price = centerPrice;
  const totalDays = 180;
  const volatility = centerPrice < 100 ? centerPrice * 0.02 : 2;

  for (let i = 0; i < totalDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const trend = i < 40 ? 0.5 : i < 80 ? -0.5 : i < 120 ? 0.3 : -0.4;
    const noise = (Math.random() - 0.5) * volatility;
    price = price + trend + noise;
    price = Math.max(centerPrice * 0.7, Math.min(centerPrice * 1.3, price));

    data.push({
      date: date.toISOString(),
      dateObj: new Date(date),
      price: Number(price.toFixed(2)),
      month: date.getMonth(),
      year: date.getFullYear(),
      day: date.getDate(),
      dayOfWeek: date.toLocaleDateString("en-US", { weekday: "short" }),
      monthLabel: date.toLocaleDateString("en-US", { month: "short" }),
    });
  }

  return data;
}

const TIME_PERIODS = ["1D", "5D", "1W", "1M", "3M", "6M", "YTD", "1Y", "5Y", "ALL"];

function buildTimelineTicks(data: ChartDataPoint[]) {
  const ticks: Array<{ index: number; label: string; isMajor: boolean }> = [];
  let lastMonth = -1;
  let lastYear = -1;

  data.forEach((d, i) => {
    const isNewMonth = d.month !== lastMonth;
    const isNewYear = d.year !== lastYear && d.month === 0;

    if (isNewYear) {
      ticks.push({ index: i, label: String(d.year), isMajor: true });
      lastYear = d.year;
      lastMonth = d.month;
    } else if (isNewMonth) {
      ticks.push({ index: i, label: d.monthLabel, isMajor: true });
      lastMonth = d.month;
    }
  });

  return ticks;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint; value: number }>;
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-surface border border-border rounded px-3 py-2">
        <p className="text-xs text-muted-foreground">
          {d.dayOfWeek}, {d.monthLabel} {d.day} &apos;{String(d.year).slice(2)}
        </p>
        <p className="text-sm font-mono text-foreground">
          {payload[0].value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
}

interface PriceChartProps {
  symbol?: string;
  currentPrice?: number;
}

export function PriceChart({ symbol = "SOL", currentPrice: currentPriceProp }: PriceChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("6M");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const effectivePrice = currentPriceProp && currentPriceProp > 0 ? currentPriceProp : 80;
  const chartData = useMemo(() => generateChartData(effectivePrice), [effectivePrice]);
  const timelineTicks = useMemo(() => buildTimelineTicks(chartData), [chartData]);

  const displayPrice = currentPriceProp && currentPriceProp > 0 ? currentPriceProp : (chartData.length > 0 ? chartData[chartData.length - 1].price : effectivePrice);

  const handleMouseMove = useCallback((state: unknown) => {
    const s = state as { activeTooltipIndex?: number | { index?: number } | null };
    const raw = s?.activeTooltipIndex;
    const idx =
      typeof raw === "number"
        ? raw
        : raw && typeof raw === "object" && typeof (raw as { index?: number }).index === "number"
          ? (raw as { index: number }).index
          : undefined;
    if (idx !== undefined) setHoveredIndex(idx);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  const hoveredData = hoveredIndex !== null ? chartData[hoveredIndex] : null;
  const crosshairPrice = hoveredData ? hoveredData.price : chartData[chartData.length - 1]?.price ?? displayPrice;

  return (
    <div className="flex flex-col h-full relative">
      {/* Left Toolbar */}
      <div className="absolute left-3 top-1/3 -translate-y-1/2 z-10 flex flex-col gap-0.5">
        {[Crosshair, PenTool, Type, LayoutGrid].map((Icon, idx) => (
          <button
            key={idx}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
            aria-label={`Tool ${idx + 1}`}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Chart Area */}
      <div className="flex-1 pl-12 pr-2 pt-2 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 65, left: 0, bottom: 0 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id="priceGradient-dashboard" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#00e5ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="1 6"
              stroke="#1e1e1e"
              horizontal={true}
              vertical={true}
            />
            <YAxis
              domain={["auto", "auto"]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#555", fontSize: 11, fontFamily: "monospace" }}
              orientation="right"
              tickFormatter={(v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              dx={10}
              width={70}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#444", strokeDasharray: "3 3" }} />
            <ReferenceLine
              y={displayPrice}
              stroke="#00e5ff"
              strokeDasharray="4 4"
              strokeOpacity={0.4}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#00e5ff"
              strokeWidth={1.5}
              fill="url(#priceGradient-dashboard)"
              dot={false}
              activeDot={{ r: 3, fill: "#00e5ff", stroke: "#00e5ff" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Symbol + Price badge (primary color) */}
      <div className="absolute right-20 bottom-[35%] z-10">
        <div className="flex items-center gap-0.5">
          <span className="bg-primary text-primary-foreground text-[11px] font-mono px-1.5 py-0.5 rounded-sm">
            {symbol}
          </span>
          <span className="bg-primary text-primary-foreground text-[11px] font-mono px-1.5 py-0.5 rounded-sm">
            {displayPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Crosshair price label on Y-axis */}
      <div className="absolute right-2 top-[40%] z-10">
        <div className="flex items-center gap-1 bg-surface border border-border rounded px-2 py-0.5">
          <span className="text-[10px] text-muted-foreground">+</span>
          <span className="text-[11px] font-mono text-foreground">
            {crosshairPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Time period selector */}
      <div className="flex items-center justify-center py-2 shrink-0">
        <div className="flex items-center gap-0.5 border border-border rounded-lg px-1 py-0.5">
          {TIME_PERIODS.map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors ${
                selectedPeriod === period
                  ? "bg-surface text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline / Date Axis Bar */}
      <div className="shrink-0 border-t border-border relative h-10 ml-12 mr-2">
        <div className="absolute inset-0 flex items-start">
          {chartData.map((_, i) => {
            const leftPct = (i / (chartData.length - 1)) * 100;
            const isMonthStart = timelineTicks.some((t) => t.index === i);
            return (
              <div
                key={i}
                className="absolute top-0"
                style={{ left: `${leftPct}%` }}
              >
                <div
                  className={`w-px ${isMonthStart ? "h-3 bg-muted-foreground" : "h-1.5 bg-border"}`}
                />
              </div>
            );
          })}
        </div>

        <div className="absolute inset-0">
          {timelineTicks.map((tick) => {
            const leftPct = (tick.index / (chartData.length - 1)) * 100;
            return (
              <span
                key={tick.index}
                className="absolute top-4 text-[11px] text-muted-foreground font-mono -translate-x-1/2"
                style={{ left: `${leftPct}%` }}
              >
                {tick.label}
              </span>
            );
          })}
        </div>

        {hoveredData && hoveredIndex !== null && (
          <div
            className="absolute -top-1 -translate-x-1/2 z-20"
            style={{ left: `${(hoveredIndex / (chartData.length - 1)) * 100}%` }}
          >
            <div className="bg-foreground text-background text-[10px] font-mono px-2 py-0.5 rounded-full whitespace-nowrap">
              {hoveredData.dayOfWeek}, {hoveredData.monthLabel} {hoveredData.day} &apos;
              {String(hoveredData.year).slice(2)}
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-px h-6 bg-muted-foreground opacity-50" />
          </div>
        )}
      </div>
    </div>
  );
}
