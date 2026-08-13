/**
 * Per-person colours. Each entry pairs a saturated bar/dot colour with a soft
 * fill and a dark text colour, so a shift chip stays legible against the
 * calendar's white and warm-grey cells.
 *
 * Hues are spaced around the wheel and deliberately avoid cardinal `#990000`,
 * which is reserved for "today" and for actions.
 */
export type StaffColor = {
  name: string;
  bar: string;
  fill: string;
  text: string;
};

export const STAFF_COLORS: StaffColor[] = [
  { name: "teal", bar: "#0f766e", fill: "#e2f3f1", text: "#0b544e" },
  { name: "indigo", bar: "#4338ca", fill: "#e8e7fb", text: "#312a9c" },
  { name: "amber", bar: "#a16207", fill: "#fbf1da", text: "#7a4a05" },
  { name: "violet", bar: "#7e22ce", fill: "#f3e6fb", text: "#5f1a9b" },
  { name: "sky", bar: "#0369a1", fill: "#e0eff9", text: "#034e78" },
  { name: "green", bar: "#15803d", fill: "#e3f3e7", text: "#0f5c2c" },
  { name: "rose", bar: "#be1250", fill: "#fbe6ed", text: "#8f0c3c" },
  { name: "slate", bar: "#475569", fill: "#eaedf1", text: "#33404f" },
  { name: "orange", bar: "#c2410c", fill: "#fceadf", text: "#8f3009" },
  { name: "cyan", bar: "#0e7490", fill: "#e0f0f4", text: "#0a566b" },
];

export function staffColor(colorIndex: number): StaffColor {
  return STAFF_COLORS[colorIndex % STAFF_COLORS.length];
}

/** Open shifts are intentionally colourless — a dashed neutral, so they read as unfilled. */
export const OPEN_SHIFT_COLOR: StaffColor = {
  name: "open",
  bar: "#8b877e",
  fill: "#faf9f7",
  text: "#5c5952",
};
