"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Webhook, Copy, Play, Pause } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Instance {
  id: string;
  name: string;
}

interface Lista {
  id: string;
  name: string;
}

interface WebhookConfig {
  id: string;
  title: string;
  platform: string;
  event: string;
  status: "active" | "paused";
  token: string;
  instanceId: string;
  listId?: string;
  adminPhone?: string;
  adminMessage?: string;
  message1: string;
  delay1: number;
  message2?: string;
  delay2?: number;
  message3?: string;
}

const PLATFORMS = ["Doppus", "Kiwify", "Hotmart"];
const EVENTS = ["Compra Aprovada", "Reembolso", "Cancelamento"];
const WEBHOOK_BASE_URL = "https://atvzap-saas.vercel.app/api/webhook";

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [lists, setLists] = useState<Lista[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [instanceId, setInstanceId] = useState("");
  const [platform, setPlatform] = useState("");
  const [event, setEvent] = useState("");
  const [listId, setListId] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [message1, setMessage1] = useState("");
  const [delay1, setDelay1] = useState(0);
  const [message2, setMessage2] = useState("");
  const [delay2, setDelay2] = useState(0);
  const [message3, setMessage3] = useState("");

  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await fetch("/api/webhook-configs");
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data);
      }
    } catch (err) {
      console.error("Erro ao buscar webhooks:", err);
    }
  }, []);

  const fetchInstances = useCallback(async () => {
    try {
      const res = await fetch("/api/instances");
      if (res.ok) {
        const data = await res.json();
        setInstances(data);
      }
    } catch (err) {
      console.error("Erro ao buscar instancias:", err);
    }
  }, []);

  const fetchLists = useCallback(async () => {
    try {
      const res = await fetch("/api/lists");
      if (res.ok) {
        const data = await res.json();
        setLists(data);
      }
    } catch (err) {
      console.error("Erro ao buscar listas:", err);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
    fetchInstances();
    fetchLists();
  }, [fetchWebhooks, fetchInstances, fetchLists]);

  function resetForm() {
    setTitle("");
    setInstanceId("");
    setPlatform("");
    setEvent("");
    setListId("");
    setAdminPhone("");
    setAdminMessage("");
    setMessage1("");
    setDelay1(0);
    setMessage2("");
    setDelay2(0);
    setMessage3("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/webhook-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          instanceId,
          platform,
          event,
          listId: listId || undefined,
          adminPhone: adminPhone || undefined,
          adminMessage: adminMessage || undefined,
          message1,
          delay1,
          message2: message2 || undefined,
          delay2: delay2 || undefined,
          message3: message3 || undefined,
        }),
      });
      if (res.ok) {
        resetForm();
        setShowForm(false);
        fetchWebhooks();
      }
    } catch (err) {
      console.error("Erro ao criar webhook:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    try {
      const res = await fetch(`/api/webhook-configs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchWebhooks();
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este webhook?")) return;
    try {
      const res = await fetch(`/api/webhook-configs/${id}`, {
        method: "DELETE",
      });
      if (res.ok) fetchWebhooks();
    } catch (err) {
      console.error("Erro ao excluir webhook:", err);
    }
  }

  async function copyToken(token: string) {
    try {
      await navigator.clipboard.writeText(
        `${WEBHOOK_BASE_URL}/${token}`
      );
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (err) {
      console.error("Erro ao copiar:", err);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Webhooks
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure webhooks para automacoes de plataformas.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Novo Webhook
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Novo Webhook
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Titulo</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Venda Kiwify"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Instancia</Label>
                  <Select value={instanceId} onValueChange={(v) => setInstanceId(v ?? "")} required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a instancia" />
                    </SelectTrigger>
                    <SelectContent>
                      {instances.map((inst) => (
                        <SelectItem key={inst.id} value={inst.id}>
                          {inst.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Plataforma</Label>
                  <Select value={platform} onValueChange={(v) => setPlatform(v ?? "doppus")} required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a plataforma" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Evento</Label>
                  <Select value={event} onValueChange={(v) => setEvent(v ?? "purchase_approved")} required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o evento" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENTS.map((ev) => (
                        <SelectItem key={ev} value={ev}>
                          {ev}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Lista (opcional)</Label>
                  <Select value={listId} onValueChange={(v) => setListId(v ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Nenhuma lista" />
                    </SelectTrigger>
                    <SelectContent>
                      {lists.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPhone">Telefone Admin (opcional)</Label>
                  <Input
                    id="adminPhone"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    placeholder="5511999999999"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminMessage">Mensagem Admin (opcional)</Label>
                <Textarea
                  id="adminMessage"
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  placeholder="Mensagem enviada ao admin quando o webhook for acionado"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message1">Mensagem 1 *</Label>
                <Textarea
                  id="message1"
                  value={message1}
                  onChange={(e) => setMessage1(e.target.value)}
                  placeholder="Primeira mensagem enviada ao cliente"
                  rows={3}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="delay1">Delay 1 (segundos)</Label>
                  <Input
                    id="delay1"
                    type="number"
                    min={0}
                    value={delay1}
                    onChange={(e) => setDelay1(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message2">Mensagem 2 (opcional)</Label>
                <Textarea
                  id="message2"
                  value={message2}
                  onChange={(e) => setMessage2(e.target.value)}
                  placeholder="Segunda mensagem enviada ao cliente"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="delay2">Delay 2 (segundos)</Label>
                  <Input
                    id="delay2"
                    type="number"
                    min={0}
                    value={delay2}
                    onChange={(e) => setDelay2(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message3">Mensagem 3 (opcional)</Label>
                <Textarea
                  id="message3"
                  value={message3}
                  onChange={(e) => setMessage3(e.target.value)}
                  placeholder="Terceira mensagem enviada ao cliente"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Criando..." : "Criar Webhook"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Webhooks Configurados</CardTitle>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhum webhook configurado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titulo</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>URL do Webhook</TableHead>
                  <TableHead className="text-right">Acao</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((wh) => (
                  <TableRow key={wh.id}>
                    <TableCell className="font-medium">{wh.title}</TableCell>
                    <TableCell>{wh.platform}</TableCell>
                    <TableCell>{wh.event}</TableCell>
                    <TableCell>
                      {wh.status === "active" ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                          Pausado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded max-w-[280px] truncate block">
                          {WEBHOOK_BASE_URL}/{wh.token}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => copyToken(wh.token)}
                          title="Copiar URL"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        {copiedToken === wh.token && (
                          <span className="text-xs text-green-600">
                            Copiado!
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() =>
                            handleToggleStatus(wh.id, wh.status)
                          }
                          title={
                            wh.status === "active" ? "Pausar" : "Ativar"
                          }
                        >
                          {wh.status === "active" ? (
                            <Pause className="h-3.5 w-3.5" />
                          ) : (
                            <Play className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon-xs"
                          onClick={() => handleDelete(wh.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
    </div>
  );
}
