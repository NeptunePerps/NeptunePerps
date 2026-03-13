"use client";

import { useCluster } from "@/components/cluster-provider";
import { useEffect } from "react";
import { LaunchWizard } from "@/components/launch-wizard";

export default function LaunchWizardPage() {
  const { setMode } = useCluster();

  useEffect(() => {
    setMode("devnet");
  }, [setMode]);

  useEffect(() => {
    const prev = document.title;
    document.title = "Neptune · Create market";
    return () => { document.title = prev; };
  }, []);

  return (
    <div className="flex-1 overflow-auto w-full">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
        <header className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground tracking-tight">
            Create a market
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg">
            Deploy a new perpetual futures market. Set name, collateral, and size — then launch in one go.
          </p>
        </header>

        <LaunchWizard />
      </div>
    </div>
  );
}
