"use client";

interface Props {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

export function DateRangePicker({ from, to, onChange }: Props) {
  const today = new Date().toISOString().split("T")[0];

  function handleFrom(e: React.ChangeEvent<HTMLInputElement>) {
    const newFrom = e.target.value;
    // Si from dépasse to, aligner to sur from
    const newTo = newFrom > to ? newFrom : to;
    onChange(newFrom, newTo);
  }

  function handleTo(e: React.ChangeEvent<HTMLInputElement>) {
    const newTo = e.target.value;
    // Si to est avant from, aligner from sur to
    const newFrom = newTo < from ? newTo : from;
    onChange(newFrom, newTo);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={from}
        max={to}
        onChange={handleFrom}
        className="border border-border bg-background text-foreground rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <span className="text-muted-foreground text-sm">→</span>
      <input
        type="date"
        value={to}
        min={from}
        max={today}
        onChange={handleTo}
        className="border border-border bg-background text-foreground rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
