"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  QrCode,
  MessageCircle,
  X,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Instance {
  id: string;
  name: string;
  phone?: string;
  status: "connected" | "disconnected";
  messagesSent: number;
}

function QrCodePattern() {
  return (
    <svg width={200} height={200} viewBox="0 0 200 200">
      <rect width={200} height={200} fill="white" />
      {/* Finder patterns - top-left, top-right, bottom-left */}
      <rect x={10} y={10} width={42} height={42} fill="none" stroke="black" strokeWidth={6} />
      <rect x={22} y={22} width={18} height={18} fill="black" />
      <rect x={148} y={10} width={42} height={42} fill="none" stroke="black" strokeWidth={6} />
      <rect x={160} y={22} width={18} height={18} fill="black" />
      <rect x={10} y={148} width={42} height={42} fill="none" stroke="black" strokeWidth={6} />
      <rect x={22} y={160} width={18} height={18} fill="black" />
      {/* Random-looking data modules */}
      {Array.from({ length: 80 }).map((_, i) => {
        const x = 60 + (i % 10) * 9;
        const y = 60 + Math.floor(i / 10) * 9;
        return i % 3 !== 0 ? (
          <rect key={i} x={x} y={y} width={7} height={7} fill="black" />
        ) : null;
      })}
    </svg>
  );
}

export default function InstanciasPage() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // QR Code modal
  const [qrOpen, setQrOpen] = useState(false);
  const [qrInstance, setQrInstance] = useState<Instance | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Send message modal
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgInstance, setMsgInstance] = useState<Instance | null>(null);
  const [msgPhone, setMsgPhone] = useState("");
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);

  const fetchInstances = useCallback(async () => {
    try {
      const res = await fetch("/api/instances");
      if (res.ok) {
        const data = await res.json();
        setInstances(data);
      }
    } catch {
      // API may not exist yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        setNewName("");
        setShowCreateForm(false);
        await fetchInstances();
      }
    } catch {
      // handle error silently
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/instances/${id}`, { method: "DELETE" });
      await fetchInstances();
    } catch {
      // handle error silently
    }
  }

  function openQrModal(instance: Instance) {
    setQrInstance(instance);
    setQrOpen(true);
  }

  async function handleSimulateConnect() {
    if (!qrInstance) return;
    setConnecting(true);
    try {
      await fetch(`/api/instances/${qrInstance.id}/connect`, {
        method: "PATCH",
      });
      await fetchInstances();
      setQrOpen(false);
    } catch {
      // handle error silently
    } finally {
      setConnecting(false);
    }
  }

  function openMsgModal(instance: Instance) {
    setMsgInstance(instance);
    setMsgPhone("");
    setMsgText("");
    setMsgOpen(true);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!msgInstance || !msgPhone.trim() || !msgText.trim()) return;
    setSending(true);
    try {
      await fetch(`/api/instances/${msgInstance.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: msgPhone.trim(), message: msgText.trim() }),
      });
      setMsgOpen(false);
    } catch {
      // handle error silently
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Instancias
        </h1>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Instancia
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Instancia</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex items-end gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Nome da instancia
                </label>
                <Input
                  placeholder="Ex: Atendimento Principal"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={creating}>
                {creating ? "Criando..." : "Criar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancelar
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Carregando...
            </div>
          ) : instances.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma instancia cadastrada.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead className="w-16">Perfil</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Mensagens Enviadas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acao</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instances.map((inst, index) => (
                  <TableRow key={inst.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                        {inst.name.charAt(0).toUpperCase()}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{inst.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {inst.phone || "—"}
                    </TableCell>
                    <TableCell>{inst.messagesSent}</TableCell>
                    <TableCell>
                      {inst.status === "connected" ? (
                        <Badge className="bg-green-600/10 text-green-600 border-green-600/20">
                          Conectado
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Desconectado</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openQrModal(inst)}
                          title="QR Code"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        {inst.status === "connected" && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => openMsgModal(inst)}
                            title="Enviar Mensagem"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(inst.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Conectar &quot;{qrInstance?.name}&quot;
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm text-muted-foreground text-center">
              Escaneie o QR Code abaixo com o WhatsApp do celular para conectar esta instancia.
            </p>
            <div className="rounded-lg border border-border p-3 bg-white">
              <QrCodePattern />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSimulateConnect} disabled={connecting}>
              {connecting ? "Conectando..." : "Simular Conexao"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Message Modal */}
      <Dialog open={msgOpen} onOpenChange={setMsgOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Enviar Mensagem — {msgInstance?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Telefone
              </label>
              <Input
                placeholder="5511999999999"
                value={msgPhone}
                onChange={(e) => setMsgPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Mensagem
              </label>
              <Textarea
                placeholder="Digite sua mensagem..."
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                rows={4}
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={sending}>
                <Send className="mr-2 h-4 w-4" />
                {sending ? "Enviando..." : "Enviar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
