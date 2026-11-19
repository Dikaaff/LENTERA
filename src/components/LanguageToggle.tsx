import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const OPTIONS = ["id", "en"] as const;

export function LanguageToggle({ className }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      className={cn("flex items-center border border-line", className)}
      role="group"
      aria-label={t("app.language")}
    >
      {OPTIONS.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setLanguage(value)}
          aria-pressed={language === value}
          className={cn(
            "min-h-9 min-w-9 cursor-pointer px-2 text-[11px] font-semibold uppercase tracking-wider transition",
            language === value ? "bg-amber/15 text-amber" : "text-muted hover:text-ink",
          )}
        >
          {value}
        </button>
      ))}
    </div>
  );
}
