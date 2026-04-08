import { Resend } from "resend"

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(email: string, name: string) {
  return resend.emails.send({
    from: "ATVzap <noreply@resend.dev>",
    to: email,
    subject: "Bem-vindo ao ATVzap!",
    html: `<h1>Olá ${name}!</h1><p>Seu trial de 14 dias começou. Aproveite!</p>`,
  })
}
