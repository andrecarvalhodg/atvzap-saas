"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Trash2, Send, RefreshCw } from "lucide-react";
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

interface Campaign {
  id: string;
  name: string;
  listName: string;
  status: "pending" | "sending" | "completed" | "error";
  sentCount: number;
  totalContacts: number;
  createdAt: string;
}

const STATUS_MAP: Record<
  Campaign["status"],
  { label: string; className: string }
> = {
  pending: {
    label: "Pendente",
    className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  },
  sending: {
    label: "Enviando",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  completed: {
    label: "Concluida",
    className: "bg-green-500/10 text-green-600 border-green-500/20",
  },
  error: {
    label: "Erro",
    className: "bg-red-500/10 text-red-600 border-red-500/20",
  },
};

export default function CampanhasPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [lists, setLists] = useState<Lista[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [name, setName] = useState("");
  const [instanceId, setInstanceId] = useState("");
  const [listId, setListId] = useState("");
  const [message, setMessage] = useState("");
  const [scheduling, setScheduling] = useState("immediate");
  const [scheduledDate, setScheduledDate] = useState("");

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch (err) {
      console.error("Erro ao buscar campanhas:", err);
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
    fetchCampaigns();
    fetchInstances();
    fetchLists();
  }, [fetchCampaigns, fetchInstances, fetchLists]);

  // Auto-refresh every 5 seconds when there are sending campaigns
  useEffect(() => {
    const hasSending = campaigns.some((c) => c.status === "sending");

    if (hasSending) {
      if (!intervalRef.current) {
        intervalRef.current = setInterval(fetchCampaigns, 5000);
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [campaigns, fetchCampaigns]);

  function resetForm() {
    setName("");
    setInstanceId("");
    setListId("");
    setMessage("");
    setScheduling("immediate");
    setScheduledDate("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          instanceId,
          listId,
          message,
          scheduling,
          scheduledDate: scheduling === "scheduled" ? scheduledDate : undefined,
        }),
      });
      if (res.ok) {
        resetForm();
        setShowForm(false);
        fetchCampaigns();
      }
    } catch (err) {
      console.error("Erro ao criar campanha:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta campanha?")) return;
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      if (res.ok) fetchCampaigns();
    } catch (err) {
      console.error("Erro ao excluir campanha:", err);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getProgress(sent: number, total: number) {
    if (total === 0) return 0;
    return Math.round((sent / total) * 100);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Campanhas
          </h1>
          <p className="text-muted-foreground mt-1">
            Envie mensagens em massa para suas listas de contatos.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Nova Campanha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Campanha Black Friday"
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
                  <Label>Lista</Label>
                  <Select value={listId} onValueChange={(v) => setListId(v ?? "")} required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a lista" />
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
                  <Label>Agendamento</Label>
                  <Select value={scheduling} onValueChange={(v) => setScheduling(v ?? "immediate")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Enviar agora</SelectItem>
                      <SelectItem value="scheduled">Agendar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {scheduling === "scheduled" && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="scheduledDate">Data e Hora</Label>
                    <Input
                      id="scheduledDate"
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite a mensagem da campanha..."
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Criando..." : "Criar Campanha"}
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
          <div className="flex items-center justify-between">
            <CardTitle>Campanhas</CardTitle>
            <Button variant="ghost" size="icon-xs" onClick={fetchCampaigns} title="Atualizar">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhuma campanha criada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Lista</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Acao</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => {
                  const progress = getProgress(
                    campaign.sentCount,
                    campaign.totalContacts
                  );
                  const statusInfo = STATUS_MAP[campaign.status];

                  return (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">
                        {campaign.name}
                      </TableCell>
                      <TableCell>{campaign.listName}</TableCell>
                      <TableCell>
                        <Badge className={statusInfo.className}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[140px]">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-green-500 transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {campaign.sentCount}/{campaign.totalContacts}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(campaign.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="icon-xs"
                          onClick={() => handleDelete(campaign.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
