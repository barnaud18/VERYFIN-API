import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertExpenseSchema, insertBudgetSchema, insertGoalSchema, insertSavingsStreakSchema, insertStreakEntrySchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Auth routes are handled in auth.ts

  // Expense routes
  app.get("/api/expenses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { category, startDate, endDate } = req.query;
      
      let expenses;
      if (category) {
        expenses = await storage.getExpensesByCategory(category as string, userId);
      } else if (startDate && endDate) {
        expenses = await storage.getExpensesByDateRange(startDate as string, endDate as string, userId);
      } else {
        expenses = await storage.getExpenses(userId);
      }
      
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.get("/api/expenses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const expense = await storage.getExpense(id, userId);
      
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expense" });
    }
  });

  app.post("/api/expenses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertExpenseSchema.parse({
        ...req.body,
        userId
      });
      const expense = await storage.createExpense(validatedData);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid expense data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.put("/api/expenses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const validatedData = insertExpenseSchema.partial().parse(req.body);
      
      const updatedExpense = await storage.updateExpense(id, validatedData, userId);
      
      if (!updatedExpense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      res.json(updatedExpense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid expense data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteExpense(id, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Budget routes
  app.get("/api/budgets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const budgets = await storage.getBudgets(userId);
      res.json(budgets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch budgets" });
    }
  });

  app.post("/api/budgets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertBudgetSchema.parse({
        ...req.body,
        userId
      });
      const budget = await storage.createBudget(validatedData);
      res.status(201).json(budget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid budget data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create budget" });
    }
  });

  app.put("/api/budgets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const validatedData = insertBudgetSchema.partial().parse(req.body);
      
      const updatedBudget = await storage.updateBudget(id, validatedData, userId);
      
      if (!updatedBudget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      res.json(updatedBudget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid budget data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update budget" });
    }
  });

  app.delete("/api/budgets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBudget(id, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete budget" });
    }
  });

  // Goal routes
  app.get("/api/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  app.get("/api/goals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const goal = await storage.getGoal(id, userId);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      res.json(goal);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goal" });
    }
  });

  app.post("/api/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertGoalSchema.parse({
        ...req.body,
        userId
      });
      const goal = await storage.createGoal(validatedData);
      res.status(201).json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid goal data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create goal" });
    }
  });

  app.put("/api/goals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const validatedData = insertGoalSchema.partial().parse(req.body);
      
      const updatedGoal = await storage.updateGoal(id, validatedData, userId);
      
      if (!updatedGoal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      res.json(updatedGoal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid goal data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update goal" });
    }
  });

  app.delete("/api/goals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteGoal(id, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete goal" });
    }
  });

  app.patch("/api/goals/:id/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const { amount } = req.body;
      
      if (typeof amount !== "number" || amount < 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      const updatedGoal = await storage.updateGoalProgress(id, amount, userId);
      
      if (!updatedGoal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      res.json(updatedGoal);
    } catch (error) {
      res.status(500).json({ message: "Failed to update goal progress" });
    }
  });

  // Savings streak routes
  app.get("/api/streaks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const streaks = await storage.getSavingsStreaks(userId);
      res.json(streaks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch savings streaks" });
    }
  });

  app.get("/api/streaks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const streak = await storage.getSavingsStreak(id, userId);
      
      if (!streak) {
        return res.status(404).json({ message: "Streak not found" });
      }
      
      res.json(streak);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch streak" });
    }
  });

  app.post("/api/streaks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertSavingsStreakSchema.parse({
        ...req.body,
        userId
      });
      const streak = await storage.createSavingsStreak(validatedData);
      res.status(201).json(streak);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid streak data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create streak" });
    }
  });

  app.post("/api/streaks/:id/entries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const streakId = parseInt(req.params.id);
      
      // Verify the streak belongs to the user
      const streak = await storage.getSavingsStreak(streakId, userId);
      if (!streak) {
        return res.status(404).json({ message: "Streak not found" });
      }

      const validatedData = insertStreakEntrySchema.parse({
        ...req.body,
        streakId
      });
      
      const entry = await storage.addStreakEntry(validatedData);
      
      // Update streak progress after adding entry
      await storage.updateStreakProgress(streakId, userId);
      
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid entry data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add streak entry" });
    }
  });

  app.get("/api/streaks/:id/entries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const streakId = parseInt(req.params.id);
      
      // Verify the streak belongs to the user
      const streak = await storage.getSavingsStreak(streakId, userId);
      if (!streak) {
        return res.status(404).json({ message: "Streak not found" });
      }

      const entries = await storage.getStreakEntries(streakId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch streak entries" });
    }
  });

  app.delete("/api/streaks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSavingsStreak(id, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Streak not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete streak" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}