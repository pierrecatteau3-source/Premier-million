interface Props {
  num: string;
  title: string;
  sub: string;
  unlocked: number;
  total: number;
  children: React.ReactNode;
}

export function AchievementChapter({ num, title, sub, unlocked, total, children }: Props) {
  return (
    <section className="mt-10">
      <div className="mb-6 grid grid-cols-[40px_1fr_auto] items-baseline gap-4 border-b border-border pb-4 md:grid-cols-[56px_1fr_auto] md:gap-[18px]">
        <div className="font-display text-[32px] font-bold italic leading-none tracking-tight text-gold md:text-[38px]">
          {num}
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-[22px] font-bold tracking-tight md:text-[26px]">
            {title}
          </h2>
          <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
            {sub}
          </div>
        </div>
        <div className="text-right font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
          <span className="mb-0.5 block font-display text-[26px] font-bold italic tracking-tight text-gold md:text-[28px]">
            {unlocked}
          </span>
          / {total} acquis
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-3.5 md:grid-cols-[repeat(auto-fill,minmax(112px,1fr))]">
        {children}
      </div>
    </section>
  );
}
