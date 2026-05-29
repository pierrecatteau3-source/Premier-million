import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS } from "@/lib/achievements/definitions";

const EQUIPMENT_SLOTS = [
  "Tenue",
  "Couvre-chef",
  "Lunettes",
  "Bijou",
  "Accessoire main",
];

export default async function PersonnagePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const unlockedCount = await prisma.userAchievement.count({ where: { userId } });
  const total = ACHIEVEMENTS.length;
  const level = Math.floor(unlockedCount / 3) + 1;

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
      {/* Pio en grand */}
      <div
        className="relative flex items-end justify-center overflow-hidden rounded-lg border border-border"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, var(--pm-surface-3), var(--pm-surface) 60%, var(--pm-bg-deep))",
        }}
      >
        <span className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">
          Mon associé
        </span>
        <span className="absolute right-4 top-4 rounded-pill border border-gold/30 bg-gold/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-gold-bright">
          Niv. {level}
        </span>
        {/* Halo doré */}
        <div
          className="pointer-events-none absolute inset-x-12 bottom-10 top-1/4 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(224,180,80,0.5), transparent 70%)" }}
        />
        <div className="relative aspect-[3/4] w-full max-w-[400px]">
          <Image
            src="/character/pio-fullbody.png"
            alt="Pio, ton associé"
            fill
            sizes="(max-width: 1024px) 100vw, 400px"
            priority
            className="object-contain"
          />
        </div>
      </div>

      {/* Fiche + équipement */}
      <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
            Ton associé bâtisseur
          </div>
          <h1 className="mt-2 font-display text-[44px] font-bold leading-none tracking-[-0.03em]">
            Pio
          </h1>
          <p className="mt-3 max-w-[440px] font-display text-[15px] italic leading-relaxed text-ink-soft">
            « Je tiens les comptes du trésor, je te motive quand ça monte, et je te vanne
            quand tu fais le malin. On vise le million, tranquille. »
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <div className="rounded-md border border-border bg-surface-deep px-4 py-3">
              <div className="font-display text-2xl font-bold tabular-nums text-gold-bright">
                {level}
              </div>
              <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-muted">
                Niveau
              </div>
            </div>
            <div className="rounded-md border border-border bg-surface-deep px-4 py-3">
              <div className="font-display text-2xl font-bold tabular-nums text-ink">
                {unlockedCount}
                <span className="ml-1 font-mono text-[11px] text-ink-dim">/ {total}</span>
              </div>
              <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-muted">
                Succès débloqués
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="font-display text-[22px] font-bold tracking-[-0.025em]">
            Équipement <em className="italic text-gold">de Pio</em>
          </h2>
          <p className="mt-2 text-[13px] leading-snug text-ink-muted">
            Débloque des pièces en décrochant des succès. Bientôt jouable.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {EQUIPMENT_SLOTS.map((slot) => (
              <div
                key={slot}
                className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border bg-surface-deep px-3 py-5 text-center"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full border border-border text-ink-dim">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="11" width="14" height="9" rx="1.5" />
                    <path d="M8 11V8a4 4 0 018 0v3" />
                  </svg>
                </span>
                <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-muted">
                  {slot}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
