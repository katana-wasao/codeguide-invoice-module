# Security Guidelines for `codeguide-invoice-module`

This document outlines security best practices and actionable recommendations for the `codeguide-invoice-module`—a Next.js 15 (App Router) starter template tailored for an Invoice Management System. It aligns with industry-standard principles to ensure robust, trustworthy, and maintainable security by design.

---

## 1. Core Security Principles

1. **Security by Design**  
   • Incorporate security considerations from project bootstrapping through deployment.  
   • Review each feature (authentication, payments, reminders) for threat vectors before coding.

2. **Least Privilege**  
   • Grant database users only CRUD rights they require (e.g., read-only for invoice viewers).  
   • Limit environment variable access in serverless functions to only necessary secrets.

3. **Defense in Depth**  
   • Combine role-based access checks, server-side validation, and HTTP security headers.  
   • Use both network-level controls (Vercel Firewall, Cloudflare WAF) and application-level checks.

4. **Input Validation & Output Encoding**  
   • Validate and sanitize every incoming field (`InvoiceForm`, URL params, webhook payloads) using Zod or similar.  
   • Encode all outputs rendered in React components to prevent XSS.

5. **Fail Securely**  
   • Catch exceptions in API routes (`app/api/**/route.ts`) and return generic error messages without stack traces.  
   • Ensure payment webhook failures do not leave invoices in an inconsistent state.

6. **Keep Security Simple**  
   • Prefer native Next.js security primitives (Edge Middleware, route handlers) over complex custom code when possible.

7. **Secure Defaults**  
   • Enable `strict` mode in TypeScript, enforce `npm audit` on CI, and disable debug flags in production builds.

---

## 2. Authentication & Access Control

**Better Auth Integration**  
- Extend the user schema (`db/auth.ts`) with a `role` field (enum: `admin` | `customer`).  
- On sign-up, default new users to `customer`. Provide a protected admin-only UI or migration script to promote roles.

**Password Security**  
- Enforce strong password policy: minimum 12 characters, upper/lowercase, digits, symbols.  
- Leverage Better Auth’s built-in hashing (bcrypt or Argon2) and unique per-user salts.

**Session Management**  
- Use HTTP-only, Secure, SameSite=strict cookies to store session tokens.  
- Implement idle and absolute session timeouts.  
- Invalidate sessions on logout and password changes.

**Role-Based Access Control (RBAC)**  
- In each API handler (`/app/api/invoices/route.ts`, `/app/api/invoices/[id]/route.ts`), retrieve the session and assert roles before database operations.  
- Protect frontend routes (`app/dashboard/invoices/*`) using Next.js Middleware or `getServerSession()` in server components.

**Multi-Factor Authentication (MFA)** *(Optional but recommended)*  
- Integrate TOTP-based MFA for admin accounts via a secure library (e.g., `speakeasy`).

---

## 3. Input Handling & Processing

- **Server-Side Validation**: Never rely solely on client-side checks. Use Zod schemas in API routes to validate request bodies and query parameters.  
- **SQL/NoSQL Injection Prevention**:
  • If using Drizzle/PostgreSQL: utilize parameterized queries provided by the ORM.  
  • If migrating to MongoDB: use Mongoose with strict schemas and parameterized method calls (`Model.findOne({ _id })`).
- **XSS Mitigation**: Encode user-generated content in React with built-in escaping or libraries like `DOMPurify` when rendering HTML descriptions.
- **CSRF Protection**: Use Next.js built-in CSRF tokens (e.g., `next-csrf`) for all state-modifying endpoints.
- **File Uploads** *(if applicable)*: Validate file type, size on both client and server; store outside webroot; sanitize file names; scan for malware.

---

## 4. Data Protection & Privacy

- **Transport Encryption**: Enforce HTTPS (TLS 1.2+) for all client-server interactions. Redirect all HTTP traffic to HTTPS.
- **At-Rest Encryption**:
  • For PostgreSQL: enable Transparent Data Encryption (TDE) or disk-level encryption.  
  • For MongoDB: enable `--enableEncryption` and use a Key Management Service.
- **Secrets Management**:
  • Do not hardcode API keys, database URIs, or email credentials.  
  • Leverage Vercel Secrets, AWS Secrets Manager, or HashiCorp Vault.  
- **Sensitive Data Handling**: Mask or redact PII (customer email, payment methods) in logs and error messages.

---

## 5. API & Service Security

- **API Versioning**: Prefix endpoints with `/v1/` to manage breaking changes.  
- **Rate Limiting & Throttling**: Use middleware (e.g., `express-rate-limit` for custom servers or Vercel Edge functions with rate-limit wrappers) to prevent brute-force and DoS.
- **CORS Configuration**: Restrict origins to your dashboard domain. Disallow wildcards.
- **Webhook Security**: Validate payment provider signatures (HMAC) and verify payload integrity before processing.  
- **Least Privilege in API**: Expose only required endpoints; disable any unused default routes.

---

## 6. Web Application Security Hygiene

- **Security Headers**: Configure in `next.config.js` or a custom server:
  • `Strict-Transport-Security` (HSTS)  
  • `Content-Security-Policy` (restrict sources of scripts, styles)  
  • `X-Content-Type-Options: nosniff`  
  • `X-Frame-Options: DENY`  
  • `Referrer-Policy: strict-origin-when-cross-origin`
- **Secure Cookies**: All session and CSRF cookies must have `HttpOnly`, `Secure`, and `SameSite=Strict`.
- **Subresource Integrity**: Add SRI hashes for any CDN-loaded scripts/styles.

---

## 7. Infrastructure & Configuration Management

- **Environment Segregation**: Separate `.env.development`, `.env.production`, and CI/CD secrets.  
- **Hardened Serverless Functions**: Disable verbose logging and debug routes in production builds.  
- **Port & Service Exposure**: Only expose ports required by Next.js and the database (in local Docker only).  
- **Automated Patching**: Integrate Dependabot or Renovate to keep dependencies up to date.
- **Docker Security**: Use minimal base images (e.g., `node:18-alpine`). Set file system permissions to non-root user.

---

## 8. Dependency Management

- **Lockfiles**: Commit `package-lock.json` or `pnpm-lock.yaml` for deterministic installs.  
- **Vulnerability Scanning**: Integrate SCA tools (Snyk, GitHub Advanced Security) in CI pipeline.  
- **Minimal Footprint**: Remove unused dependencies (e.g., if switching from Drizzle to Mongoose, un-install Drizzle).  
- **Package Vetting**: Only adopt well-maintained packages with active communities. Review download counts, recent commits, and open issues.

---

## 9. Monitoring, Logging & Incident Response

- **Application Logging**: Log authentication attempts, role-validation failures, and payment webhook events with structured logs (JSON).  
- **Error Monitoring**: Integrate Sentry or LogRocket for real-time error tracking. Sanitize logs to avoid PII exposure.
- **Alerting**: Configure alerts for repeated login failures, high API error rates, or suspicious access patterns.
- **Backup & Recovery**: Regularly back up the invoice database and test restoration procedures.

---

By adhering to these guidelines, the `codeguide-invoice-module` will maintain a strong security posture across the authentication layer, data management, API surface, and deployment environment. Regularly revisit and update this document as the codebase and threat landscape evolve.