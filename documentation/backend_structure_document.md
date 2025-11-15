# Backend Structure Document

This document outlines the backend setup for the `codeguide-invoice-module`, a full-stack invoice management system built on Next.js 15. It covers the architecture, database, APIs, hosting, infrastructure, security, and maintenance practices in clear, everyday language.

## 1. Backend Architecture

- **Framework**: Next.js 15 (App Router) for co-located pages and API routes.  
- **Design Pattern**: File-based routing. Each API endpoint lives next to its page, reducing context switching.  
- **Authentication**: Better Auth for sign-up, sign-in, session management, and role‐based access.  
- **Business Logic**: Separated into small, focused modules under `lib/` (e.g., email service, reminder logic).  
- **Layered Structure**:  
  - Presentation: React components and pages (`app/` & `components/`)  
  - API: Serverless functions under `app/api/`  
  - Data: Drizzle ORM models in `db/`  
  - Utilities: Shared helpers in `lib/`  

**Scalability**  
Next.js serverless API routes scale automatically with traffic. Separation of concerns keeps each function small and fast.  

**Maintainability**  
File-based structure and TypeScript types make it easy to find, update, and reason about code.  

**Performance**  
Serverless functions spin up on demand. Vercel’s edge network caches static assets and can cache API responses if configured.

## 2. Database Management

**Primary Database**  
- Type: Relational (SQL)  
- System: PostgreSQL  
- ORM: Drizzle ORM (type-safe queries, migrations)  

**Data Flow**  
1. API Route receives request  
2. Drizzle ORM builds a SQL query  
3. PostgreSQL executes the query  
4. API returns JSON response  

**Development vs. Production**  
- Local: Docker Compose brings up Postgres container  
- Production: Managed Postgres instance (e.g., AWS RDS, DigitalOcean)  

**Alternative (Optional)**  
You may choose to swap in MongoDB with Mongoose. The existing `db/` folder can host a Mongoose connection file and schema definitions.

## 3. Database Schema

### Human-Readable Overview

1. **Users**: Stores user accounts and roles (admin or customer).  
2. **Invoices**: Holds invoice details, status, amounts, and due dates.  
3. **Payments**: Logs incoming payment webhooks, amount, and links to invoices.

### SQL Schema (PostgreSQL)
```sql
-- Users table: authentication and roles
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table: invoice data
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES users(id),
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table: records payment callbacks
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER REFERENCES invoices(id),
  amount NUMERIC(12,2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  raw_webhook JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 4. API Design and Endpoints

We use RESTful API routes inside the Next.js App Router. Each file in `app/api/` becomes an endpoint.

Key endpoints:

- **GET `/api/invoices`**  
  - Purpose: List invoices for the current user.  
  - Access: Admin sees all; customers see only their invoices.  

- **POST `/api/invoices`**  
  - Purpose: Create a new invoice (admin only).  
  - Body: `{ customerId, amount, dueDate }`  

- **GET `/api/invoices/[id]`**  
  - Purpose: Get details of one invoice.  
  - Access: Admin or owning customer.  

- **PATCH `/api/invoices/[id]`**  
  - Purpose: Update invoice fields (admin only).  
  - Body: Partial invoice data (e.g., status change).  

- **POST `/api/payments/webhook`**  
  - Purpose: Receive payment provider callbacks.  
  - Logic: Verify secret header, update invoice status to “paid,” record payment, send receipt email.  

- **POST `/api/cron/send-reminders`**  
  - Purpose: Send reminder emails for overdue invoices.  
  - Trigger: External scheduler (e.g., Vercel Cron Jobs) calls this endpoint daily.  
  - Security: Protected by a secret token in header or query.

## 5. Hosting Solutions

- **Platform**: Vercel (recommended) or any serverless-friendly host  
- **Local Development**: Docker Compose for Postgres and environment parity  

**Benefits of Vercel**  
- Zero-config deployment for Next.js  
- Automatic global CDN for static assets  
- Serverless scaling for API routes  
- Built-in environment variable management  

**Alternative**  
- Containerized deployment to AWS ECS, DigitalOcean, or Heroku  
- Use managed Postgres (RDS, Cloud SQL) alongside Vercel front-end

## 6. Infrastructure Components

- **Load Balancer & Edge Network**: Managed by Vercel to route requests to nearest serverless region.  
- **Content Delivery Network (CDN)**: Vercel edge cache for static assets and can cache API responses.  
- **Database Container**: Docker for local; managed instance in staging/production.  
- **Scheduler**: External cron job service (Vercel Cron Jobs or GitHub Actions) to hit the reminder endpoint daily.  
- **Caching (Optional)**:  
  - HTTP cache headers on invoices endpoints for read-heavy scenarios  
  - In-memory cache (Redis) in front of Postgres for frequently accessed data

## 7. Security Measures

- **Authentication & Authorization**  
  - Better Auth for secure sign-in, sign-up, and session cookies  
  - Role field (`admin` or `customer`) on user model  
  - Middleware in API routes checks session and role before allowing data access or modification  

- **Data Encryption**  
  - HTTPS enforced by hosting platform  
  - PostgreSQL TLS for data in transit  
  - Secrets (DB credentials, auth keys, webhook secret) stored as environment variables  

- **Endpoint Protection**  
  - Webhook endpoint guarded by a shared secret header  
  - Cron endpoint requires a token to prevent open abuse  

- **Input Validation**  
  - TypeScript types + Drizzle ORM ensure valid queries  
  - Consider adding Zod schemas for request bodies to trap invalid data early

## 8. Monitoring and Maintenance

- **Logging**  
  - Vercel built-in function logs  
  - Consider integrating Sentry or Logflare for structured error tracking  

- **Performance Metrics**  
  - Vercel Analytics for response times and error rates  
  - PostgreSQL monitoring via built-in cloud provider tools or pgAdmin  

- **Database Migrations**  
  - Drizzle ORM migration scripts version your schema changes  
  - Run migrations during CI/CD before each deploy  

- **Routine Maintenance**  
  - Dependency updates via automated tools (Dependabot)  
  - Regular review of environment variables and secrets  
  - Monthly security audits and penetration testing

## 9. Conclusion and Overall Backend Summary

The `codeguide-invoice-module` backend is built on a modern, serverless-ready stack:

- **Next.js 15 App Router** with co-located API routes for streamlined development  
- **Better Auth** for user management and role-based security  
- **PostgreSQL + Drizzle ORM** for reliable, type-safe data storage  
- **Vercel** hosting for automatic scaling, global CDN, and serverless functions  
- **Modular code structure** (`app/`, `db/`, `lib/`) for clear responsibilities  

This setup supports secure invoice CRUD, payment processing, and scheduled reminders out of the box. It scales with demand, remains maintainable through strong typing and clear boundaries, and leverages best-in-class hosting services for performance and reliability. Any developer can pick up this codebase and immediately understand where to extend business logic, update models, or adjust deployment settings.