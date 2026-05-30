/**
 * Skateur chibi rendu inline (SVG) à la position d'un point Recharts,
 * pour qu'il « skate » sur la dernière valeur de la courbe.
 *
 * Le skateboard du chibi est aligné sur cy (la valeur du point) — le reste
 * du personnage est au-dessus. Une animation glide légère le fait bouger.
 */
interface Props {
  cx: number;
  cy: number;
}

/** Largeur du chibi (viewBox 36×36) */
const W = 36;
const H = 36;

export function SkaterOnPoint({ cx, cy }: Props) {
  // Décale le chibi pour que le skateboard (y=32 dans le viewBox) tombe sur cy
  const tx = cx - W / 2;
  const ty = cy - 32;

  return (
    <g transform={`translate(${tx}, ${ty})`} pointerEvents="none">
      <g
        className="animate-glide"
        style={{ transformOrigin: `${W / 2}px ${H}px` }}
      >
        {/* Ombre au sol */}
        <ellipse cx="18" cy="32" rx="11" ry="1.5" fill="#3a1c1d" opacity="0.4" />
        {/* Skateboard */}
        <rect x="6" y="28" width="24" height="3" rx="1.5" fill="#3a1c1d" />
        {/* Roues */}
        <circle cx="10" cy="32" r="1.5" fill="#e0b450" stroke="#a07a30" strokeWidth="0.5" />
        <circle cx="26" cy="32" r="1.5" fill="#e0b450" stroke="#a07a30" strokeWidth="0.5" />
        {/* Jambes */}
        <path
          d="M14 28 L13 22 M22 28 L23 22"
          stroke="#e0b450"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Corps */}
        <rect x="13" y="14" width="10" height="10" rx="2" fill="#e0b450" />
        {/* Bras */}
        <path
          d="M13 16 L8 19 M23 16 L28 14"
          stroke="#e0b450"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Tête */}
        <circle cx="18" cy="9" r="5" fill="#f0c878" />
        {/* Cheveux */}
        <path
          d="M13 8 Q13 4 18 4 Q23 4 23 8 L23 9 Q22 7 20 7 L16 7 Q14 7 13 9 Z"
          fill="#3a1c1d"
        />
        {/* Yeux */}
        <circle cx="16" cy="9.5" r="0.6" fill="#1a0a0a" />
        <circle cx="20" cy="9.5" r="0.6" fill="#1a0a0a" />
        {/* Bouche */}
        <path
          d="M16 11.5 Q18 13 20 11.5"
          stroke="#3a1c1d"
          strokeWidth="0.8"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </g>
  );
}
