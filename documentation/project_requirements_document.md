# Project Requirements Document (PRD)

## 1. Project Overview

The **codeguide-invoice-module** is a full-stack invoice management system built on a modern Next.js 15 starter kit. It provides a secure, scalable foundation for admins and customers to create, view, edit, and pay invoices. Out of the box it handles user authentication, session management, responsive UI components, and database integration, so development focus can go straight to invoicing logic, notifications, and payment workflows.

This module is being built to streamline billing operations for small to mid-sized businesses. Key success criteria include: 
- A clear, role-based access model that distinguishes admin and customer capabilities
- End-to-end invoice CRUD (Create, Read, Update, Delete) with real-time UI feedback
- Automated email reminders and a secure payment webhook flow
- Reliable performance and security in a serverless deployment

## 2. In-Scope vs. Out-of-Scope

**In-Scope (Version 1):**
- User signup, signin, session management via Better Auth
- Role management with `admin` vs. `customer` in the user schema
- Invoice CRUD API endpoints (`/api/invoices`, `/api/invoices/[id]`)
- Frontend pages and components: InvoiceList, InvoiceDetail, InvoiceForm
- Payment webhook endpoint (`/api/payments/webhook`) to mark invoices paid
- Daily reminder job endpoint (`/api/cron/send-reminders`) triggered by an external cron service
- Email notifications using Nodemailer
- Responsive UI using Tailwind CSS and shadcn/ui
- Dockerized local database (PostgreSQL via Drizzle ORM or optional MongoDB via Mongoose)

**Out-of-Scope (Planned for Later Phases):**
- Multi-tenant (multiple companies under one account)
- Invoice templates or PDF generation
- Advanced reporting or analytics dashboards
- Payment provider integrations beyond a single webhook
- Multi-currency or international tax calculations

## 3. User Flow

A new user lands on the public homepage and clicks “Sign Up.” They provide email and password, receive a session token, and are assigned the default `customer` role. After email confirmation, they are redirected to a dashboard featuring a left-hand navigation bar (Dashboard, Invoices, Profile) and a main content panel showing a welcome message.

When a user clicks “Invoices,” they see a table (InvoiceList) with existing invoices: date, amount, status, and action buttons. Admins get “Create,” “Edit,” and “Delete” buttons; customers only see “View” and “Pay.” Clicking “Create Invoice” opens a form (InvoiceForm). Submitting it calls `POST /api/invoices` and refreshes the table. Clicking an invoice row opens InvoiceDetail, displaying line items, payment status, and trigger buttons for reminders or payment links. A customer clicking “Pay” is redirected to the payment provider, which then calls `/api/payments/webhook` to update status.

## 4. Core Features

- Authentication & Authorization
  - Sign up, sign in, session management via Better Auth
  - Role field (`admin` or `customer`) in user schema
  - Middleware checks in API routes and page layouts
- Invoice Management
  - `GET /api/invoices` (list), `POST /api/invoices` (create)
  - `GET /api/invoices/[id]` (detail), `PATCH /api/invoices/[id]` (update)
  - `DELETE /api/invoices/[id]` (delete, admin only)
- Payment Webhook
  - `POST /api/payments/webhook` to validate provider callback
  - Update invoice status to “Paid” and trigger receipt email
- Reminder Scheduling
  - `GET /api/cron/send-reminders` queries overdue invoices
  - Sends reminder emails, updates last-reminder timestamp
- Frontend Components
  - InvoiceList (table), InvoiceDetail (card), InvoiceForm (form)
  - Role-aware UI: hide or disable actions based on user role
- Email Service
  - Nodemailer setup in `lib/email.ts`
  - Templated emails for reminders and receipts

## 5. Tech Stack & Tools

- Frontend: Next.js 15 (App Router), React 19, TypeScript
- Styling: Tailwind CSS, shadcn/ui component library
- Authentication: Better Auth (NextAuth alternative)
- Database & ORM: 
  - Default: PostgreSQL via Drizzle ORM (type-safe queries)
  - Alternative: MongoDB via Mongoose (if migrating)
- Backend: Next.js API Routes for all REST endpoints
- Emails: Nodemailer in `lib/email.ts`
- Jobs/Cron: Serverless API route + external scheduler (e.g., Vercel Cron)
- Containerization: Docker (database service)
- Dev Tools: VS Code, Node.js LTS, Git

## 6. Non-Functional Requirements

- Performance: API response ≤ 200ms under normal load
- Scalability: Stateless Node.js functions, horizontal scaling via serverless
- Security:
  - HTTPS only
  - Secure JWT/session cookies
  - Rate limiting on webhook and cron endpoints
  - Input validation via Zod or built-in checks
- Usability: Responsive UI (mobile to desktop)
- Maintainability: TypeScript strict mode, consistent code formatting (Prettier, ESLint)

## 7. Constraints & Assumptions

- Environment: Node.js 18+ on Vercel or similar serverless platform
- Better Auth service is available and supports custom user fields
- Database choice fixed at start; migrating between SQL and NoSQL requires code changes
- External cron scheduler is set up separately (Vercel Cron, GitHub Actions)
- Email provider credentials (SMTP) supplied via environment variables

## 8. Known Issues & Potential Pitfalls

- **Serverless Cron Limitations**: Native long-running jobs aren’t supported; use external scheduler. Mitigation: Secure cron endpoint with a secret header to avoid public access.
- **Database Migration Overhead**: Switching from Drizzle to Mongoose requires reworking models and queries. Mitigation: Decide early and abstract data-access layer.
- **Webhook Security**: Incoming payment callbacks must be validated against a shared secret. Mitigation: Use signature verification and strict payload schema checks.
- **Role Escalation Risk**: Improper role checks could expose admin actions. Mitigation: Enforce authorization in both frontend UI and backend API middleware.
- **Email Deliverability**: Free SMTP may hit spam filters. Mitigation: Use a trusted email service (SendGrid, Mailgun) and configure SPF/DKIM records.

---
This PRD provides a clear, unambiguous guide for building the invoice management module on top of the `codeguide-invoice-module` starter. Subsequent documents (technical stack details, frontend guidelines, backend structure, app flow, file organization) can reference these sections directly.