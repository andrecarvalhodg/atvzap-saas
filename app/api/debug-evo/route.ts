import { NextResponse } from "next/server"

export async function GET() {
  const apiUrl = (process.env.EVOLUTION_API_URL || "").trim().replace(/\/+$/, "")
  const apiKey = (process.env.EVOLUTION_API_KEY || "").trim()

  const results: Record<string, any> = { apiUrl, hasKey: !!apiKey }

  try {
    // 0. Delete old test instance if exists
    await fetch(`${apiUrl}/instance/delete/debug_test`, {
      method: "DELETE",
      headers: { apikey: apiKey },
    })
    await fetch(`${apiUrl}/instance/delete/teste`, {
      method: "DELETE",
      headers: { apikey: apiKey },
    })
  } catch {}

  try {
    // 1. List instances
    const listRes = await fetch(`${apiUrl}/instance/fetchInstances`, {
      headers: { apikey: apiKey },
    })
    results.fetchInstances = { status: listRes.status, data: await listRes.json() }
  } catch (e: any) {
    results.fetchInstancesError = e.message
  }

  try {
    // 2. Create fresh test instance
    const createRes = await fetch(`${apiUrl}/instance/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: apiKey },
      body: JSON.stringify({ instanceName: "qrtest", qrcode: true }),
    })
    const createData = await createRes.json()
    results.createInstance = {
      status: createRes.status,
      data: createData,
      qrcodeKeys: createData.qrcode ? Object.keys(createData.qrcode) : null,
      hasBase64InCreate: !!(createData.qrcode?.base64 || createData.base64),
    }
  } catch (e: any) {
    results.createInstanceError = e.message
  }

  // wait a second
  await new Promise(r => setTimeout(r, 2000))

  try {
    // 3. Connect
    const connectRes = await fetch(`${apiUrl}/instance/connect/qrtest`, {
      headers: { apikey: apiKey },
    })
    const connectData = await connectRes.json()
    results.connect = {
      status: connectRes.status,
      keys: Object.keys(connectData),
      hasBase64: !!(connectData.base64 || connectData.qrcode?.base64),
      base64Preview: (connectData.base64 || connectData.qrcode?.base64)?.substring(0, 60),
      data: connectData,
    }
  } catch (e: any) {
    results.connectError = e.message
  }

  return NextResponse.json(results)
}
