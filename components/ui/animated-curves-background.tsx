/**
 * AnimatedCurvesBackground — fond animé style Revolut.
 *
 * 3 courbes SVG fines en or qui dérivent horizontalement à des vitesses
 * différentes (effet parallax). Très discret, ne distrait pas du contenu.
 *
 * Server Component compatible — 100% CSS animation.
 */
export function AnimatedCurvesBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      {/* Vignette douce vers le centre pour la profondeur */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 0%, hsl(var(--background)) 90%)",
        }}
      />

      {/* Courbe 1 — fine, haut, drift lent vers la gauche */}
      <svg
        className="absolute inset-x-0 top-[12%] w-[200%] opacity-[0.18] animate-curve-drift-slow"
        viewBox="0 0 2880 200"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="curve-gold-1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(38 92% 50%)" stopOpacity="0" />
            <stop offset="30%" stopColor="hsl(38 92% 60%)" stopOpacity="1" />
            <stop offset="70%" stopColor="hsl(38 92% 60%)" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(38 92% 50%)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M 0 100 C 240 30, 480 170, 720 100 S 1200 30, 1440 100 S 1920 170, 2160 100 S 2640 30, 2880 100"
          fill="none"
          stroke="url(#curve-gold-1)"
          strokeWidth="1.5"
        />
      </svg>

      {/* Courbe 2 — milieu, drift vers la droite (opposé), plus rapide */}
      <svg
        className="absolute inset-x-0 top-[45%] w-[200%] -translate-x-1/2 opacity-[0.14] animate-curve-drift-medium"
        viewBox="0 0 2880 200"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="curve-gold-2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(28 90% 50%)" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(28 90% 55%)" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(28 90% 50%)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M 0 100 C 320 180, 640 20, 960 100 S 1600 180, 1920 100 S 2560 20, 2880 100"
          fill="none"
          stroke="url(#curve-gold-2)"
          strokeWidth="1"
        />
      </svg>

      {/* Courbe 3 — bas, très lent, plus large */}
      <svg
        className="absolute inset-x-0 bottom-[20%] w-[200%] opacity-[0.10] animate-curve-drift-slowest"
        viewBox="0 0 2880 200"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="curve-gold-3" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(38 92% 50%)" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(38 80% 50%)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(38 92% 50%)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M 0 100 C 360 40, 720 160, 1080 100 S 1800 40, 2160 100 S 2880 160, 2880 100"
          fill="none"
          stroke="url(#curve-gold-3)"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
