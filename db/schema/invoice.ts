import { pgTable, text, timestamp, decimal, pgEnum, index } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const invoiceStatusEnum = pgEnum("invoice_status", ["Pending", "Paid", "Overdue", "Cancelled"]);

export const invoice = pgTable("invoice", {
    id: text("id").primaryKey(),
    customerId: text("customer_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    adminId: text("admin_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    invoiceNumber: text("invoice_number").notNull().unique(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    dueDate: timestamp("due_date").notNull(),
    status: invoiceStatusEnum("status").default("Pending").notNull(),
    description: text("description"),
    lineItems: text("line_items"), // JSON string for line items
    paymentDate: timestamp("payment_date"),
    paymentMethod: text("payment_method"),
    notes: text("notes"),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: timestamp("updated_at")
        .$defaultFn(() => new Date())
        .notNull(),
}, (table) => ({
    customerIdIdx: index("invoice_customer_id_idx").on(table.customerId),
    adminIdIdx: index("invoice_admin_id_idx").on(table.adminId),
    statusIdx: index("invoice_status_idx").on(table.status),
    dueDateIdx: index("invoice_due_date_idx").on(table.dueDate),
    invoiceNumberIdx: index("invoice_invoice_number_idx").on(table.invoiceNumber),
}));