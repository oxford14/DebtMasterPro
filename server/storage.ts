import { users, debts, budgetItems, payments, type User, type InsertUser, type Debt, type InsertDebt, type BudgetItem, type InsertBudgetItem, type Payment, type InsertPayment, type DebtWithPayments } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Debt methods
  getDebts(userId: number): Promise<Debt[]>;
  getDebt(id: number, userId: number): Promise<Debt | undefined>;
  createDebt(debt: InsertDebt & { userId: number }): Promise<Debt>;
  updateDebt(id: number, userId: number, debt: Partial<InsertDebt>): Promise<Debt | undefined>;
  deleteDebt(id: number, userId: number): Promise<boolean>;
  getDebtsWithPayments(userId: number): Promise<DebtWithPayments[]>;

  // Budget methods
  getBudgetItems(userId: number): Promise<BudgetItem[]>;
  getBudgetItem(id: number, userId: number): Promise<BudgetItem | undefined>;
  createBudgetItem(item: InsertBudgetItem & { userId: number }): Promise<BudgetItem>;
  updateBudgetItem(id: number, userId: number, item: Partial<InsertBudgetItem>): Promise<BudgetItem | undefined>;
  deleteBudgetItem(id: number, userId: number): Promise<boolean>;

  // Payment methods
  getPayments(userId: number): Promise<Payment[]>;
  getPaymentsByDebt(debtId: number, userId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment & { userId: number }): Promise<Payment>;
  deletePayment(id: number, userId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private debts: Map<number, Debt> = new Map();
  private budgetItems: Map<number, BudgetItem> = new Map();
  private payments: Map<number, Payment> = new Map();
  private currentUserId = 1;
  private currentDebtId = 1;
  private currentBudgetItemId = 1;
  private currentPaymentId = 1;

  constructor() {
    // Initialize with demo user
    this.createUser({
      username: "juan",
      password: "password123",
      fullName: "Juan dela Cruz"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  // Debt methods
  async getDebts(userId: number): Promise<Debt[]> {
    return Array.from(this.debts.values()).filter(debt => debt.userId === userId);
  }

  async getDebt(id: number, userId: number): Promise<Debt | undefined> {
    const debt = this.debts.get(id);
    return debt && debt.userId === userId ? debt : undefined;
  }

  async createDebt(debt: InsertDebt & { userId: number }): Promise<Debt> {
    const id = this.currentDebtId++;
    const newDebt: Debt = {
      ...debt,
      id,
      balance: debt.balance.toString(),
      interestRate: debt.interestRate?.toString() ?? "0",
      minimumPayment: debt.minimumPayment?.toString() ?? "0",
      dueDate: debt.dueDate || null,
      paymentFrequency: debt.paymentFrequency || "none",
      creditorName: debt.creditorName || null,
      hasMonthlyPayments: debt.hasMonthlyPayments || false,
      notes: debt.notes || null,
      createdAt: new Date(),
    };
    this.debts.set(id, newDebt);
    return newDebt;
  }

  async updateDebt(id: number, userId: number, debt: Partial<InsertDebt>): Promise<Debt | undefined> {
    const existing = this.debts.get(id);
    if (!existing || existing.userId !== userId) return undefined;

    const updated: Debt = {
      ...existing,
      ...debt,
      balance: debt.balance?.toString() ?? existing.balance,
      interestRate: debt.interestRate?.toString() ?? existing.interestRate,
      minimumPayment: debt.minimumPayment?.toString() ?? existing.minimumPayment,
    };
    this.debts.set(id, updated);
    return updated;
  }

  async deleteDebt(id: number, userId: number): Promise<boolean> {
    const debt = this.debts.get(id);
    if (!debt || debt.userId !== userId) return false;
    
    // Delete associated payments
    Array.from(this.payments.entries())
      .filter(([_, payment]) => payment.debtId === id && payment.userId === userId)
      .forEach(([paymentId]) => this.payments.delete(paymentId));
    
    return this.debts.delete(id);
  }

  async getDebtsWithPayments(userId: number): Promise<DebtWithPayments[]> {
    const userDebts = await this.getDebts(userId);
    return userDebts.map(debt => {
      const debtPayments = Array.from(this.payments.values())
        .filter(payment => payment.debtId === debt.id && payment.userId === userId);
      
      const totalPaid = debtPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      const remainingBalance = parseFloat(debt.balance) - totalPaid;
      
      return {
        ...debt,
        payments: debtPayments,
        totalPaid,
        remainingBalance: Math.max(0, remainingBalance),
      };
    });
  }

  // Budget methods
  async getBudgetItems(userId: number): Promise<BudgetItem[]> {
    return Array.from(this.budgetItems.values()).filter(item => item.userId === userId);
  }

  async getBudgetItem(id: number, userId: number): Promise<BudgetItem | undefined> {
    const item = this.budgetItems.get(id);
    return item && item.userId === userId ? item : undefined;
  }

  async createBudgetItem(item: InsertBudgetItem & { userId: number }): Promise<BudgetItem> {
    const id = this.currentBudgetItemId++;
    const newItem: BudgetItem = {
      ...item,
      id,
      amount: item.amount.toString(),
      isEssential: item.isEssential || false,
      isFixed: item.isFixed || false,
      isProtected: item.isProtected || false,
      createdAt: new Date(),
    };
    this.budgetItems.set(id, newItem);
    return newItem;
  }

  async updateBudgetItem(id: number, userId: number, item: Partial<InsertBudgetItem>): Promise<BudgetItem | undefined> {
    const existing = this.budgetItems.get(id);
    if (!existing || existing.userId !== userId) return undefined;

    const updated: BudgetItem = {
      ...existing,
      ...item,
      amount: item.amount?.toString() ?? existing.amount,
    };
    this.budgetItems.set(id, updated);
    return updated;
  }

  async deleteBudgetItem(id: number, userId: number): Promise<boolean> {
    const item = this.budgetItems.get(id);
    if (!item || item.userId !== userId) return false;
    return this.budgetItems.delete(id);
  }

  // Payment methods
  async getPayments(userId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(payment => payment.userId === userId);
  }

  async getPaymentsByDebt(debtId: number, userId: number): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter(payment => payment.debtId === debtId && payment.userId === userId);
  }

  async createPayment(payment: InsertPayment & { userId: number }): Promise<Payment> {
    const id = this.currentPaymentId++;
    const newPayment: Payment = {
      ...payment,
      id,
      amount: payment.amount.toString(),
      paymentDate: new Date(payment.paymentDate),
      createdAt: new Date(),
    };
    this.payments.set(id, newPayment);
    return newPayment;
  }

  async deletePayment(id: number, userId: number): Promise<boolean> {
    const payment = this.payments.get(id);
    if (!payment || payment.userId !== userId) return false;
    return this.payments.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Debt methods
  async getDebts(userId: number): Promise<Debt[]> {
    return await db.select().from(debts).where(eq(debts.userId, userId));
  }

  async getDebt(id: number, userId: number): Promise<Debt | undefined> {
    const [debt] = await db.select().from(debts).where(eq(debts.id, id));
    return debt && debt.userId === userId ? debt : undefined;
  }

  async createDebt(debt: InsertDebt & { userId: number }): Promise<Debt> {
    const [newDebt] = await db
      .insert(debts)
      .values({
        ...debt,
        balance: debt.balance.toString(),
        interestRate: debt.interestRate?.toString() ?? "0",
        minimumPayment: debt.minimumPayment?.toString() ?? "0",
      })
      .returning();
    return newDebt;
  }

  async updateDebt(id: number, userId: number, debt: Partial<InsertDebt>): Promise<Debt | undefined> {
    const [updated] = await db
      .update(debts)
      .set({
        ...debt,
        balance: debt.balance?.toString(),
        interestRate: debt.interestRate?.toString(),
        minimumPayment: debt.minimumPayment?.toString(),
      })
      .where(eq(debts.id, id))
      .returning();
    return updated && updated.userId === userId ? updated : undefined;
  }

  async deleteDebt(id: number, userId: number): Promise<boolean> {
    // First delete associated payments
    await db.delete(payments).where(eq(payments.debtId, id));
    
    const result = await db.delete(debts).where(eq(debts.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getDebtsWithPayments(userId: number): Promise<DebtWithPayments[]> {
    const userDebts = await this.getDebts(userId);
    const result: DebtWithPayments[] = [];
    
    for (const debt of userDebts) {
      const debtPayments = await this.getPaymentsByDebt(debt.id, userId);
      const totalPaid = debtPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      const remainingBalance = parseFloat(debt.balance) - totalPaid;
      
      result.push({
        ...debt,
        payments: debtPayments,
        totalPaid,
        remainingBalance,
      });
    }
    
    return result;
  }

  // Budget methods
  async getBudgetItems(userId: number): Promise<BudgetItem[]> {
    return await db.select().from(budgetItems).where(eq(budgetItems.userId, userId));
  }

  async getBudgetItem(id: number, userId: number): Promise<BudgetItem | undefined> {
    const [item] = await db.select().from(budgetItems).where(eq(budgetItems.id, id));
    return item && item.userId === userId ? item : undefined;
  }

  async createBudgetItem(item: InsertBudgetItem & { userId: number }): Promise<BudgetItem> {
    const [newItem] = await db
      .insert(budgetItems)
      .values({
        ...item,
        amount: item.amount.toString(),
      })
      .returning();
    return newItem;
  }

  async updateBudgetItem(id: number, userId: number, item: Partial<InsertBudgetItem>): Promise<BudgetItem | undefined> {
    const [updated] = await db
      .update(budgetItems)
      .set({
        ...item,
        amount: item.amount?.toString(),
      })
      .where(eq(budgetItems.id, id))
      .returning();
    return updated && updated.userId === userId ? updated : undefined;
  }

  async deleteBudgetItem(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(budgetItems).where(eq(budgetItems.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Payment methods
  async getPayments(userId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.userId, userId));
  }

  async getPaymentsByDebt(debtId: number, userId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.debtId, debtId));
  }

  async createPayment(payment: InsertPayment & { userId: number }): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values({
        ...payment,
        amount: payment.amount.toString(),
      })
      .returning();
    return newPayment;
  }

  async deletePayment(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(payments).where(eq(payments.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export const storage = new DatabaseStorage();
