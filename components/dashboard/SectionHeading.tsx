import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  children,
  eyebrow,
  className,
}: {
  children: ReactNode;
  eyebrow?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-[22px] mt-12 flex items-baseline gap-3.5", className)}>
      <h2 className="font-display text-[28px] font-bold leading-none tracking-[-0.025em]">
        {children}
      </h2>
      <span className="h-px flex-1 bg-border" />
      {eyebrow && (
        <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-ink-muted">
          {eyebrow}
        </span>
      )}
    </div>
  );
}
