import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/auth";
import { formatPHP } from "@/lib/currency";
import { GlassCard } from "@/components/ui/glass-card";
import { GlossyButton } from "@/components/ui/glossy-button";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBudgetItemSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, PieChart, TrendingUp, TrendingDown, Shield, Trash2, Edit } from "lucide-react";
import { z } from "zod";

const budgetFormSchema = insertBudgetItemSchema.extend({
  amount: z.number().positive("Amount must be positive"),
});

type BudgetFormData = z.infer<typeof budgetFormSchema>;

export default function Budget() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const { toast } = useToast();

  const { data: budgetItems, isLoading } = useQuery({
    queryKey: ["/api/budget"],
    queryFn: async () => {
      const response = await fetch("/api/budget", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch budget items");
      return response.json();
    },
  });

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      name: "",
      amount: 0,
      category: "",
      type: "expense",
      isEssential: false,
      isFixed: false,
      isProtected: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: BudgetFormData) => {
      const response = await apiRequest("POST", "/api/budget", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Budget item added successfully",
        description: "Your budget has been updated",
      });
    },
    onError: () => {
      toast({
        title: "Failed to add budget item",
        description: "Please check your input and try again",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BudgetFormData> }) => {
      const response = await apiRequest("PUT", `/api/budget/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset();
      toast({
        title: "Budget item updated successfully",
        description: "Your budget has been updated",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update budget item",
        description: "Please check your input and try again",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/budget/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      toast({
        title: "Budget item deleted successfully",
        description: "The item has been removed from your budget",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete budget item",
        description: "Please try again later",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BudgetFormData) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    form.reset({
      name: item.name,
      amount: parseFloat(item.amount),
      category: item.category,
      type: item.type,
      isEssential: item.isEssential,
      isFixed: item.isFixed,
      isProtected: item.isProtected,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const income = budgetItems?.filter((item: any) => item.type === 'income') || [];
  const expenses = budgetItems?.filter((item: any) => item.type === 'expense') || [];
  
  const totalIncome = income.reduce((sum: number, item: any) => sum + parseFloat(item.amount), 0);
  const totalExpenses = expenses.reduce((sum: number, item: any) => sum + parseFloat(item.amount), 0);
  const protectedAmount = expenses.filter((item: any) => item.isProtected).reduce((sum: number, item: any) => sum + parseFloat(item.amount), 0);
  const availableForDebt = totalIncome - totalExpenses;

  const getItemIcon = (category: string, type: string) => {
    if (type === 'income') return "💰";
    switch (category.toLowerCase()) {
      case "food": return "🍽️";
      case "housing": return "🏠";
      case "transportation": return "🚗";
      case "utilities": return "⚡";
      case "healthcare": return "🏥";
      case "entertainment": return "🎬";
      case "education": return "📚";
      default: return "📊";
    }
  };

  return (
    <div className="min-h-screen bg-black pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold glow-text mb-4">Budget Planner</h1>
          <p className="text-gray-400 text-lg">
            Manage your income and expenses with protected food budget priority
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <GlassCard floating>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-medium">Monthly Income</span>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-green-500">
              {formatPHP(totalIncome)}
            </h3>
            <p className="text-xs text-gray-400 mt-2">
              {income.length} sources
            </p>
          </GlassCard>

          <GlassCard floating delay={0.2}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-medium">Monthly Expenses</span>
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-red-500">
              {formatPHP(totalExpenses)}
            </h3>
            <p className="text-xs text-gray-400 mt-2">
              {expenses.length} categories
            </p>
          </GlassCard>

          <GlassCard floating delay={0.4}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-medium">Protected Budget</span>
              <Shield className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-green-500">
              {formatPHP(protectedAmount)}
            </h3>
            <p className="text-xs text-gray-400 mt-2">
              Food & essentials
            </p>
          </GlassCard>

          <GlassCard floating delay={0.6}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-medium">Available for Debt</span>
              <PieChart className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-2xl font-bold text-orange-500">
              {formatPHP(availableForDebt)}
            </h3>
            <p className="text-xs text-gray-400 mt-2">
              After all expenses
            </p>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Income Section */}
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-green-500">Income Sources</h2>
              <GlossyButton onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Income
              </GlossyButton>
            </div>

            {income.length > 0 ? (
              <div className="space-y-3">
                {income.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getItemIcon(item.category, item.type)}</span>
                      <div>
                        <h4 className="font-semibold text-white">{item.name}</h4>
                        <p className="text-sm text-gray-400">{item.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-green-500">{formatPHP(item.amount)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                        className="text-gray-400 hover:text-white"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(item.id)}
                        className="text-gray-400 hover:text-red-500"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="border-t border-green-500 border-opacity-30 pt-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-green-500 font-semibold">Total Income</span>
                    <span className="text-green-500 font-bold text-lg">{formatPHP(totalIncome)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No income sources added yet</p>
              </div>
            )}
          </GlassCard>

          {/* Expenses Section */}
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-red-500">Monthly Expenses</h2>
              <GlossyButton onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </GlossyButton>
            </div>

            {expenses.length > 0 ? (
              <div className="space-y-3">
                {expenses.map((item: any) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      item.isProtected
                        ? "protected-budget"
                        : "bg-gray-800 bg-opacity-50 border-gray-700"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getItemIcon(item.category, item.type)}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-white">{item.name}</h4>
                          {item.isProtected && (
                            <Shield className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          {item.category}
                          {item.isEssential && " • Essential"}
                          {item.isFixed && " • Fixed"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold ${item.isProtected ? "text-green-500" : "text-red-500"}`}>
                        {formatPHP(item.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                        className="text-gray-400 hover:text-white"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(item.id)}
                        className="text-gray-400 hover:text-red-500"
                        disabled={deleteMutation.isPending || item.isProtected}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="border-t border-orange-500 border-opacity-30 pt-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-orange-500 font-semibold">Available for Debt</span>
                    <span className="text-orange-500 font-bold text-lg">{formatPHP(availableForDebt)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingDown className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No expenses added yet</p>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Floating Action Button */}
        <FloatingActionButton onClick={openCreateDialog} />

        {/* Add/Edit Budget Item Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="glass-card border-orange-500 border-opacity-30">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold glow-text">
                {editingItem ? "Edit Budget Item" : "Add Budget Item"}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="glossy-input">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass-card border-orange-500 border-opacity-30">
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Salary, Food, Rent" className="glossy-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <CurrencyInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="₱0.00"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Food, Housing" className="glossy-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch("type") === "expense" && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="isEssential"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Essential Expense</FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isFixed"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Fixed Amount</FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isProtected"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel className="flex items-center space-x-2">
                            <Shield className="w-4 h-4 text-green-500" />
                            <span>Protected Budget (Food Priority)</span>
                          </FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <GlossyButton
                    type="submit"
                    className="flex-1"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Saving..."
                      : editingItem
                      ? "Update Item"
                      : "Add Item"}
                  </GlossyButton>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
