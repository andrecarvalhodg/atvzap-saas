import { z } from "zod"

export const instanceSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
})

export const contactSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(10, "Telefone inválido"),
  email: z.string().email("Email inválido").optional(),
})

export const webhookConfigSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  instanceId: z.string().min(1, "Selecione uma instância"),
  platform: z.enum(["doppus", "kiwify", "hotmart"]),
  event: z.enum([
    "purchase_approved",
    "purchase_refunded",
    "subscription_canceled",
  ]),
  listId: z.string().optional(),
  adminPhone: z.string().optional(),
  adminMessage: z.string().optional(),
  message1: z.string().min(1, "Mensagem 1 é obrigatória"),
  delay1: z.number().min(0).default(0),
  message2: z.string().optional(),
  delay2: z.number().min(0).default(0),
  message3: z.string().optional(),
})

export const campaignSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  instanceId: z.string().min(1, "Selecione uma instância"),
  listId: z.string().min(1, "Selecione uma lista"),
  message: z.string().min(1, "Mensagem é obrigatória"),
  schedule: z.enum(["immediate", "scheduled"]).default("immediate"),
  scheduledAt: z.string().optional(),
})
