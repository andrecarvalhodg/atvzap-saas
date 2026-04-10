/**
 * Evolution API v2 Integration
 * https://doc.evolution-api.com
 *
 * Provides real WhatsApp connections via QR Code.
 * Requires a running Evolution API instance.
 */

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ""
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ""

function headers() {
  return {
    "Content-Type": "application/json",
    apikey: EVOLUTION_API_KEY,
  }
}

async function request(path: string, options?: RequestInit) {
  if (!EVOLUTION_API_URL) {
    throw new Error("EVOLUTION_API_URL not configured")
  }
  const url = `${EVOLUTION_API_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: { ...headers(), ...options?.headers },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Evolution API error (${res.status}): ${text}`)
  }
  return res.json()
}

/** Create a new WhatsApp instance */
export async function createInstance(instanceName: string) {
  return request("/instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName,
      integration: "WHATSAPP-BAILEYS",
      qrcode: true,
      rejectCall: false,
      groupsIgnore: true,
    }),
  })
}

/** Get QR Code for connecting (returns base64 image) */
export async function getQrCode(instanceName: string) {
  return request(`/instance/connect/${instanceName}`)
}

/** Check connection state */
export async function getConnectionState(instanceName: string) {
  return request(`/instance/connectionState/${instanceName}`)
}

/** Get instance info (phone number, profile, etc.) */
export async function getInstanceInfo(instanceName: string) {
  try {
    const data = await request(`/instance/fetchInstances?instanceName=${instanceName}`)
    return Array.isArray(data) ? data[0] : data
  } catch {
    return null
  }
}

/** Disconnect/logout instance */
export async function logoutInstance(instanceName: string) {
  return request(`/instance/logout/${instanceName}`, { method: "DELETE" })
}

/** Delete instance completely */
export async function deleteInstance(instanceName: string) {
  return request(`/instance/delete/${instanceName}`, { method: "DELETE" })
}

/** Send a text message */
export async function sendText(
  instanceName: string,
  phone: string,
  message: string
) {
  // Normalize phone: remove non-digits, ensure country code
  const number = phone.replace(/\D/g, "")
  return request(`/message/sendText/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({
      number,
      text: message,
    }),
  })
}

/** Check if Evolution API is configured and reachable */
export async function isConfigured(): Promise<boolean> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) return false
  try {
    await request("/instance/fetchInstances")
    return true
  } catch {
    return false
  }
}
