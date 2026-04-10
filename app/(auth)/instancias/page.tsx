"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Trash2,
  QrCode,
  MessageCircle,
  Send,
  Loader2,
  WifiOff,
  RefreshCw,
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

export default function InstanciasPage() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // QR Code modal
  const [qrOpen, setQrOpen] = useState(false);
  const [qrInstance, setQrInstance] = useState<Instance | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");
  const [qrConnected, setQrConnected] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

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
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

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
        const inst = await res.json();
        setNewName("");
        setShowCreateForm(false);
        await fetchInstances();
        // Auto-open QR modal
        openQrModal(inst);
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao criar instância");
      }
    } catch {
      alert("Erro de conexão");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja remover esta instância?")) return;
    try {
      await fetch(`/api/instances/${id}`, { method: "DELETE" });
      await fetchInstances();
    } catch {
      // ignore
    }
  }

  async function handleDisconnect(id: string) {
    try {
      await fetch(`/api/instances/${id}/disconnect`, { method: "PATCH" });
      await fetchInstances();
    } catch {
      // ignore
    }
  }

  async function openQrModal(instance: Instance) {
    setQrInstance(instance);
    setQrImage(null);
    setQrError("");
    setQrConnected(false);
    setQrOpen(true);
    setQrLoading(true);

    // Fetch QR code
    try {
      const res = await fetch(`/api/instances/${instance.id}/connect`);
      const data = await res.json();

      if (!res.ok) {
        setQrError(data.error || "Erro ao gerar QR Code");
        setQrLoading(false);
        return;
      }

      if (data.status === "connected") {
        setQrConnected(true);
        setQrLoading(false);
        await fetchInstances();
        return;
      }

      if (data.qrcode) {
        // Evolution API returns base64 with or without data:image prefix
        const src = data.qrcode.startsWith("data:")
          ? data.qrcode
          : `data:image/png;base64,${data.qrcode}`;
        setQrImage(src);
      } else {
        setQrError("QR Code não disponível. Tente novamente.");
      }
    } catch {
      setQrError("Erro de conexão ao buscar QR Code");
    } finally {
      setQrLoading(false);
    }

    // Poll for connection status every 3 seconds
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/instances/${instance.id}/connect`, {
          method: "PATCH",
        });
        const data = await res.json();
        if (data.status === "connected") {
          setQrConnected(true);
          if (pollRef.current) clearInterval(pollRef.current);
          await fetchInstances();
        }
      } catch {
        // ignore
      }
    }, 3000);
  }

  async function refreshQr() {
    if (!qrInstance) return;
    openQrModal(qrInstance);
  }

  function closeQrModal() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setQrOpen(false);
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
      const res = await fetch(`/api/instances/${msgInstance.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: msgPhone.trim(), message: msgText.trim() }),
      });
      if (res.ok) {
        setMsgOpen(false);
        await fetchInstances();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao enviar");
      }
    } catch {
      alert("Erro de conexão");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Instâncias WhatsApp
        </h1>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Instância
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Instância</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex items-end gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Nome da instância
                </label>
                <Input
                  placeholder="Ex: Atendimento Principal"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...</>
                ) : (
                  "Criar e Conectar"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
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
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Carregando...
            </div>
          ) : instances.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <QrCode className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Nenhuma instância cadastrada</p>
              <p className="text-xs mt-1">Clique em &quot;Nova Instância&quot; para conectar seu WhatsApp</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="w-12">Perfil</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Msgs Enviadas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
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
                    <TableCell className="text-muted-foreground font-mono text-sm">
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
                        {inst.status === "connected" ? (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => openMsgModal(inst)}
                              title="Enviar Mensagem"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDisconnect(inst.id)}
                              title="Desconectar"
                            >
                              <WifiOff className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openQrModal(inst)}
                            title="Conectar via QR Code"
                          >
                            <QrCode className="h-4 w-4" />
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
      <Dialog open={qrOpen} onOpenChange={(open) => { if (!open) closeQrModal(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
          </DialogHeader>

          {qrConnected ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-green-600">Conectado!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                WhatsApp vinculado com sucesso.
              </p>
              <Button className="mt-4" onClick={closeQrModal}>
                Fechar
              </Button>
            </div>
          ) : qrLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
            </div>
          ) : qrError ? (
            <div className="text-center py-8">
              <p className="text-sm text-destructive mb-4">{qrError}</p>
              <Button variant="outline" onClick={refreshQr}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4">
              <p className="text-sm text-muted-foreground text-center">
                Abra o <strong>WhatsApp</strong> no celular &gt; Menu &gt;{" "}
                <strong>Aparelhos conectados</strong> &gt; Conectar um aparelho
              </p>

              {qrImage ? (
                <div className="rounded-lg border border-border p-2 bg-white">
                  <img
                    src={qrImage}
                    alt="QR Code WhatsApp"
                    width={280}
                    height={280}
                    className="rounded"
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-border p-8 bg-muted/30">
                  <p className="text-sm text-muted-foreground">QR Code não disponível</p>
                </div>
              )}

              <div className="flex gap-2 w-full">
                <Button variant="outline" className="flex-1" onClick={refreshQr}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar QR
                </Button>
                <Button variant="outline" className="flex-1" onClick={closeQrModal}>
                  Cancelar
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                O QR Code expira em 60 segundos. Clique em &quot;Atualizar QR&quot; se necessário.
              </p>
            </div>
          )}
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
