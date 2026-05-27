/**
 * AuroraBackground — fond animé subtil pour donner du relief sans distraire.
 *
 * Trois blobs gold/warm flous dérivent lentement en boucle. Très faible
 * opacité — visible mais jamais en compétition avec le contenu. Fixed
 * full-screen derrière tout le reste (z-index -10).
 *
 * Server Component compatible — pas d'état, animation 100% CSS.
 */
export function AuroraBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Voile noir de base (s'assure que rien ne traverse) */}
      <div className="absolute inset-0 bg-background" />

      {/* Blob or — haut gauche */}
      <div
        className="animate-aurora-1 absolute -top-1/4 -left-1/4 h-[60vh] w-[60vw] rounded-full opacity-[0.18] blur-[120px]"
        style={{
          background:
            "radial-gradient(circle at center, hsl(38 92% 50%), transparent 60%)",
        }}
      />

      {/* Blob orange chaud — bas droite */}
      <div
        className="animate-aurora-2 absolute -bottom-1/3 -right-1/4 h-[70vh] w-[60vw] rounded-full opacity-[0.14] blur-[140px]"
        style={{
          background:
            "radial-gradient(circle at center, hsl(28 90% 45%), transparent 60%)",
        }}
      />

      {/* Blob discret violet/bleu profond — milieu, pour la profondeur */}
      <div
        className="animate-aurora-1 absolute top-1/3 left-1/2 h-[40vh] w-[40vw] -translate-x-1/2 rounded-full opacity-[0.08] blur-[100px]"
        style={{
          background:
            "radial-gradient(circle at center, hsl(260 60% 50%), transparent 60%)",
          animationDelay: "-8s",
        }}
      />

      {/* Voile noir subtil au-dessus pour assombrir l'ensemble */}
      <div className="absolute inset-0 bg-background/40" />
    </div>
  );
}
