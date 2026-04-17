import { NextResponse } from "next/server"

export async function GET() {
  const apiUrl = (process.env.EVOLUTION_API_URL || "").replace(/\/$/, "")
  const apiKey = process.env.EVOLUTION_API_KEY || ""

  const results: Record<string, any> = { apiUrl, hasKey: !!apiKey }

  try {
    // 1. List instances
    const listRes = await fetch(`${apiUrl}/instance/fetchInstances`, {
      headers: { apikey: apiKey },
    })
    results.fetchInstances = {
      status: listRes.status,
      data: await listRes.json(),
    }
  } catch (e: any) {
    results.fetchInstancesError = e.message
  }

  try {
    // 2. Create test instance
    const createRes = await fetch(`${apiUrl}/instance/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: apiKey },
      body: JSON.stringify({ instanceName: "debug_test", qrcode: true, integration: "WHATSAPP-BAILEYS" }),
    })
    results.createInstance = {
      status: createRes.status,
      data: await createRes.json(),
    }
  } catch (e: any) {
    results.createInstanceError = e.message
  }

  try {
    // 3. Connect (get QR)
    const connectRes = await fetch(`${apiUrl}/instance/connect/debug_test`, {
      headers: { apikey: apiKey },
    })
    const connectData = await connectRes.json()
    results.connect = {
      status: connectRes.status,
      keys: Object.keys(connectData),
      hasBase64: !!connectData.base64,
      base64Preview: connectData.base64?.substring(0, 50),
      data: connectData,
    }
  } catch (e: any) {
    results.connectError = e.message
  }

  return NextResponse.json(results)
}
