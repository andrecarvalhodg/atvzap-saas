# ATVzap - Automacao WhatsApp para Infoprodutores

Plataforma SaaS para automacao de mensagens WhatsApp integrada com plataformas de infoprodutos (Doppus, Kiwify, Hotmart).

## Stack

- **Framework**: Next.js 16 (App Router)
- **Linguagem**: TypeScript
- **Estilizacao**: Tailwind CSS 4 + shadcn/ui
- **Banco de Dados**: PostgreSQL (Neon)
- **ORM**: Prisma 6
- **Autenticacao**: Auth.js v5 (Google + Magic Link)
- **Pagamentos**: Stripe
- **Emails**: Resend
- **Data Fetching**: TanStack Query
- **Deploy**: Vercel

## Setup

### Pre-requisitos

- Node.js 18+
- npm
- Conta no [Neon](https://neon.tech) (PostgreSQL gratuito)
- Conta no [Vercel](https://vercel.com)

### Instalacao

```bash
# Clone o repositorio
git clone https://github.com/andrecarvalhodg/atvzap-saas.git
cd atvzap-saas

# Instale as dependencias
npm install

# Copie o arquivo de variaveis de ambiente
cp .env.example .env

# Preencha as variaveis no .env

# Gere o Prisma Client
npx prisma generate

# Aplique o schema no banco
npx prisma db push

# Inicie o servidor de desenvolvimento
npm run dev
```

### Variaveis de Ambiente

Veja `.env.example` para a lista completa. Voce precisa configurar:

1. **DATABASE_URL** - Connection string do Neon
2. **AUTH_SECRET** - Gere com `openssl rand -base64 32`
3. **AUTH_GOOGLE_ID/SECRET** - Google Cloud Console
4. **STRIPE_SECRET_KEY** - Dashboard do Stripe
5. **RESEND_API_KEY** - Dashboard do Resend

### Design System

Os tokens de design ficam em `design-system/tokens.ts`. Para gerar o CSS:

```bash
npm run tokens        # Gera globals.css
npm run tokens:check  # Verifica sincronizacao (CI)
```

## Deploy

O projeto esta conectado ao Vercel com deploy automatico a cada push na branch master.

URL: https://atvzap-saas.vercel.app
