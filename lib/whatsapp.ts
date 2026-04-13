/**
 * WhatsApp Provider Service
 * Supports: Meta Cloud API, Z-API
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
      body: JSON.stringify({
        phone,
        message,
      }),
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

// ─── Evolution API ──────────────────────────────────────────────

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
      if (!config.apiUrl || !config.apiToken) {
        return { success: false, error: "URL ou API Key não configurado" }
      }
      return evolutionSendText(config.apiUrl, config.apiToken, config.name, to, message)

    default:
      return { success: false, error: `Provider "${config.provider}" não suportado` }
  }
}

export async function testConnection(config: InstanceConfig): Promise<ConnectionTest> {
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
      if (!config.apiUrl || !config.apiToken) {
        return { connected: false, error: "URL ou API Key não configurado" }
      }
      return evolutionTestConnection(config.apiUrl, config.apiToken, config.name)

    default:
      return { connected: false, error: `Provider "${config.provider}" não suportado` }
  }
}
