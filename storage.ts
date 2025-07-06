import { 
  expenses, 
  budgets, 
  goals, 
  users,
  savingsStreaks,
  streakEntries,
  type Expense, 
  type InsertExpense, 
  type Budget, 
  type InsertBudget, 
  type Goal, 
  type InsertGoal,
  type User,
  type InsertUser,
  type UpsertUser,
  type SavingsStreak,
  type InsertSavingsStreak,
  type StreakEntry,
  type InsertStreakEntry
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations for email/password auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Expense operations
  getExpenses(userId: string): Promise<Expense[]>;
  getExpense(id: number, userId: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>, userId: string): Promise<Expense | undefined>;
  deleteExpense(id: number, userId: string): Promise<boolean>;
  getExpensesByCategory(category: string, userId: string): Promise<Expense[]>;
  getExpensesByDateRange(startDate: string, endDate: string, userId: string): Promise<Expense[]>;
  
  // Budget operations
  getBudgets(userId: string): Promise<Budget[]>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, budget: Partial<InsertBudget>, userId: string): Promise<Budget | undefined>;
  deleteBudget(id: number, userId: string): Promise<boolean>;
  
  // Goal operations
  getGoals(userId: string): Promise<Goal[]>;
  getGoal(id: number, userId: string): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<InsertGoal>, userId: string): Promise<Goal | undefined>;
  deleteGoal(id: number, userId: string): Promise<boolean>;
  updateGoalProgress(id: number, amount: number, userId: string): Promise<Goal | undefined>;
  
  // Savings streak operations
  getSavingsStreaks(userId: string): Promise<SavingsStreak[]>;
  getSavingsStreak(id: number, userId: string): Promise<SavingsStreak | undefined>;
  createSavingsStreak(streak: InsertSavingsStreak): Promise<SavingsStreak>;
  updateSavingsStreak(id: number, streak: Partial<InsertSavingsStreak>, userId: string): Promise<SavingsStreak | undefined>;
  deleteSavingsStreak(id: number, userId: string): Promise<boolean>;
  addStreakEntry(entry: InsertStreakEntry): Promise<StreakEntry>;
  getStreakEntries(streakId: number): Promise<StreakEntry[]>;
  updateStreakProgress(streakId: number, userId: string): Promise<SavingsStreak | undefined>;
}

export class MemStorage implements IStorage {
  private expenses: Map<number, Expense>;
  private budgets: Map<number, Budget>;
  private goals: Map<number, Goal>;
  private currentId: number;

  constructor() {
    this.expenses = new Map();
    this.budgets = new Map();
    this.goals = new Map();
    this.currentId = 1;
    
    // Adicionar despesas de exemplo para demonstração
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleExpenses = [
      {
        description: "Supermercado - Compras da semana",
        amount: "285.50",
        category: "food",
        date: "2025-01-01",
        isRecurring: null,
        dayOfMonth: null,
        endDate: null,
        dueDate: null,
      },
      {
        description: "Combustível",
        amount: "120.00",
        category: "transport",
        date: "2025-01-02",
        isRecurring: null,
        dayOfMonth: null,
        endDate: null,
        dueDate: null,
      },
      {
        description: "Conta de luz",
        amount: "98.75",
        category: "utilities",
        date: "2025-01-03",
        isRecurring: null,
        dayOfMonth: null,
        endDate: null,
        dueDate: null,
      },
      {
        description: "Cinema",
        amount: "45.00",
        category: "entertainment",
        date: "2025-01-04",
        isRecurring: null,
        dayOfMonth: null,
        endDate: null,
        dueDate: null,
      },
      {
        description: "Farmácia",
        amount: "67.30",
        category: "healthcare",
        date: "2025-01-05",
        isRecurring: null,
        dayOfMonth: null,
        endDate: null,
        dueDate: null,
      }
    ];

    sampleExpenses.forEach(expense => {
      const id = this.currentId++;
      const fullExpense: Expense = {
        ...expense,
        id,
        createdAt: new Date(),
      };
      this.expenses.set(id, fullExpense);
    });
  }

  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = this.currentId++;
    const expense: Expense = {
      ...insertExpense,
      id,
      createdAt: new Date(),
      isRecurring: insertExpense.isRecurring ?? null,
      dayOfMonth: insertExpense.dayOfMonth ?? null,
      endDate: insertExpense.endDate ?? null,
      dueDate: insertExpense.dueDate ?? null,
    };
    this.expenses.set(id, expense);
    return expense;
  }

  async updateExpense(id: number, updateData: Partial<InsertExpense>): Promise<Expense | undefined> {
    const existing = this.expenses.get(id);
    if (!existing) return undefined;
    
    const updated: Expense = { ...existing, ...updateData };
    this.expenses.set(id, updated);
    return updated;
  }

  async deleteExpense(id: number): Promise<boolean> {
    return this.expenses.delete(id);
  }

  async getExpensesByCategory(category: string): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .filter(expense => expense.category === category)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .filter(expense => expense.date >= startDate && expense.date <= endDate)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getBudgets(): Promise<Budget[]> {
    return Array.from(this.budgets.values());
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const id = this.currentId++;
    const budget: Budget = {
      ...insertBudget,
      id,
      createdAt: new Date(),
      period: insertBudget.period ?? "monthly",
    };
    this.budgets.set(id, budget);
    return budget;
  }

  async updateBudget(id: number, updateData: Partial<InsertBudget>): Promise<Budget | undefined> {
    const existing = this.budgets.get(id);
    if (!existing) return undefined;
    
    const updated: Budget = { ...existing, ...updateData };
    this.budgets.set(id, updated);
    return updated;
  }

  async deleteBudget(id: number): Promise<boolean> {
    return this.budgets.delete(id);
  }

  async getGoals(): Promise<Goal[]> {
    return Array.from(this.goals.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = this.currentId++;
    const goal: Goal = {
      ...insertGoal,
      id,
      status: insertGoal.status || "active",
      description: insertGoal.description ?? null,
      currentAmount: insertGoal.currentAmount ?? "0",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.goals.set(id, goal);
    return goal;
  }

  async updateGoal(id: number, updateData: Partial<InsertGoal>): Promise<Goal | undefined> {
    const existing = this.goals.get(id);
    if (!existing) return undefined;
    
    const updated: Goal = { ...existing, ...updateData, updatedAt: new Date() };
    this.goals.set(id, updated);
    return updated;
  }

  async deleteGoal(id: number): Promise<boolean> {
    return this.goals.delete(id);
  }

  async updateGoalProgress(id: number, amount: number): Promise<Goal | undefined> {
    const existing = this.goals.get(id);
    if (!existing) return undefined;
    
    const updated: Goal = { 
      ...existing, 
      currentAmount: amount.toString(),
      updatedAt: new Date()
    };
    this.goals.set(id, updated);
    return updated;
  }
}

// Database storage implementation

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Expense operations
  async getExpenses(userId: string): Promise<Expense[]> {
    return await db.select().from(expenses).where(eq(expenses.userId, userId));
  }

  async getExpense(id: number, userId: string): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(
      and(eq(expenses.id, id), eq(expenses.userId, userId))
    );
    return expense || undefined;
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db
      .insert(expenses)
      .values(expense)
      .returning();
    return newExpense;
  }

  async updateExpense(id: number, expense: Partial<InsertExpense>, userId: string): Promise<Expense | undefined> {
    const [updated] = await db
      .update(expenses)
      .set(expense)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteExpense(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(expenses).where(
      and(eq(expenses.id, id), eq(expenses.userId, userId))
    );
    return (result.rowCount || 0) > 0;
  }

  async getExpensesByCategory(category: string, userId: string): Promise<Expense[]> {
    return await db.select().from(expenses).where(
      and(eq(expenses.category, category), eq(expenses.userId, userId))
    );
  }

  async getExpensesByDateRange(startDate: string, endDate: string, userId: string): Promise<Expense[]> {
    return await db.select().from(expenses).where(
      and(
        gte(expenses.date, startDate),
        lte(expenses.date, endDate),
        eq(expenses.userId, userId)
      )
    );
  }

  async getBudgets(userId: string): Promise<Budget[]> {
    return await db.select().from(budgets).where(eq(budgets.userId, userId));
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const [newBudget] = await db
      .insert(budgets)
      .values(budget)
      .returning();
    return newBudget;
  }

  async updateBudget(id: number, budget: Partial<InsertBudget>, userId: string): Promise<Budget | undefined> {
    const [updated] = await db
      .update(budgets)
      .set(budget)
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteBudget(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(budgets).where(
      and(eq(budgets.id, id), eq(budgets.userId, userId))
    );
    return (result.rowCount || 0) > 0;
  }

  async getGoals(userId: string): Promise<Goal[]> {
    return await db.select().from(goals).where(eq(goals.userId, userId));
  }

  async getGoal(id: number, userId: string): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(
      and(eq(goals.id, id), eq(goals.userId, userId))
    );
    return goal || undefined;
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db
      .insert(goals)
      .values(goal)
      .returning();
    return newGoal;
  }

  async updateGoal(id: number, goal: Partial<InsertGoal>, userId: string): Promise<Goal | undefined> {
    const [updated] = await db
      .update(goals)
      .set({...goal, updatedAt: new Date()})
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteGoal(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(goals).where(
      and(eq(goals.id, id), eq(goals.userId, userId))
    );
    return (result.rowCount || 0) > 0;
  }

  async updateGoalProgress(id: number, amount: number, userId: string): Promise<Goal | undefined> {
    const [updated] = await db
      .update(goals)
      .set({
        currentAmount: amount.toString(),
        updatedAt: new Date()
      })
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))
      .returning();
    return updated || undefined;
  }

  // Savings streak operations
  async getSavingsStreaks(userId: string): Promise<SavingsStreak[]> {
    return await db.select().from(savingsStreaks).where(eq(savingsStreaks.userId, userId));
  }

  async getSavingsStreak(id: number, userId: string): Promise<SavingsStreak | undefined> {
    const [streak] = await db.select().from(savingsStreaks).where(
      and(eq(savingsStreaks.id, id), eq(savingsStreaks.userId, userId))
    );
    return streak || undefined;
  }

  async createSavingsStreak(streak: InsertSavingsStreak): Promise<SavingsStreak> {
    const [newStreak] = await db
      .insert(savingsStreaks)
      .values(streak)
      .returning();
    return newStreak;
  }

  async updateSavingsStreak(id: number, streak: Partial<InsertSavingsStreak>, userId: string): Promise<SavingsStreak | undefined> {
    const [updated] = await db
      .update(savingsStreaks)
      .set({ ...streak, updatedAt: new Date() })
      .where(and(eq(savingsStreaks.id, id), eq(savingsStreaks.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteSavingsStreak(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(savingsStreaks).where(
      and(eq(savingsStreaks.id, id), eq(savingsStreaks.userId, userId))
    );
    return (result.rowCount || 0) > 0;
  }

  async addStreakEntry(entry: InsertStreakEntry): Promise<StreakEntry> {
    const [newEntry] = await db
      .insert(streakEntries)
      .values(entry)
      .returning();
    return newEntry;
  }

  async getStreakEntries(streakId: number): Promise<StreakEntry[]> {
    return await db.select().from(streakEntries).where(eq(streakEntries.streakId, streakId));
  }

  async updateStreakProgress(streakId: number, userId: string): Promise<SavingsStreak | undefined> {
    // Get the streak first to calculate new values
    const streak = await this.getSavingsStreak(streakId, userId);
    if (!streak) return undefined;

    // Get all entries for this streak to calculate totals and streaks
    const entries = await this.getStreakEntries(streakId);
    const totalSaved = entries.reduce((sum, entry) => sum + parseFloat(entry.amount), 0);
    
    // Calculate current streak based on frequency
    let currentStreak = 0;
    const sortedEntries = entries.sort((a, b) => new Date(b.saveDate).getTime() - new Date(a.saveDate).getTime());
    
    if (sortedEntries.length > 0) {
      const today = new Date();
      let checkDate = new Date(today);
      
      for (const entry of sortedEntries) {
        const entryDate = new Date(entry.saveDate);
        
        // Check if entry matches expected date based on frequency
        const daysDiff = Math.floor((checkDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
        
        let expectedGap = 1; // daily
        if (streak.frequency === 'weekly') expectedGap = 7;
        if (streak.frequency === 'monthly') expectedGap = 30;
        
        if (daysDiff <= expectedGap) {
          currentStreak++;
          checkDate = new Date(entryDate);
          checkDate.setDate(checkDate.getDate() - expectedGap);
        } else {
          break;
        }
      }
    }

    const longestStreak = Math.max(currentStreak, streak.longestStreak);
    const lastSaveDate = sortedEntries.length > 0 ? sortedEntries[0].saveDate : null;

    const [updated] = await db
      .update(savingsStreaks)
      .set({
        currentStreak,
        longestStreak,
        totalSaved: totalSaved.toString(),
        lastSaveDate,
        updatedAt: new Date()
      })
      .where(and(eq(savingsStreaks.id, streakId), eq(savingsStreaks.userId, userId)))
      .returning();
    
    return updated || undefined;
  }
}

export const storage = new DatabaseStorage();
