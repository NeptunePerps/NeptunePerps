"use client";

import { useEffect } from "react";
import { TradingPanel } from "@/components/trading-panel";
import { PerformancePanel } from "./performance-panel";
import { TechnicalsPanel } from "./technicals-panel";

interface TradingDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMarket: string;
  markPrice: number;
}

export function TradingDrawer({ open, onOpenChange, currentMarket, markPrice }: TradingDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  return (
    <>
      {/* Backdrop */}
      <div
        role="presentation"
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[380px] bg-background border-l border-border shadow-xl flex flex-col transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Trade panel"
      >
        <div className="flex-1 overflow-y-auto">
          {/* Order panel – same trade logic as TradingPanel (connect wallet message when not connected) */}
          <div className="p-4 border-b border-border">
            <TradingPanel currentMarket={currentMarket} markPrice={markPrice} />
          </div>

          {/* Performance */}
          <div className="border-b border-border">
            <PerformancePanel />
          </div>

          {/* Technicals */}
          <div>
            <TechnicalsPanel />
          </div>
        </div>
      </aside>
    </>
  );
}
