import { cn } from "@/lib/utils";

interface SparklineProps {
  /** Valeurs ordonnées (ancien → récent) à tracer. */
  points: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  /** La couleur du trait suit `currentColor` — passer une classe `text-*`. */
  className?: string;
}

/**
 * Mini-courbe SVG (sparkline) sans axes ni légende. Trait + aire légère + point
 * de fin. La couleur est portée par `currentColor`, donc définie via `className`
 * (`text-positive`, `text-negative`, `text-muted-foreground`…).
 */
export function Sparkline({
  points,
  width = 72,
  height = 22,
  strokeWidth = 1.5,
  className,
}: SparklineProps) {
  // Moins de 2 points : pas de courbe possible → tiret pointillé discret.
  if (!points || points.length < 2) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={cn("text-muted-foreground/50", className)}
        aria-hidden="true"
      >
        <line
          x1={2}
          y1={height / 2}
          x2={width - 2}
          y2={height / 2}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray="2 3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const pad = strokeWidth + 1;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const coords = points.map((v, i) => {
    const x = pad + (i / (points.length - 1)) * innerW;
    const y = pad + (1 - (v - min) / range) * innerH;
    return [x, y] as const;
  });

  const line = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  const [lastX, lastY] = coords[coords.length - 1];
  const area = `${line} L${lastX.toFixed(2)} ${height} L${coords[0][0].toFixed(2)} ${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
    >
      <path d={area} fill="currentColor" fillOpacity={0.1} />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={strokeWidth + 0.5} fill="currentColor" />
    </svg>
  );
}
