# Frontend Guideline Document

This document explains how the frontend of the `codeguide-invoice-module` is organized, designed, and built. It uses everyday language so anyone—technical or not—can get a clear picture of the setup, tools, and best practices.

## 1. Frontend Architecture

### Overview
- **Framework**: Next.js 15 (App Router) with React 19.
- **Language**: TypeScript for type safety and fewer runtime errors.
- **UI Library**: shadcn/ui (prebuilt React components) combined with Tailwind CSS.
- **API Layer**: Next.js API Routes live alongside pages, so frontend and backend code sit in the same project.

### How It Supports Scalability, Maintainability, and Performance
- **Scalability**: File-based routing and the App Router let us add new pages or API endpoints by creating folders and files—no central routing table to update.
- **Maintainability**: TypeScript plus a clear directory structure (`app/`, `components/`, `lib/`, `db/`) keeps code organized and easy to navigate.
- **Performance**: Next.js Server Components, automatic code splitting, and built-in image optimization mean faster initial loads and smaller JavaScript bundles.

## 2. Design Principles

### Usability
- Keep interfaces intuitive: actions like “Create Invoice” or “Send Reminder” are clear and labeled consistently.
- Use common patterns (tables for lists, modals for forms) so users don’t have to learn new interactions.

### Accessibility
- Semantic HTML elements (e.g., `<button>`, `<label>`), proper `aria` attributes, and keyboard-focus styles.
- Ensure color contrast meets WCAG AA standards.

### Responsiveness
- Mobile-first approach: Tailwind’s responsive utilities (`sm:`, `md:`, `lg:`) adapt layouts and font sizes to different screen widths.
- Test key pages (invoice list, detail view, form) on phones, tablets, and desktops.

## 3. Styling and Theming

### Styling Approach
- **Utility-First CSS**: Tailwind CSS drives almost all styling through small, composable classes (e.g., `px-4`, `bg-primary`).
- **Component System**: shadcn/ui wraps Tailwind classes into higher-level components (Table, Card, Button).

### Theming
- All colors and fonts are defined in `tailwind.config.js` under the `theme` section.
- Supports light and dark modes via the `media` or `class` strategy in Tailwind.

### Visual Style
- **Overall Look**: Modern, flat design with clean lines, subtle shadows, and occasional glassmorphism effects in modals.
- **Color Palette**:
  - Primary: #4F46E5 (indigo)
  - Secondary: #9333EA (purple)
  - Accent: #F59E0B (amber)
  - Background: #F9FAFB (light gray)
  - Surface: #FFFFFF (white)
  - Error: #EF4444 (red)
  - Success: #10B981 (green)
  - Info: #3B82F6 (blue)
  - Neutral Text: #374151 (dark gray)

- **Font**: Inter, with system-UI fallbacks (`ui-sans-serif`), for readability and a modern feel.

## 4. Component Structure

### Organization
- **`components/ui/`**: Shared, generic UI pieces (buttons, inputs, cards).
- **`components/invoices/`**: Invoice-specific components (InvoiceList, InvoiceDetail, InvoiceForm).
- **`app/dashboard/invoices/`**: Pages that assemble invoice components into full screens.

### Reusability and Maintainability
- Build small, single-purpose components that accept props (e.g., a `Table` that takes `columns` and `data`).
- Encourage composition: e.g., wrap a `Card` around the `InvoiceDetail` component rather than styling inline.

## 5. State Management

### Local State
- Use React’s `useState` and `useReducer` inside forms and interactive widgets (e.g., form field values, modal open/close).

### Shared State
- **User Session & Theme**: Managed via React Context (or Next.js built-in Session hooks). Any component can read the current user’s role or the active color mode.

### Server Data
- Rely on Next.js Server Components to fetch data at build or request time.
- For client-side updates (e.g., after submitting a form), standard `fetch` calls or the built-in `useRouter().refresh()` can re-render server components. Optionally, introduce SWR or React Query later for more advanced caching.

## 6. Routing and Navigation

### Application Routes
- **File-Based Routing**: Anything under `app/` becomes a route. E.g.:
  - `app/dashboard/invoices/page.tsx` → `/dashboard/invoices`
  - `app/dashboard/invoices/[id]/page.tsx` → `/dashboard/invoices/:id`

### API Routes
- **Next.js API Routes** live under `app/api/`. E.g.:
  - `app/api/invoices/route.ts` for listing and creating invoices.
  - `app/api/invoices/[id]/route.ts` for fetching or updating a single invoice.
  - `app/api/payments/webhook/route.ts` for payment callbacks.

### Protecting Routes
- Use Better Auth’s session hook (`useSession`) and Next.js middleware to guard pages and API endpoints based on user roles (`admin`, `customer`).
- Redirect unauthorized users to sign-in or an error page.

## 7. Performance Optimization

- **Automatic Code Splitting**: Next.js only sends the JavaScript needed for the current page.
- **Lazy Loading**: Use `next/dynamic` for heavy components (charts, large tables).
- **Image Optimization**: Built-in `<Image>` component compresses and serves the right size.
- **Minimize CSS**: Tailwind’s purge process strips out unused classes in production.
- **Server Components**: Offload as much work as possible to the server, reducing client bundle size.

## 8. Testing and Quality Assurance

### Unit Tests
- **Framework**: Jest + React Testing Library.
- Write tests for each UI component (rendering, props, events).

### Integration Tests
- Test Next.js API handlers with Supertest or Jest’s built-in fetch mocking to ensure endpoints respect roles and return correct JSON.

### End-to-End (E2E)
- **Tool**: Cypress or Playwright.
- Automate key flows: sign-in, invoice creation, invoice editing, payment webhook handling.

### Code Quality
- **Linting**: ESLint with TypeScript rules and Tailwind plugin.
- **Formatting**: Prettier for consistent code style.
- **CI/CD**: Run lint, type-check, and tests on every pull request.

## 9. Conclusion and Overall Frontend Summary

This frontend setup leverages Next.js 15’s App Router, React 19, TypeScript, Tailwind CSS, and shadcn/ui to deliver a fast, scalable, and maintainable invoicing module. Key benefits include:

- A unified codebase where pages, API routes, and styling live together.
- A component-driven approach that speeds up development and ensures consistency.
- Built-in performance optimizations and accessibility best practices.
- Clear paths for extending authentication roles, integrating with your database of choice, and adding new functionality like reminders or payment webhooks.

With these guidelines, any developer—even without deep Next.js experience—can understand, contribute to, and extend the invoice management frontend with confidence.