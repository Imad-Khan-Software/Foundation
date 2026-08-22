// Tailwind's scanner only picks up class names that appear literally in
// source. Pillar colors are chosen at data-level (education/health/care),
// so this map keeps every class name written out in full instead of being
// built with string interpolation like `bg-${color}`.

export const colorMap = {
  education: {
    bg: "bg-education",
    bgSoft: "bg-education/10",
    text: "text-education-dark",
    border: "border-education",
    ring: "ring-education",
    dot: "bg-education",
  },
  health: {
    bg: "bg-health",
    bgSoft: "bg-health/10",
    text: "text-health-dark",
    border: "border-health",
    ring: "ring-health",
    dot: "bg-health",
  },
  care: {
    bg: "bg-care",
    bgSoft: "bg-care/10",
    text: "text-care-dark",
    border: "border-care",
    ring: "ring-care",
    dot: "bg-care",
  },
  pine: {
    bg: "bg-pine",
    bgSoft: "bg-pine/10",
    text: "text-pine-dark",
    border: "border-pine",
    ring: "ring-pine",
    dot: "bg-pine",
  },
};
