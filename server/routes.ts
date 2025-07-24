import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDebtSchema, insertBudgetItemSchema, insertPaymentSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

// Simple session management
const sessions = new Map<string, { userId: number; username: string }>();

function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    const sessionId = req.headers.authorization?.replace("Bearer ", "");
    const session = sessionId ? sessions.get(sessionId) : null;
    
    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    req.user = session;
    next();
  };

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const sessionId = generateSessionId();
      sessions.set(sessionId, { userId: user.id, username: user.username });
      
      res.json({ 
        sessionId, 
        user: { id: user.id, username: user.username, fullName: user.fullName } 
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(userData);
      const sessionId = generateSessionId();
      sessions.set(sessionId, { userId: user.id, username: user.username });
      
      res.json({ 
        sessionId, 
        user: { id: user.id, username: user.username, fullName: user.fullName } 
      });
    } catch (error) {
      res.status(400).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/logout", requireAuth, (req: any, res) => {
    const sessionId = req.headers.authorization?.replace("Bearer ", "");
    if (sessionId) {
      sessions.delete(sessionId);
    }
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", requireAuth, async (req: any, res) => {
    const user = await storage.getUser(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ id: user.id, username: user.username, fullName: user.fullName });
  });

  // Debt routes
  app.get("/api/debts", requireAuth, async (req: any, res) => {
    try {
      const debts = await storage.getDebtsWithPayments(req.user.userId);
      res.json(debts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch debts" });
    }
  });

  app.post("/api/debts", requireAuth, async (req: any, res) => {
    try {
      const debtData = insertDebtSchema.parse(req.body);
      const debt = await storage.createDebt({ ...debtData, userId: req.user.userId });
      res.json(debt);
    } catch (error) {
      res.status(400).json({ message: "Failed to create debt" });
    }
  });

  app.put("/api/debts/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const debtData = insertDebtSchema.partial().parse(req.body);
      const debt = await storage.updateDebt(id, req.user.userId, debtData);
      
      if (!debt) {
        return res.status(404).json({ message: "Debt not found" });
      }
      
      res.json(debt);
    } catch (error) {
      res.status(400).json({ message: "Failed to update debt" });
    }
  });

  app.delete("/api/debts/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDebt(id, req.user.userId);
      
      if (!success) {
        return res.status(404).json({ message: "Debt not found" });
      }
      
      res.json({ message: "Debt deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete debt" });
    }
  });

  // Budget routes
  app.get("/api/budget", requireAuth, async (req: any, res) => {
    try {
      const budgetItems = await storage.getBudgetItems(req.user.userId);
      res.json(budgetItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch budget items" });
    }
  });

  app.post("/api/budget", requireAuth, async (req: any, res) => {
    try {
      const itemData = insertBudgetItemSchema.parse(req.body);
      const item = await storage.createBudgetItem({ ...itemData, userId: req.user.userId });
      res.json(item);
    } catch (error) {
      res.status(400).json({ message: "Failed to create budget item" });
    }
  });

  app.put("/api/budget/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const itemData = insertBudgetItemSchema.partial().parse(req.body);
      const item = await storage.updateBudgetItem(id, req.user.userId, itemData);
      
      if (!item) {
        return res.status(404).json({ message: "Budget item not found" });
      }
      
      res.json(item);
    } catch (error) {
      res.status(400).json({ message: "Failed to update budget item" });
    }
  });

  app.delete("/api/budget/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteBudgetItem(id, req.user.userId);
      
      if (!success) {
        return res.status(404).json({ message: "Budget item not found" });
      }
      
      res.json({ message: "Budget item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete budget item" });
    }
  });

  // Payment routes
  app.get("/api/payments", requireAuth, async (req: any, res) => {
    try {
      const payments = await storage.getPayments(req.user.userId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.get("/api/payments/debt/:debtId", requireAuth, async (req: any, res) => {
    try {
      const debtId = parseInt(req.params.debtId);
      const payments = await storage.getPaymentsByDebt(debtId, req.user.userId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments", requireAuth, async (req: any, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment({ ...paymentData, userId: req.user.userId });
      res.json(payment);
    } catch (error) {
      res.status(400).json({ message: "Failed to create payment" });
    }
  });

  app.delete("/api/payments/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePayment(id, req.user.userId);
      
      if (!success) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      res.json({ message: "Payment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete payment" });
    }
  });

  // Dashboard summary route
  app.get("/api/dashboard/summary", requireAuth, async (req: any, res) => {
    try {
      const debts = await storage.getDebtsWithPayments(req.user.userId);
      const budgetItems = await storage.getBudgetItems(req.user.userId);
      
      const totalDebt = debts.reduce((sum, debt) => sum + debt.remainingBalance, 0);
      const monthlyPayments = debts.reduce((sum, debt) => sum + parseFloat(debt.minimumPayment), 0);
      
      const income = budgetItems.filter(item => item.type === 'income');
      const expenses = budgetItems.filter(item => item.type === 'expense');
      
      const totalIncome = income.reduce((sum, item) => sum + parseFloat(item.amount), 0);
      const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
      const protectedAmount = expenses.filter(item => item.isProtected).reduce((sum, item) => sum + parseFloat(item.amount), 0);
      
      const availableForDebt = totalIncome - totalExpenses;
      
      res.json({
        totalDebt,
        monthlyPayments,
        totalIncome,
        totalExpenses,
        availableForDebt,
        protectedAmount,
        debtCount: debts.length,
        budgetHealth: totalIncome > 0 ? Math.round((availableForDebt / totalIncome) * 100) : 0
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard summary" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
