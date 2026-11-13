import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const base =
  "w-full border border-line bg-base px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-amber focus:outline-none";

export const Label = ({ children }: { children: ReactNode }) => (
  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted">
    {children}
  </span>
);

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn(base, "min-h-11", className)} {...props} />
);

export const Textarea = ({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cn(base, "min-h-32 resize-y", className)} {...props} />
);

export const Select = ({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={cn(base, "min-h-11", className)} {...props} />
);
