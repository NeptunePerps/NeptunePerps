/**
 * Neptune brand constants — single source for name, URLs, and palette.
 */

export const BRAND = {
  name: "Neptune",
  tagline: "Gasless permissionless perpetuals.",
  siteUrl: "https://neptune-perps.trade",
  twitter: "https://x.com/NeptunePerps",
  github: "https://github.com/NeptunePerps",
  /** Primary: Neptune cyan/teal */
  primary: "#00E5FF",
  primaryDim: "rgba(0, 229, 255, 0.15)",
  /** Secondary: deep blue / indigo */
  secondary: "#2E5BFF",
  secondaryDim: "rgba(46, 91, 255, 0.12)",
  /** Background: deep near-black */
  background: "#030407",
  /** Neutral surfaces */
  card: "#0a0b0f",
  border: "rgba(255,255,255,0.06)",
} as const;
