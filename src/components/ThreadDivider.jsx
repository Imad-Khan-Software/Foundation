// The "thread" is the site's signature motif: three strands — amber
// (Education), blue (Health), maroon (Care) — woven together, standing in
// for Ikhlass binding its three areas of work into one effort.

export default function ThreadDivider({ className = "" }) {
  return (
    <svg
      viewBox="0 0 1200 48"
      preserveAspectRatio="none"
      className={`w-full h-8 md:h-10 ${className}`}
      aria-hidden="true"
    >
      <path
        d="M0,24 C 100,4 200,44 300,24 C 400,4 500,44 600,24 C 700,4 800,44 900,24 C 1000,4 1100,44 1200,24"
        fill="none"
        stroke="#C68A3D"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M0,24 C 100,44 200,4 300,24 C 400,44 500,4 600,24 C 700,44 800,4 900,24 C 1000,44 1100,4 1200,24"
        fill="none"
        stroke="#3B6EA5"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M-50,24 C 50,10 150,38 250,24 C 350,10 450,38 550,24 C 650,10 750,38 850,24 C 950,10 1050,38 1150,24 C 1200,17 1220,24 1250,24"
        fill="none"
        stroke="#8C3F4D"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
}
