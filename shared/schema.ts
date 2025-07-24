import { pgTable, text, serial, integer, boolean, decimal, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const debts = pgTable("debts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull(),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull(),
  minimumPayment: decimal("minimum_payment", { precision: 12, scale: 2 }).notNull(),
  dueDate: integer("due_date").notNull(), // Day of month (1-31)
  debtType: varchar("debt_type", { length: 50 }).notNull(),
  paymentFrequency: varchar("payment_frequency", { length: 20 }).notNull().default("monthly"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const budgetItems = pgTable("budget_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  category: text("category").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'income' or 'expense'
  isEssential: boolean("is_essential").default(false).notNull(),
  isFixed: boolean("is_fixed").default(false).notNull(),
  isProtected: boolean("is_protected").default(false).notNull(), // For food budget protection
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  debtId: integer("debt_id").notNull(),
  userId: integer("user_id").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  paymentType: varchar("payment_type", { length: 20 }).notNull(), // 'minimum', 'extra', 'full'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertDebtSchema = createInsertSchema(debts).omit({
  id: true,
  userId: true,
  createdAt: true,
}).extend({
  balance: z.coerce.number().positive(),
  interestRate: z.coerce.number().min(0).max(100),
  minimumPayment: z.coerce.number().positive(),
  dueDate: z.coerce.number().min(1).max(31),
});

export const insertBudgetItemSchema = createInsertSchema(budgetItems).omit({
  id: true,
  userId: true,
  createdAt: true,
}).extend({
  amount: z.coerce.number().positive(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  userId: true,
  createdAt: true,
}).extend({
  amount: z.coerce.number().positive(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Debt = typeof debts.$inferSelect;
export type InsertDebt = z.infer<typeof insertDebtSchema>;

export type BudgetItem = typeof budgetItems.$inferSelect;
export type InsertBudgetItem = z.infer<typeof insertBudgetItemSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// Additional types for frontend
export type DebtWithPayments = Debt & {
  payments: Payment[];
  totalPaid: number;
  remainingBalance: number;
  payoffDate?: string;
};

export type BudgetSummary = {
  totalIncome: number;
  totalExpenses: number;
  availableForDebt: number;
  protectedAmount: number;
};
