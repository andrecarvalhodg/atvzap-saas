"use client";

import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Smartphone,
  Users,
  Send,
} from "lucide-react";

const stats = [
  {
    label: "Instancias Conectadas",
    value: "0",
    icon: Smartphone,
  },
  {
    label: "Contatos",
    value: "0",
    icon: Users,
  },
  {
    label: "Mensagens Enviadas",
    value: "0",
    icon: Send,
  },
  {
    label: "Campanhas Ativas",
    value: "0",
    icon: LayoutDashboard,
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] || "Usuario";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Ola, {firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Aqui esta o resumo da sua conta.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </p>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-3xl font-bold text-card-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
