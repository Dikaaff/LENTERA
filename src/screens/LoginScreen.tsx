import { ShieldCheck, Users, PenLine } from "lucide-react";
import { useState } from "react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import { signInAdmin, ensureVolunteer } from "@/modules/auth";

export function LoginScreen() {
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);

  const volunteer = () => {
    setError(null);
    void ensureVolunteer().catch(() => setError(t("login.error")));
  };

  const admin = () => {
    setError(null);
    void signInAdmin().catch(() => setError(t("login.error")));
  };

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col overflow-y-auto">
      <header className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="LENTERA" className="size-7" />
          <span className="text-sm font-bold tracking-tight">LENTERA</span>
        </div>
        <LanguageToggle />
      </header>

      <div className="mt-8 space-y-5 px-4 pb-8">
        <div className="text-center">
          <h1 className="text-xl font-bold tracking-tight">{t("login.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("login.subtitle")}</p>
        </div>

        <div className="space-y-3">
          <Card className="border-line">
            <CardBody className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-base">
                  <PenLine className="size-5 text-ink" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold tracking-tight">
                    {t("login.volunteerLabel")}
                  </p>
                  <p className="text-sm text-muted">{t("login.volunteerTagline")}</p>
                </div>
              </div>
              <p className="text-sm text-ink leading-relaxed">{t("login.volunteerDesc")}</p>
              <Button className="w-full justify-center gap-2" onClick={volunteer}>
                <PenLine className="size-4" /> {t("login.volunteerBtn")}
                <span className="text-[11px] text-muted">{t("login.volunteerHint")}</span>
              </Button>
            </CardBody>
          </Card>

          <Card className="border-line">
            <CardBody className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-base">
                  <ShieldCheck className="size-5 text-ink" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold tracking-tight">{t("login.adminLabel")}</p>
                  <p className="text-sm text-muted">{t("login.adminTagline")}</p>
                </div>
              </div>
              <p className="text-sm text-ink leading-relaxed">{t("login.adminDesc")}</p>
              <Button variant="secondary" className="w-full justify-center gap-2" onClick={admin}>
                <Users className="size-4" /> {t("login.adminBtn")}
                <span className="text-[11px] text-muted">{t("login.adminHint")}</span>
              </Button>
            </CardBody>
          </Card>
        </div>

        <p className="text-center text-xs text-muted">{t("login.footer")}</p>
        <p className="border border-line bg-base p-3 text-center text-[11px] text-muted">
          {t("login.adminNote")}
        </p>
        {error && (
          <p role="alert" className="border border-emergency/50 p-3 text-xs text-emergency">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
