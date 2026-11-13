import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "border-line text-muted",
  amber: "border-amber/50 text-amber",
  danger: "border-emergency/60 text-emergency",
  synced: "border-synced/50 text-synced",
};

type Props = HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones };

export const Badge = ({ className, tone = "neutral", ...props }: Props) => (
  <span
    className={cn(
      "inline-flex items-center border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
      tones[tone],
      className,
    )}
    {...props}
  />
);
