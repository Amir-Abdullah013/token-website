# 🚀 Token Platform - Next.js & Supabase Crypto Ecosystem

[![Next.js](https://img.shields.io/badge/Next.js-15.5.7-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.18-38BDF8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=for-the-badge&logo=postgresql)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

A modern, high-performance, full-stack cryptocurrency platform built with Next.js App Router (Turbopack), React 19, Tailwind CSS, Prisma, and PostgreSQL (Supabase). This platform supports token trading, order matching engine, staking yields, wallet management, administrative controls, and automated background workers via custom CRON jobs.

---

## 📸 Overview & Features

### 🔐 Authentication & Security
- **OAuth 2.0 & Custom Auth**: Google OAuth integration and email/password authentication.
- **Session & Account Persistence**: Robust verification and session protection middleware (`middleware.js`).
- **Role-Based Access Control (RBAC)**: Distinct permissions for `USER` and `ADMIN` roles.

### 💰 Wallet & Staking Engine
- **Multi-currency Wallet**: Support for deposit address management, token transfer, and withdrawal requests.
- **Automated Yield Staking**: Configurable staking lockup periods and periodic reward calculations.
- **Fee Management**: Automated background collection and auditing of wallet transactions.

### 📊 Order Book & Matching Engine
- **Limit/Market Orders**: Peer-to-peer or pooled order matching logic.
- **Real-Time Analytics**: Built-in interactive charts powered by `recharts`.

### 🛡️ Administrative Portal
- **User Management**: Approve/reject user withdrawals, inspect active sessions, manage roles.
- **System Metrics & Settings**: Live platform fee configurations, maintenance mode toggles, and detailed log tracking.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: Next.js 15 (App Router with Turbopack) & React 19
- **Database & ORM**: PostgreSQL (Supabase connection pooling & Direct connection) paired with Prisma ORM
- **Styling & UI**: Tailwind CSS, Framer Motion, Lucide React icons
- **State & Data Fetching**: SWR (Stale-While-Revalidate) & Client-side Context API
- **Deployment**: Optimized for Render / Vercel (includes `render.yaml` configuration)

---

## 📁 Repository Structure

```gfm
token-website/
├── prisma/               # Database schema & seeding scripts
│   ├── schema.prisma     # Core database data models
│   └── seed.js           # Default initial data seeder
├── public/               # Static assets & web manifest
├── src/
│   ├── app/              # Next.js 15 App Router routes
│   │   ├── admin/        # Protected admin management dashboard
│   │   ├── api/          # REST endpoints & Cron automation APIs
│   │   ├── auth/         # Login, Registration, and OAuth workflows
│   │   ├── user/         # User wallet, exchange, and staking portal
│   │   ├── page.js       # Dynamic landing page
│   │   └── layout.js     # Root layout & theme providers
│   └── components/       # Shared UI components & design system
├── scripts/              # Migration, optimization, and helper scripts
├── render.yaml           # Infrastructure-as-code for Render deployment
└── middleware.js         # Edge protection middleware
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed locally:
- **Node.js** (v18.x or later recommended)
- **npm** (v9.x or later)
- **PostgreSQL** database (or a free tier [Supabase](https://supabase.com) instance)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Amir-Abdullah013/token-website.git
   cd token-website
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (or run `npm run setup:env` for guided setup):
   ```env
   # App URLs & Auth
   NEXT_PUBLIC_NEXTAUTH_URL=http://localhost:3000
   NEXT_PUBLIC_NEXTAUTH_SECRET=your_jwt_secret_key

   # Database (Supabase / Postgres)
   DATABASE_URL="postgresql://user:password@pooler-host:6543/postgres?sslmode=require"
   DIRECT_URL="postgresql://user:password@direct-host:5432/postgres?sslmode=require"

   # Google OAuth Credentials
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   # Email Service (SMTP / Nodemailer)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password

   # Background CRON Security
   CRON_SECRET=your_random_cron_secret
   ```

4. **Initialize & Seed Database**:
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database
   npm run db:push

   # Seed default data
   npm run db:seed
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| **Dev** | `npm run dev` | Starts Next.js app router in development mode with Turbopack |
| **Build** | `npm run build` | Builds production-optimized bundle via Turbopack |
| **Start** | `npm run start` | Runs the compiled production build |
| **DB Push** | `npm run db:push` | Pushes schema changes directly to the target database |
| **DB Studio** | `npm run db:studio` | Launches interactive Prisma Database GUI |
| **Lint** | `npm run lint` | Runs Next.js ESLint diagnostics |
| **Setup Env** | `npm run setup:env` | Interactive setup script for local environment variables |

---

## ⏱️ CRON Jobs & Automation

The platform relies on scheduled API endpoints to manage token operations. The `render.yaml` configuration defines automated service triggers:

* **Auto Match Orders** (`/api/cron/auto-match-orders`): Executed every minute to process active buy/sell orders.
* **Process Wallet Fees** (`/api/cron/process-wallet-fees`): Executed daily at midnight UTC.
* **Process Staking Rewards** (`/api/cron/process-stakings`): Executed every 6 hours.
* **Cleanup Expired Tokens** (`/api/cron/cleanup-reset-tokens`): Executed hourly.

---

## 🌐 Deployment

### Deploying to Render
This project includes a native `render.yaml` specification for zero-config Render service creation:
1. Connect your repository to Render.
2. Select **Blueprint Deployment**.
3. Provide required environment variables (`DATABASE_URL`, `CRON_SECRET`, `NEXT_PUBLIC_BASE_URL`) in the Render dashboard.

### Deploying to Vercel
1. Push your repository to GitHub.
2. Import project into Vercel.
3. Set your environment variables under **Project Settings > Environment Variables**.
4. Use `npm run build:webpack` if standard build options are required by your Vercel pipeline settings.

---

## 🤝 Contributing

Contributions are welcome! Follow these steps to contribute:
1. Fork the project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more details.
