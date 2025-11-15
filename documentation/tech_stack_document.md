# Tech Stack Document for codeguide-invoice-module

This document explains every technology choice in plain language, so anyone can understand why it was picked and how it helps build a reliable invoice management system.

---

## 1. Frontend Technologies

Our user interface (what you see and click on) is built with the following tools:

- **Next.js 15 (App Router)**
  • Handles page routing automatically and lets us colocate frontend code with backend API routes.
  • Supports both server-side rendering (SSR) and static site generation (SSG) for fast page loads.
- **React 19**
  • Provides the building blocks (components) for our interface, letting us break the UI into reusable pieces.
- **TypeScript**
  • Adds clear, predictable typing to JavaScript, catching errors early and making the code easier to understand.
- **Tailwind CSS**
  • A utility-first CSS framework that speeds up styling with small, consistent class names.
  • Purges unused styles in production, resulting in smaller CSS files and faster load times.
- **shadcn/ui**
  • A library of ready-made, themeable components (tables, forms, buttons, cards) built on top of Tailwind.
  • Accelerates UI development by giving us high-quality building blocks for the invoice list, detail view, and forms.

How this enhances user experience:
- Rapid page transitions and data loading thanks to Next.js optimizations.
- A consistent, mobile-friendly design using Tailwind’s responsive utilities.
- Clean, intuitive components (forms, tables) from shadcn/ui, ensuring a polished look without building from scratch.

---

## 2. Backend Technologies

All server-side logic (data storage, business rules, authentication) lives here:

- **Next.js API Routes**
  • Lets us write REST endpoints directly inside the Next.js app (e.g., `/api/invoices`, `/api/payments/webhook`).
  • Simplifies deployment by keeping front and back in one codebase.
- **Better Auth**
  • Handles secure sign-up, sign-in, password resets, and session management.
  • We extend the user schema to include a `role` field (`admin` or `customer`) for fine-grained access control.
- **PostgreSQL with Drizzle ORM**
  • A reliable, relational database for storing invoices, users, and payments.
  • Drizzle ORM provides type-safe database queries in TypeScript, reducing runtime errors.
  • If you prefer MongoDB, you can swap Drizzle for Mongoose—keeping the same folder structure but replacing SQL tables with document schemas.
- **Nodemailer (in `lib/email.ts`)**
  • Sends invoice reminders and payment receipts via SMTP.
- **Zod (optional)**
  • Validates incoming data in API routes, ensuring only well-formed invoices or payments are processed.

How these components work together:
1. A user logs in via Better Auth and gets a secure session cookie.
2. Frontend calls `/api/invoices`, where Next.js API Routes retrieves the session, checks the role, then reads or writes data in PostgreSQL via Drizzle.
3. When a payment comes through, `/api/payments/webhook` validates it and updates the invoice status, then triggers an email via Nodemailer.

---

## 3. Infrastructure and Deployment

This section covers how we host, build, and deploy the application:

- **Version Control:** Git & GitHub
  • Keeps a history of every change, lets multiple developers collaborate safely.
- **CI/CD Pipeline:** GitHub Actions or Vercel’s built-in workflow
  • Automatically runs tests, lints code, and deploys on every merge to the main branch.
- **Hosting Platform:** Vercel (primary), or any Docker-friendly host
  • Zero-configuration deployments for Next.js.
  • Built-in environment variable management (API keys, database URLs).
- **Containerization:** Docker (for local development)
  • Spins up a consistent PostgreSQL or MongoDB instance locally.
  • Guarantees the same environment on every developer’s machine.
- **Environment Variables:** `.env.local` (development) & platform secrets (production)
  • Keeps sensitive data (DB credentials, API keys) out of source control.
- **Serverless Cron Jobs:** Vercel Cron or external scheduler (e.g., AWS EventBridge)
  • Triggers `/api/cron/send-reminders` once per day to email overdue invoice reminders.

These choices ensure:
- Reliable, repeatable builds and deployments.
- Scalable hosting that grows with your user base.
- Easy onboarding for new developers using Docker.

---

## 4. Third-Party Integrations

We rely on several external services to extend functionality safely and quickly:

- **Stripe (or other payment processor)**
  • Processes credit-card and other payments.
  • Sends webhooks to our `/api/payments/webhook` endpoint for real-time status updates.
- **Email Delivery (via Nodemailer + SMTP provider)**
  • Delivers payment receipts and overdue reminders.
  • Can be backed by services like SendGrid or Mailgun for better deliverability.
- **Better Auth**
  • Outsources the security-critical user authentication flows.
- **Vercel Cron Jobs (or external)**
  • Schedules daily tasks without running a dedicated server.

Benefits:
- Offloads heavy lifting (payments, emails, auth) to specialized platforms.
- Frees the team to focus on core invoicing features.

---

## 5. Security and Performance Considerations

We’ve built in several layers of protection and speed optimizations:

Security measures:
- **Role-based access control** with Better Auth and custom middleware to guard pages and API endpoints.
- **Environment variables** and secret management to protect API keys and DB credentials.
- **HTTPS** enforced by hosting platforms (Vercel, Docker proxies).
- **Input validation** using Zod to prevent malformed or malicious data.
- **Protected webhook endpoints** using shared secrets or signature checks.

Performance optimizations:
- **Built-in Next.js caching** for static assets and serverless functions.
- **Incremental Static Regeneration (ISR)** for pages that can be pre-rendered and updated in the background.
- **Tailwind CSS Purge** to remove unused styles, reducing CSS bundle size.
- **Code splitting and lazy loading** of React components for faster initial load.
- **Database indexing** on invoice status and due date columns for quick queries.

---

## 6. Conclusion and Overall Tech Stack Summary

In summary, this starter kit combines a modern, full-stack framework with proven third-party services to deliver a secure, scalable invoice management system:

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Next.js API Routes, Better Auth, PostgreSQL + Drizzle ORM (or MongoDB + Mongoose), Nodemailer
- Infrastructure: GitHub, GitHub Actions/Vercel CI, Vercel Hosting, Docker for local, Vercel Cron
- Integrations: Stripe (payments), SMTP provider (emails), Better Auth, external scheduler
- Security & Performance: Role-based auth, input validation, HTTPS, caching, ISR, CSS purging, DB indexing

These choices ensure rapid development of your invoice features, strong data integrity, professional UI, and a deployment pipeline that scales with your business. The unified Next.js codebase means you can focus on building `InvoiceList`, `InvoiceDetail`, `InvoiceForm`, payment workflows, and reminders—rather than infrastructure plumbing.