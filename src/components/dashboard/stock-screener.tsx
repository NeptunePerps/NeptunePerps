"use client";

import { Check, Maximize2, Settings } from "lucide-react";
import { PositionsTable } from "@/components/positions-table";

interface StockScreenerProps {
  title?: string;
  children?: React.ReactNode;
}

export function StockScreener({
  title = "Positions & history",
  children,
}: StockScreenerProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 shrink-0">
        <h3 className="text-[13px] sm:text-sm font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-2">
          <button className="text-muted-foreground hover:text-foreground" aria-label="Filter">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button className="text-muted-foreground hover:text-foreground" aria-label="Expand">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button className="text-muted-foreground hover:text-foreground" aria-label="Settings">
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        {children ?? <PositionsTable />}
      </div>
    </div>
  );
}
