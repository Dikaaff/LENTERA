import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function NumberTicker({ value, className }: { value: number; className?: string }) {
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const from = shown;
    const start = performance.now();
    const duration = 420;
    let frame = 0;
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setShown(Math.round(from + (value - from) * progress));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className={cn("tabular-nums", className)}>{shown}</span>;
}

export const BlurFade = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("blur-fade", className)}>{children}</div>;
