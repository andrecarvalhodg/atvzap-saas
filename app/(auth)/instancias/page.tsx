"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Trash2,
  MessageCircle,
  Send,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Plug,
  QrCode,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

interface Instance {
  id: string;
  name: string;
  phone?: string;
  provider: string;
  status: "connected" | "disconnected";
  messagesSent: number;
}

const PROVIDERS = [
  {
    value: "evolution",
    label: "Evolution API (QR Code) ✓ Recomendado",
    description: "Conecte seu WhatsApp pessoal escaneando um QR Code. Gratuito.",
    fields: [],
  },
  {
    value: "meta",
    label: "WhatsApp Cloud API (Meta)",
    description: "API oficial do Meta/Facebook. Requer número dedicado.",
    fields: ["apiToken", "phoneNumberId"],
  },
  {
    value: "zapi",
    label: "Z-API",
    description: "Provedor popular no Brasil. Pago.",
    fields: ["instanceId", "apiToken"],
  },
];

export default function InstanciasPage() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [testResult, setTestResult] = useState<{ connected: boolean; error?: string } | null>(null);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formProvider, setFormProvider] = useState("evolution");
  const [formApiToken, setFormApiToken] = useState("");
  const [formApiUrl, setFormApiUrl] = useState("");
  const [formInstanceId, setFormInstanceId] = useState("");
  const [formPhoneNumberId, setFormPhoneNumberId] = useState("");
  const [formPhone, setFormPhone] = useState("");

  // QR Code modal
  const [qrOpen, setQrOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrInstanceId, setQrInstanceId] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<"waiting" | "connected" | "error">("waiting");
  const qrPollRef = useRef<NodeJS.Timeout | null>(null);

  // Send message modal
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgInstance, setMsgInstance] = useState<Instance | null>(null);
  const [msgPhone, setMsgPhone] = useState("");
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);

  // Reconnect
  const [reconnecting, setReconnecting] = useState<string | null>(null);

  const fetchInstances = useCallback(async () => {
    try {
      const res = await fetch("/api/instances");
      if (res.ok) setInstances(await res.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchInstances(); }, [fetchInstances]);

  // Stop QR polling when component unmounts
  useEffect(() => {
    return () => {
      if (qrPollRef.current) clearInterval(qrPollRef.current);
    };
  }, []);

  const selectedProvider = PROVIDERS.find((p) => p.value === formProvider);

  function resetForm() {
    setFormName("");
    setFormProvider("evolution");
    setFormApiToken("");
    setFormApiUrl("");
    setFormInstanceId("");
    setFormPhoneNumberId("");
    setFormPhone("");
    setTestResult(null);
  }

  function stopQrPolling() {
    if (qrPollRef.current) {
      clearInterval(qrPollRef.current);
      qrPollRef.current = null;
    }
  }

  function startQrPolling(instanceId: string) {
    stopQrPolling();
    qrPollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/instances/${instanceId}/qrcode`);
        const data = await res.json();

        if (data.state === "connected") {
          setQrStatus("connected");
          stopQrPolling();
          setTimeout(() => {
            setQrOpen(false);
            setQrCode(null);
            setQrInstanceId(null);
            setQrStatus("waiting");
            resetForm();
            setShowCreate(false);
            fetchInstances();
          }, 2000);
        } else if (data.qrcode) {
          setQrCode(data.qrcode);
        }
      } catch {}
    }, 3000);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;
    setCreating(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          provider: formProvider,
          apiToken: formApiToken || undefined,
          apiUrl: formApiUrl || undefined,
          instanceId: formInstanceId || undefined,
          phoneNumberId: formPhoneNumberId || undefined,
          phone: formPhone || undefined,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        // Evolution API: always show QR code modal
        if (formProvider === "evolution") {
          setQrCode(data.qrcode || null);
          setQrInstanceId(data.id);
          setQrStatus("waiting");
          setQrOpen(true);
          startQrPolling(data.id);
          await fetchInstances();
        } else {
          setTestResult(data.connectionTest);
          if (data.connectionTest?.connected) {
            setTimeout(() => {
              resetForm();
              setShowCreate(false);
              fetchInstances();
            }, 1500);
          } else {
            await fetchInstances();
          }
        }
      } else {
        setTestResult({ connected: false, error: data.error });
      }
    } catch {
      setTestResult({ connected: false, error: "Erro de conexão" });
    } finally {
      setCreating(false);
    }
  }

  async function handleReconnect(id: string) {
    setReconnecting(id);
    try {
      const res = await fetch(`/api/instances/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) await fetchInstances();
    } catch {} finally { setReconnecting(null); }
  }

  async function handleShowQR(inst: Instance) {
    // Re-open QR code for disconnected Evolution instances
    try {
      const res = await fetch(`/api/instances/${inst.id}/qrcode`);
      const data = await res.json();
      if (data.qrcode) {
        setQrCode(data.qrcode);
        setQrInstanceId(inst.id);
        setQrStatus("waiting");
        setQrOpen(true);
        startQrPolling(inst.id);
      }
    } catch {}
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja remover esta instância?")) return;
    await fetch(`/api/instances/${id}`, { method: "DELETE" });
    await fetchInstances();
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
    } catch { alert("Erro de conexão"); }
    finally { setSending(false); }
  }

  const providerLabel: Record<string, string> = {
    meta: "Meta Cloud",
    zapi: "Z-API",
    evolution: "Evolution",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Instâncias WhatsApp
        </h1>
        <Button onClick={() => { setShowCreate(!showCreate); resetForm(); }}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Instância
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Conectar WhatsApp</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da instância</Label>
                  <Input
                    placeholder="Ex: Atendimento_Principal"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value.replace(/\s+/g, "_"))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Sem espaços. Use _ ao invés de espaço.</p>
                </div>
                <div className="space-y-2">
                  <Label>Provedor</Label>
                  <select
                    value={formProvider}
                    onChange={(e) => { setFormProvider(e.target.value); setTestResult(null); }}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">{selectedProvider?.description}</p>
                </div>
              </div>

              {/* Evolution API: no extra fields needed */}
              {formProvider === "evolution" && (
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                  <QrCode className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Conexão via QR Code</p>
                    <p className="mt-1 text-green-700">
                      Após clicar em &quot;Gerar QR Code&quot;, um código aparecerá na tela.
                      Abra o WhatsApp no celular → Menu → Dispositivos conectados → Conectar dispositivo → Escaneie o código.
                    </p>
                  </div>
                </div>
              )}

              {/* Dynamic fields for other providers */}
              {formProvider !== "evolution" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formProvider === "meta" && (
                    <>
                      <div className="space-y-2">
                        <Label>Access Token</Label>
                        <Input
                          type="password"
                          placeholder="Token do WhatsApp Business API"
                          value={formApiToken}
                          onChange={(e) => setFormApiToken(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Meta Business Suite &gt; WhatsApp &gt; Configuração da API
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Phone Number ID</Label>
                        <Input
                          placeholder="Ex: 123456789012345"
                          value={formPhoneNumberId}
                          onChange={(e) => setFormPhoneNumberId(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          ID do número no painel do Meta Business
                        </p>
                      </div>
                    </>
                  )}

                  {formProvider === "zapi" && (
                    <>
                      <div className="space-y-2">
                        <Label>Instance ID</Label>
                        <Input
                          placeholder="ID da instância Z-API"
                          value={formInstanceId}
                          onChange={(e) => setFormInstanceId(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Token</Label>
                        <Input
                          type="password"
                          placeholder="Token da instância Z-API"
                          value={formApiToken}
                          onChange={(e) => setFormApiToken(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label>Número WhatsApp (opcional)</Label>
                    <Input
                      placeholder="5511999999999"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Test result */}
              {testResult && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  testResult.connected
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {testResult.connected ? (
                    <><CheckCircle className="h-4 w-4" /> Conectado com sucesso!</>
                  ) : (
                    <><XCircle className="h-4 w-4" /> {testResult.error || "Não foi possível conectar"}</>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={creating || !formName.trim()}>
                  {creating ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Aguarde...</>
                  ) : formProvider === "evolution" ? (
                    <><QrCode className="mr-2 h-4 w-4" /> Gerar QR Code</>
                  ) : (
                    <><Plug className="mr-2 h-4 w-4" /> Conectar</>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Instances Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            </div>
          ) : instances.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Plug className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Nenhuma instância cadastrada</p>
              <p className="text-xs mt-1">Clique em &quot;Nova Instância&quot; para conectar seu WhatsApp</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Provedor</TableHead>
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
                    <TableCell className="font-medium">{inst.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{providerLabel[inst.provider] || inst.provider}</Badge>
                    </TableCell>
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
                        {/* Evolution API disconnected: show QR button */}
                        {inst.provider === "evolution" && inst.status !== "connected" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShowQR(inst)}
                            title="Reconectar via QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                        ) : inst.provider !== "evolution" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReconnect(inst.id)}
                            disabled={reconnecting === inst.id}
                            title="Testar conexão"
                          >
                            {reconnecting === inst.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                        ) : null}

                        {inst.status === "connected" && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => {
                              setMsgInstance(inst);
                              setMsgPhone("");
                              setMsgText("");
                              setMsgOpen(true);
                            }}
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
      <Dialog open={qrOpen} onOpenChange={(open) => {
        if (!open) {
          stopQrPolling();
          setQrOpen(false);
          setQrCode(null);
          setQrStatus("waiting");
        }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Escaneie o QR Code
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            {qrStatus === "connected" ? (
              <div className="flex flex-col items-center gap-3 text-green-600">
                <CheckCircle className="h-16 w-16" />
                <p className="font-semibold text-lg">WhatsApp Conectado!</p>
                <p className="text-sm text-muted-foreground">Fechando automaticamente...</p>
              </div>
            ) : qrCode ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`}
                  alt="QR Code WhatsApp"
                  className="w-64 h-64 rounded-lg border"
                />
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium">Abra o WhatsApp no celular</p>
                  <p className="text-xs text-muted-foreground">
                    Menu (⋮) → Dispositivos conectados → Conectar dispositivo
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Aguardando leitura...
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Message Modal */}
      <Dialog open={msgOpen} onOpenChange={setMsgOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Mensagem — {msgInstance?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                placeholder="5511999999999"
                value={msgPhone}
                onChange={(e) => setMsgPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Mensagem</Label>
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
