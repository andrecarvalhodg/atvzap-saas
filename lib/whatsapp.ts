/**
 * WhatsApp Provider Service
 * Supports: Meta Cloud API, Z-API, Evolution API (QR Code)
 */

interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

interface ConnectionTest {
  connected: boolean
  phone?: string
  name?: string
  error?: string
}

// ─── Helpers ────────────────────────────────────────────────────

function getEvolutionServerConfig() {
  return {
    apiUrl: (process.env.EVOLUTION_API_URL || "").trim().replace(/\/+$/, ""),
    apiKey: (process.env.EVOLUTION_API_KEY || "").trim(),
  }
}

// ─── Meta Cloud API (Official) ──────────────────────────────────

async function metaSendText(
  token: string,
  phoneNumberId: string,
  to: string,
  message: string
): Promise<SendResult> {
  const phone = to.replace(/\D/g, "")
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: message },
      }),
    }
  )
  const data = await res.json()
  if (!res.ok) {
    return { success: false, error: data.error?.message || "Erro Meta API" }
  }
  return { success: true, messageId: data.messages?.[0]?.id }
}

async function metaTestConnection(
  token: string,
  phoneNumberId: string
): Promise<ConnectionTest> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    const data = await res.json()
    if (!res.ok) {
      return { connected: false, error: data.error?.message || "Token inválido" }
    }
    return {
      connected: true,
      phone: data.display_phone_number || "",
      name: data.verified_name || "",
    }
  } catch (err: any) {
    return { connected: false, error: err.message }
  }
}

// ─── Z-API ──────────────────────────────────────────────────────

async function zapiSendText(
  instanceId: string,
  token: string,
  to: string,
  message: string
): Promise<SendResult> {
  const phone = to.replace(/\D/g, "")
  const res = await fetch(
    `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, message }),
    }
  )
  const data = await res.json()
  if (!res.ok) {
    return { success: false, error: data.message || "Erro Z-API" }
  }
  return { success: true, messageId: data.messageId }
}

async function zapiTestConnection(
  instanceId: string,
  token: string
): Promise<ConnectionTest> {
  try {
    const res = await fetch(
      `https://api.z-api.io/instances/${instanceId}/token/${token}/phone`,
      { headers: { "Content-Type": "application/json" } }
    )
    const data = await res.json()
    if (!res.ok || data.error) {
      return { connected: false, error: data.message || "Credenciais inválidas" }
    }
    return {
      connected: true,
      phone: data.phone || "",
      name: data.name || "",
    }
  } catch (err: any) {
    return { connected: false, error: err.message }
  }
}

// ─── Evolution API (QR Code) ────────────────────────────────────

async function evolutionSendText(
  apiUrl: string,
  apiToken: string,
  instanceName: string,
  to: string,
  message: string
): Promise<SendResult> {
  const phone = to.replace(/\D/g, "")
  const res = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: apiToken,
    },
    body: JSON.stringify({ number: phone, text: message }),
  })
  const data = await res.json()
  if (!res.ok) {
    return { success: false, error: data.message || "Erro Evolution API" }
  }
  return { success: true, messageId: data.key?.id }
}

async function evolutionTestConnection(
  apiUrl: string,
  apiToken: string,
  instanceName: string
): Promise<ConnectionTest> {
  try {
    const res = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
      headers: { apikey: apiToken },
    })
    const data = await res.json()
    if (!res.ok) {
      return { connected: false, error: "Erro ao verificar conexão" }
    }
    const isOpen = data?.instance?.state === "open"
    return {
      connected: isOpen,
      phone: data?.instance?.owner?.replace("@s.whatsapp.net", "") || "",
      error: isOpen ? undefined : "Instância não conectada",
    }
  } catch (err: any) {
    return { connected: false, error: err.message }
  }
}

// ─── Evolution API: QR Code helpers ─────────────────────────────

export async function createEvolutionInstance(instanceName: string): Promise<{
  success: boolean
  qrcode?: string
  error?: string
}> {
  const { apiUrl, apiKey } = getEvolutionServerConfig()
  if (!apiUrl || !apiKey) {
    return { success: false, error: "Evolution API não configurada no servidor" }
  }
  try {
    // Create instance (qrcode: true returns QR in the same response)
    // v1.x requires a token field; v2.x ignores it
    const instanceToken = `${instanceName}-${Date.now()}`
    const createRes = await fetch(`${apiUrl}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        instanceName,
        token: instanceToken,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
    })
    const createData = await createRes.json()

    // If instance already exists (409), just get QR from connect endpoint
    if (!createRes.ok && createRes.status !== 409) {
      return { success: false, error: createData.message || "Erro ao criar instância" }
    }

    // Try QR from create response first
    const qrcodeFromCreate =
      createData?.qrcode?.base64 ||
      createData?.qrcode?.code ||
      createData?.base64

    if (qrcodeFromCreate) {
      return { success: true, qrcode: qrcodeFromCreate }
    }

    // Fallback: call connect endpoint
    const qrRes = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
      headers: { apikey: apiKey },
    })
    const qrData = await qrRes.json()
    const qrcode =
      qrData?.base64 ||
      qrData?.qrcode?.base64 ||
      qrData?.code

    return { success: true, qrcode }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function getEvolutionQRCode(instanceName: string): Promise<{
  qrcode?: string
  state?: string
  phone?: string
  error?: string
}> {
  const { apiUrl, apiKey } = getEvolutionServerConfig()
  if (!apiUrl || !apiKey) {
    return { error: "Evolution API não configurada" }
  }
  try {
    // Check state
    const stateRes = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
      headers: { apikey: apiKey },
    })
    const stateData = await stateRes.json()
    const state = stateData?.instance?.state

    if (state === "open") {
      return {
        state: "open",
        phone: stateData?.instance?.owner?.replace("@s.whatsapp.net", "") || "",
      }
    }

    // Refresh QR code
    const qrRes = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
      headers: { apikey: apiKey },
    })
    const qrData = await qrRes.json()
    const qrcode = qrData.base64 || qrData.qrcode?.base64 || qrData.code

    return { qrcode, state: state || "connecting" }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function deleteEvolutionInstance(instanceName: string): Promise<void> {
  const { apiUrl, apiKey } = getEvolutionServerConfig()
  if (!apiUrl || !apiKey) return
  try {
    await fetch(`${apiUrl}/instance/delete/${instanceName}`, {
      method: "DELETE",
      headers: { apikey: apiKey },
    })
  } catch {}
}

// ─── Unified Interface ──────────────────────────────────────────

interface InstanceConfig {
  provider: string
  apiToken?: string | null
  apiUrl?: string | null
  instanceId?: string | null
  phoneNumberId?: string | null
  name: string
}

export async function sendMessage(
  config: InstanceConfig,
  to: string,
  message: string
): Promise<SendResult> {
  const { apiUrl: evoUrl, apiKey: evoKey } = getEvolutionServerConfig()

  switch (config.provider) {
    case "meta":
      if (!config.apiToken || !config.phoneNumberId) {
        return { success: false, error: "Token ou Phone Number ID não configurado" }
      }
      return metaSendText(config.apiToken, config.phoneNumberId, to, message)

    case "zapi":
      if (!config.instanceId || !config.apiToken) {
        return { success: false, error: "Instance ID ou Token não configurado" }
      }
      return zapiSendText(config.instanceId, config.apiToken, to, message)

    case "evolution":
      return evolutionSendText(
        config.apiUrl || evoUrl,
        config.apiToken || evoKey,
        config.name,
        to,
        message
      )

    default:
      return { success: false, error: `Provider "${config.provider}" não suportado` }
  }
}

export async function testConnection(config: InstanceConfig): Promise<ConnectionTest> {
  const { apiUrl: evoUrl, apiKey: evoKey } = getEvolutionServerConfig()

  switch (config.provider) {
    case "meta":
      if (!config.apiToken || !config.phoneNumberId) {
        return { connected: false, error: "Token ou Phone Number ID não configurado" }
      }
      return metaTestConnection(config.apiToken, config.phoneNumberId)

    case "zapi":
      if (!config.instanceId || !config.apiToken) {
        return { connected: false, error: "Instance ID ou Token não configurado" }
      }
      return zapiTestConnection(config.instanceId, config.apiToken)

    case "evolution":
      return evolutionTestConnection(
        config.apiUrl || evoUrl,
        config.apiToken || evoKey,
        config.name
      )

    default:
      return { connected: false, error: `Provider "${config.provider}" não suportado` }
  }
}
