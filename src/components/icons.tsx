// Thin-stroke SVG icons (never emoji). 1.5px strokes, currentColor.

import type { SVGProps } from "react";

const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...p,
});

export const PlayIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M8 5.5v13l10.5-6.5z" />
  </svg>
);
export const PauseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M9 5.5v13M15 5.5v13" />
  </svg>
);
export const DownloadIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14" />
  </svg>
);
export const MoreIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h10M4 17h13" />
  </svg>
);
export const CloseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const XrayIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M8 9h8M9.5 12h6.5M11 15h5" />
  </svg>
);
export const ChevronLeft = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M14.5 6 8.5 12l6 6" />
  </svg>
);
export const ChevronRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M9.5 6l6 6-6 6" />
  </svg>
);
export const RecordIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="7.5" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
);

// Seed glyphs: tiny procedural drawings of each recursion.
export const BonsaiGlyph = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 20v-6M12 14l-4-4M12 14l4-4M8 10 6 7M8 10l1.5-3.5M16 10l-1.5-3.5M16 10l2-3" />
  </svg>
);
export const RainGlyph = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 6h16M4 10h5M15 10h5M4 14h1.7M7.3 14H9M15 14h1.7M18.3 14H20" />
    <path d="M7 18.5v1M17 18.5v1M12 17.5v1" />
  </svg>
);
export const StonesGlyph = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 4 20 18H4z M8 11h8M12 18l-4-7M12 18l4-7" />
  </svg>
);
export const SunflowerGlyph = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    {Array.from({ length: 16 }, (_, i) => {
      const a = (i * 137.508 * Math.PI) / 180;
      const r = 1.8 * Math.sqrt(i + 1);
      return <circle key={i} cx={12 + Math.cos(a) * r} cy={12 + Math.sin(a) * r} r={i % 3 === 0 ? 1.1 : 0.6} fill="currentColor" stroke="none" />;
    })}
  </svg>
);
