import { colorMap } from "../data/colorMap";

export default function SectionHeading({
  eyebrow,
  title,
  description,
  color = "pine",
  align = "left",
  light = false,
}) {
  const c = colorMap[color] ?? colorMap.pine;
  return (
    <div className={align === "center" ? "text-center mx-auto max-w-2xl" : ""}>
      {eyebrow && (
        <div
          className={`flex items-center gap-2 mb-3 ${
            align === "center" ? "justify-center" : ""
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${c.dot}`} />
          <p className={`eyebrow ${light ? "text-paper/60" : ""}`}>{eyebrow}</p>
        </div>
      )}
      <h2
        className={`text-2xl md:text-3xl font-semibold ${
          light ? "text-paper" : ""
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-3 leading-relaxed ${
            light ? "text-paper/70" : "text-ink/70"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
