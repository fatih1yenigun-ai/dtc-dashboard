// Theme-aware chart color palettes

export const CHART_COLORS_DARK = [
  "#00f0ff", "#7f5af0", "#2ee89e", "#ff6bcb", "#ffd866",
  "#4facfe", "#f093fb", "#ff8c42", "#00e676", "#ff5252",
];

export const CHART_COLORS_LIGHT = [
  "#185fa5", "#534ab7", "#0f6e56", "#993c1d", "#854f0b",
  "#2563eb", "#7c3aed", "#c2410c", "#15803d", "#dc2626",
];

export function getChartColors(theme: "dark" | "light") {
  return theme === "dark" ? CHART_COLORS_DARK : CHART_COLORS_LIGHT;
}

export function getGlowStyle(color: string, theme: "dark" | "light") {
  if (theme === "dark") {
    return {
      filter: `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 20px ${color})`,
      opacity: 0.55,
    };
  }
  return {
    filter: "drop-shadow(0 3px 10px rgba(0,0,0,0.18))",
  };
}

export function getGlowMap(theme: "dark" | "light"): Record<string, string> {
  if (theme === "light") return {};
  return {
    "#00f0ff": "rgba(0,240,255,0.4)",
    "#7f5af0": "rgba(127,90,240,0.4)",
    "#2ee89e": "rgba(46,232,158,0.4)",
    "#ff6bcb": "rgba(255,107,203,0.4)",
    "#ffd866": "rgba(255,216,102,0.4)",
    "#4facfe": "rgba(79,172,254,0.4)",
    "#f093fb": "rgba(240,147,251,0.4)",
    "#ff8c42": "rgba(255,140,66,0.4)",
    "#00e676": "rgba(0,230,118,0.4)",
    "#ff5252": "rgba(255,82,82,0.4)",
  };
}
