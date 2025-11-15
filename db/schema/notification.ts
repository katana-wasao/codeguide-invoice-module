import { pgTable, text, timestamp, boolean, pgEnum, index } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const notificationTypeEnum = pgEnum("notification_type", ["payment_reminder", "payment_received", "invoice_created", "invoice_updated"]);

export const notification = pgTable("notification", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    message: text("message").notNull(),
    read: boolean("read").default(false).notNull(),
    metadata: text("metadata"), // JSON string for additional metadata
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
}, (table) => ({
    userIdIdx: index("notification_user_id_idx").on(table.userId),
    userIdReadIdx: index("notification_user_id_read_idx").on(table.userId, table.read),
    typeIdx: index("notification_type_idx").on(table.type),
    createdAtIdx: index("notification_created_at_idx").on(table.createdAt),
}));