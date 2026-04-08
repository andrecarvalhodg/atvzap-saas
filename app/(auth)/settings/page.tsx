"use client";

import { useSession } from "next-auth/react";

const planLabels: Record<string, { label: string; variant: string }> = {
  FREE: { label: "FREE", variant: "bg-muted text-muted-foreground" },
  TRIAL: { label: "TRIAL", variant: "bg-primary/10 text-primary" },
  PRO: { label: "PRO", variant: "bg-primary text-primary-foreground" },
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const plan = (user?.plan as string) || "FREE";
  const planInfo = planLabels[plan] || planLabels.FREE;

  const trialEndsAt = user?.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const trialDaysRemaining =
    trialEndsAt && plan === "TRIAL"
      ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Ajustes
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie seu perfil e assinatura.
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">
          Perfil
        </h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Nome</p>
            <p className="text-sm font-medium text-card-foreground">
              {user?.name || "---"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="text-sm font-medium text-card-foreground">
              {user?.email || "---"}
            </p>
          </div>
        </div>
      </div>

      {/* Plan Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">
          Plano
        </h2>
        <div className="flex items-center gap-3 mb-4">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${planInfo.variant}`}
          >
            {planInfo.label}
          </span>
          {trialDaysRemaining !== null && (
            <span className="text-sm text-muted-foreground">
              {trialDaysRemaining} {trialDaysRemaining === 1 ? "dia restante" : "dias restantes"}
            </span>
          )}
        </div>

        {plan !== "PRO" && (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Upgrade para PRO
          </button>
        )}
      </div>
    </div>
  );
}
