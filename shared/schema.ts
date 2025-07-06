import {
  sqliteTable,
  text,
  integer,
  real,
  blob,
  index
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for authentication
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(), // JSON string
    expire: integer("expire", { mode: 'timestamp' }).notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for email/password authentication
export const users = sqliteTable("users", {
  id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  category: text("category").notNull(),
  date: text("date").notNull(),
  isRecurring: integer("is_recurring", { mode: 'boolean' }).default(false),
  dayOfMonth: integer("day_of_month"),
  endDate: text("end_date"),
  dueDate: text("due_date"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const budgets = sqliteTable("budgets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  category: text("category").notNull(),
  amount: real("amount").notNull(),
  period: text("period").notNull().default("monthly"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const goals = sqliteTable("goals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  targetAmount: real("target_amount").notNull(),
  currentAmount: real("current_amount").notNull().default(0),
  category: text("category").notNull(),
  targetDate: text("target_date").notNull(), // ISO date string
  status: text("status").notNull().default("active"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

// Savings streak challenges table
export const savingsStreaks = sqliteTable("savings_streaks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  challengeName: text("challenge_name").notNull(),
  targetAmount: real("target_amount").notNull(),
  frequency: text("frequency").notNull(), // "daily", "weekly", "monthly"
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  isActive: integer("is_active", { mode: 'boolean' }).default(true).notNull(),
  lastSaveDate: text("last_save_date"), // ISO date string
  totalSaved: real("total_saved").default(0).notNull(),
  startDate: text("start_date").notNull(), // ISO date string
  endDate: text("end_date"), // ISO date string
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

// Individual streak entries table  
export const streakEntries = sqliteTable("streak_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  streakId: integer("streak_id").notNull().references(() => savingsStreaks.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  saveDate: text("save_date").notNull(), // ISO date string
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true,
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSavingsStreakSchema = createInsertSchema(savingsStreaks).omit({
  id: true,
  currentStreak: true,
  longestStreak: true,
  totalSaved: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStreakEntrySchema = createInsertSchema(streakEntries).omit({
  id: true,
  createdAt: true,
});

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;
export type InsertSavingsStreak = z.infer<typeof insertSavingsStreakSchema>;
export type SavingsStreak = typeof savingsStreaks.$inferSelect;
export type InsertStreakEntry = z.infer<typeof insertStreakEntrySchema>;
export type StreakEntry = typeof streakEntries.$inferSelect;

// Validation schemas for frontend
export const expenseFormSchema = z.object({
  description: z.string().min(3, "Description must be at least 3 characters"),
  amount: z.string().refine(val => parseFloat(val) > 0, "Amount must be greater than 0"),
  category: z.string().min(1, "Please select a category"),
  date: z.string().min(1, "Please select a date"),
});

export const goalFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  targetAmount: z.string().refine(val => parseFloat(val) > 0, "Target amount must be greater than 0"),
  currentAmount: z.string().refine(val => parseFloat(val) >= 0, "Current amount must be 0 or greater").default("0"),
  category: z.string().min(1, "Please select a category"),
  targetDate: z.string().min(1, "Please select a target date"),
});

export const streakChallengeFormSchema = z.object({
  challengeName: z.string().min(3, "Nome do desafio deve ter pelo menos 3 caracteres"),
  targetAmount: z.string().refine(val => parseFloat(val) > 0, "Valor deve ser maior que 0"),
  frequency: z.enum(["daily", "weekly", "monthly"], {
    required_error: "Selecione a frequência"
  }),
  endDate: z.string().optional(),
});

export const streakEntryFormSchema = z.object({
  amount: z.string().refine(val => parseFloat(val) > 0, "Valor deve ser maior que 0"),
  saveDate: z.string().min(1, "Selecione a data"),
});

export type ExpenseFormData = z.infer<typeof expenseFormSchema>;
export type GoalFormData = z.infer<typeof goalFormSchema>;
export type StreakChallengeFormData = z.infer<typeof streakChallengeFormSchema>;
export type StreakEntryFormData = z.infer<typeof streakEntryFormSchema>;

// User types for Replit Auth
export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

// Relations
export const userRelations = relations(users, ({ many }) => ({
  expenses: many(expenses),
  budgets: many(budgets),
  goals: many(goals),
  savingsStreaks: many(savingsStreaks),
}));

export const expenseRelations = relations(expenses, ({ one }) => ({
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
}));

export const budgetRelations = relations(budgets, ({ one }) => ({
  user: one(users, {
    fields: [budgets.userId],
    references: [users.id],
  }),
}));

export const goalRelations = relations(goals, ({ one }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
}));

export const savingsStreakRelations = relations(savingsStreaks, ({ one, many }) => ({
  user: one(users, {
    fields: [savingsStreaks.userId],
    references: [users.id],
  }),
  entries: many(streakEntries),
}));

export const streakEntryRelations = relations(streakEntries, ({ one }) => ({
  streak: one(savingsStreaks, {
    fields: [streakEntries.streakId],
    references: [savingsStreaks.id],
  }),
}));
