"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/logo.png";

/** Neptune logo (logo.png) only — no text. Sizes: sm 52px, md 72px, lg 104px. */
export function NeptuneLogo({
  className,
  size = "md",
}: {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const iconSize = size === "sm" ? 52 : size === "md" ? 72 : 104;
  return (
    <Image
      src={LOGO_SRC}
      alt="Neptune"
      width={iconSize}
      height={iconSize}
      className={cn("shrink-0 object-contain", className)}
      priority
    />
  );
}
