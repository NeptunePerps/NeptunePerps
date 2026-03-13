"use client";

import { PieChart, Pie, Cell } from "recharts";

const GAUGE_SEGMENTS = [
  { name: "Strong Sell", value: 20, color: "#ef4444" },
  { name: "Sell", value: 20, color: "#f97316" },
  { name: "Neutral", value: 20, color: "#525252" },
  { name: "Buy", value: 20, color: "#22c55e" },
  { name: "Strong Buy", value: 20, color: "#16a34a" },
];

const NEEDLE_VALUE = 15;

function GaugeNeedle({
  cx,
  cy,
  outerRadius,
  value,
}: {
  cx: number;
  cy: number;
  outerRadius: number;
  value: number;
}) {
  const angle = 180 - (value / 100) * 180;
  const radian = (Math.PI / 180) * angle;
  const needleLength = outerRadius * 0.7;
  const x = cx + needleLength * Math.cos(radian);
  const y = cy - needleLength * Math.sin(radian);

  return (
    <g>
      <line
        x1={cx}
        y1={cy}
        x2={x}
        y2={y}
        stroke="#e5e5e5"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={5} fill="#e5e5e5" />
    </g>
  );
}

export function TechnicalsPanel() {
  const width = 220;
  const height = 124;
  const cx = 110;
  const cy = 88;
  const outerRadius = 72;
  const innerRadius = 46;

  return (
    <div className="p-4">
      <div className="flex items-center mb-2">
        <h3 className="text-sm font-semibold text-foreground">Technicals</h3>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative w-full max-w-[220px]" style={{ height }}>
          <PieChart width={width} height={height}>
            <Pie
              data={GAUGE_SEGMENTS}
              cx={cx}
              cy={cy}
              startAngle={180}
              endAngle={0}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              isAnimationActive={false}
            >
              {GAUGE_SEGMENTS.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
          <svg
            className="absolute inset-0 pointer-events-none"
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
          >
            <GaugeNeedle
              cx={cx}
              cy={cy}
              outerRadius={outerRadius}
              value={NEEDLE_VALUE}
            />
          </svg>

          <span
            className="absolute text-[8px] text-muted-foreground font-mono leading-tight text-center"
            style={{ left: 0, bottom: 2 }}
          >
            STRONG
            <br />
            SELL
          </span>
          <span
            className="absolute text-[8px] text-muted-foreground font-mono"
            style={{ left: 22, top: 18 }}
          >
            SELL
          </span>
          <span
            className="absolute text-[8px] text-muted-foreground font-mono"
            style={{
              left: "50%",
              top: 2,
              transform: "translateX(-50%)",
            }}
          >
            NEUTRAL
          </span>
          <span
            className="absolute text-[8px] text-muted-foreground font-mono"
            style={{ right: 22, top: 18 }}
          >
            BUY
          </span>
          <span
            className="absolute text-[8px] text-muted-foreground font-mono leading-tight text-center"
            style={{ right: 0, bottom: 2 }}
          >
            STRONG
            <br />
            BUY
          </span>
        </div>

        <div className="bg-loss/20 text-loss text-xs font-semibold px-4 py-1 rounded-full -mt-3">
          Strong Sell
        </div>
      </div>
    </div>
  );
}
