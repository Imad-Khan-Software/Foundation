import { useFoundationSettings } from "../context/useFoundationSettings";

// Single reusable brand mark used everywhere the foundation logo appears —
// public navbar/footer, admin sidebar/header, admin login. It always reads
// from Foundation Settings (via useFoundationSettings) so an admin uploading
// a new logo updates every one of these locations automatically, with
// nothing hard-coded per component.
//
// `className` controls the circle's size/background/text color (e.g.
// "h-9 w-9 bg-pine text-paper text-base") so each call site keeps its own
// look; this component only decides whether to render the uploaded image or
// the "IK" fallback.
export default function BrandLogo({ className = "h-9 w-9 bg-pine text-paper text-base" }) {
  const { logoUrl, name } = useFoundationSettings();

  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full font-display ${className}`}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={name ? `${name} logo` : "Foundation logo"}
          className="h-full w-full object-contain"
        />
      ) : (
        "IK"
      )}
    </span>
  );
}
