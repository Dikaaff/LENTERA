import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-semibold tracking-wide disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-amber text-base hover:bg-amber/90",
        secondary: "border border-line bg-surface text-ink hover:border-muted",
        ghost: "text-muted hover:bg-surface hover:text-ink",
        danger: "bg-emergency text-base hover:bg-emergency/90",
      },
      size: { default: "h-11", sm: "h-9 px-3 text-xs", icon: "size-11 p-0" },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: Props) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
