import Link from "next/link";
import { Send } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              A
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              ATVzap
            </span>
          </div>
          <Link
            href="/login"
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Send className="h-8 w-8 text-primary" />
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            ATVzap
          </h1>

          <p className="text-xl text-muted-foreground">
            Automacao WhatsApp para Infoprodutores
          </p>

          <p className="text-base text-muted-foreground max-w-lg mx-auto">
            Conecte suas instancias do WhatsApp, importe contatos, crie campanhas
            e envie mensagens em massa de forma simples e automatizada.
          </p>

          <div className="pt-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Comecar Agora
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        ATVzap &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
