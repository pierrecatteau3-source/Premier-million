interface DecisionItem {
  id: string;
  date: string;
  description: string;
}

function formatDay(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" })
    .format(new Date(iso))
    .toUpperCase()
    .replace(".", "");
}

export function DecisionJournal({ decisions }: { decisions: DecisionItem[] }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <h3 className="font-display text-[22px] font-bold tracking-[-0.025em]">
        Journal des <em className="italic text-gold">décisions</em>
      </h3>
      <p className="mt-2 text-[13px] leading-snug text-ink-muted">
        Chaque mouvement laisse une trace. C&apos;est ce qui te transforme en bâtisseur, pas en
        parieur.
      </p>

      {decisions.length === 0 ? (
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-dim">
          Aucune décision enregistrée pour l&apos;instant.
        </p>
      ) : (
        <div className="mt-[22px] flex flex-col gap-[18px]">
          {decisions.map((d, i) => (
            <div
              key={d.id}
              className={`grid grid-cols-[58px_1fr] items-baseline gap-4 pb-4 ${
                i < decisions.length - 1 ? "border-b border-dashed border-border" : ""
              }`}
            >
              <div className="font-mono text-[10px] tracking-[0.14em] text-gold">
                {formatDay(d.date)}
              </div>
              <div className="font-display text-[16px] font-semibold leading-snug tracking-[-0.015em] text-ink">
                {d.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
