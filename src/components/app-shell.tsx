"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { TopNavbar } from "./dashboard/top-navbar";
import { ShortcutsModal } from "./shortcuts-modal";

const isMainnetDashboard = (pathname: string | null) =>
  pathname?.startsWith("/app/mainnet") ?? false;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showHelp, setShowHelp] = useState(false);
  const mainnetMode = isMainnetDashboard(pathname);

  if (mainnetMode) {
    return (
      <div className="min-h-screen flex flex-col bg-black">
        <div className="flex flex-col min-w-0 flex-1">{children}</div>
        <ShortcutsModal open={showHelp} onClose={() => setShowHelp(false)} />
      </div>
    );
  }

  return (
    <div className="mainnet-dashboard min-h-screen flex flex-col bg-black text-foreground">
      <div className="flex flex-1 min-h-0 flex-col min-w-0 w-full p-2 lg:p-3">
        <div className="mainnet-content-card w-full min-w-0 lg:min-w-[1280px] max-w-[1920px] mx-auto rounded-xl border overflow-hidden flex flex-col min-h-0 flex-1">
          <TopNavbar isDevnet />
          <div className="flex flex-1 overflow-auto min-h-0 w-full">
            {children}
          </div>
        </div>
      </div>

      <ShortcutsModal open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
