import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/auth";
import { formatPHP } from "@/lib/currency";
import { GlassCard } from "@/components/ui/glass-card";
import { GlossyButton } from "@/components/ui/glossy-button";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDebtSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, CreditCard, Trash2, Edit, TrendingUp } from "lucide-react";
import { z } from "zod";

const debtFormSchema = insertDebtSchema.extend({
  balance: z.number().positive("Balance must be positive"),
  interestRate: z.number().min(0, "Interest rate must be non-negative").max(100, "Interest rate cannot exceed 100%"),
  minimumPayment: z.number().positive("Minimum payment must be positive"),
});

type DebtFormData = z.infer<typeof debtFormSchema>;

export default function Debts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<any>(null);
  const { toast } = useToast();

  const { data: debts, isLoading } = useQuery({
    queryKey: ["/api/debts"],
    queryFn: async () => {
      const response = await fetch("/api/debts", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch debts");
      return response.json();
    },
  });

  const form = useForm<DebtFormData>({
    resolver: zodResolver(debtFormSchema),
    defaultValues: {
      name: "",
      balance: 0,
      interestRate: 0,
      minimumPayment: 0,
      dueDate: 1,
      debtType: "credit_card",
      paymentFrequency: "monthly",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: DebtFormData) => {
      const response = await apiRequest("POST", "/api/debts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/debts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Debt added successfully",
        description: "Your new debt has been added to your account",
      });
    },
    onError: () => {
      toast({
        title: "Failed to add debt",
        description: "Please check your input and try again",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<DebtFormData> }) => {
      const response = await apiRequest("PUT", `/api/debts/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/debts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      setIsDialogOpen(false);
      setEditingDebt(null);
      form.reset();
      toast({
        title: "Debt updated successfully",
        description: "Your debt information has been updated",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update debt",
        description: "Please check your input and try again",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/debts/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/debts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      toast({
        title: "Debt deleted successfully",
        description: "The debt has been removed from your account",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete debt",
        description: "Please try again later",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DebtFormData) => {
    if (editingDebt) {
      updateMutation.mutate({ id: editingDebt.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (debt: any) => {
    setEditingDebt(debt);
    form.reset({
      name: debt.name,
      balance: parseFloat(debt.balance),
      interestRate: parseFloat(debt.interestRate),
      minimumPayment: parseFloat(debt.minimumPayment),
      dueDate: debt.dueDate,
      debtType: debt.debtType,
      paymentFrequency: debt.paymentFrequency,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingDebt(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const getDebtPriorityClass = (interestRate: number) => {
    if (interestRate >= 25) return "debt-card-high";
    if (interestRate >= 10) return "debt-card-medium";
    return "debt-card-low";
  };

  const getDebtIcon = (type: string) => {
    switch (type) {
      case "credit_card": return "💳";
      case "auto_loan": return "🚗";
      case "mortgage": return "🏠";
      case "student_loan": return "🎓";
      case "personal_loan": return "👤";
      default: return "💰";
    }
  };

  const getDebtTypeName = (type: string) => {
    switch (type) {
      case "credit_card": return "Credit Card";
      case "auto_loan": return "Auto Loan";
      case "mortgage": return "Mortgage";
      case "student_loan": return "Student Loan";
      case "personal_loan": return "Personal Loan";
      case "medical_bill": return "Medical Bill";
      default: return "Other";
    }
  };

  const totalDebt = debts?.reduce((sum: number, debt: any) => sum + debt.remainingBalance, 0) || 0;
  const highestInterestDebt = debts?.reduce((highest: any, debt: any) => 
    !highest || parseFloat(debt.interestRate) > parseFloat(highest.interestRate) ? debt : highest, null);

  return (
    <div className="min-h-screen bg-black pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold glow-text mb-4">Debt Management</h1>
          <p className="text-gray-400 text-lg">
            Track, manage, and eliminate your debts with strategic planning
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GlassCard floating>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-medium">Total Debt</span>
              <TrendingUp className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-red-500 glow-text">
              {formatPHP(totalDebt)}
            </h3>
            <p className="text-xs text-gray-400 mt-2">
              Across {debts?.length || 0} accounts
            </p>
          </GlassCard>

          <GlassCard floating delay={0.2}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-medium">Highest Interest</span>
              <span className="text-lg">⚠️</span>
            </div>
            <h3 className="text-2xl font-bold text-orange-500">
              {highestInterestDebt ? `${highestInterestDebt.interestRate}%` : "0%"}
            </h3>
            <p className="text-xs text-gray-400 mt-2">
              {highestInterestDebt?.name || "No debts"}
            </p>
          </GlassCard>

          <GlassCard floating delay={0.4}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-medium">Monthly Minimum</span>
              <span className="text-lg">📅</span>
            </div>
            <h3 className="text-2xl font-bold text-white">
              {formatPHP(debts?.reduce((sum: number, debt: any) => sum + parseFloat(debt.minimumPayment), 0) || 0)}
            </h3>
            <p className="text-xs text-gray-400 mt-2">Required payments</p>
          </GlassCard>
        </div>

        {/* Debts List */}
        <GlassCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Your Debts</h2>
            <GlossyButton onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Debt
            </GlossyButton>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="glass-card p-4 animate-pulse">
                  <div className="h-20 bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : debts && debts.length > 0 ? (
            <div className="space-y-4">
              {debts.map((debt: any) => {
                const progress = debt.totalPaid / parseFloat(debt.balance) * 100;
                return (
                  <div key={debt.id} className={`glass-card p-4 ${getDebtPriorityClass(parseFloat(debt.interestRate))}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getDebtIcon(debt.debtType)}</span>
                        <div>
                          <h3 className="font-semibold text-white text-lg">{debt.name}</h3>
                          <p className="text-sm text-gray-400">
                            {getDebtTypeName(debt.debtType)} • {debt.interestRate}% APR • Due: {debt.dueDate}th
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(debt)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(debt.id)}
                          className="text-gray-400 hover:text-red-500"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-400">Remaining Balance</p>
                        <p className="font-bold text-red-500">{formatPHP(debt.remainingBalance)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Original Balance</p>
                        <p className="font-semibold text-white">{formatPHP(debt.balance)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Minimum Payment</p>
                        <p className="font-semibold text-orange-500">{formatPHP(debt.minimumPayment)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Total Paid</p>
                        <p className="font-semibold text-green-500">{formatPHP(debt.totalPaid)}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Progress to payoff</span>
                        <span className="text-orange-500">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-3" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No debts found</h3>
              <p className="text-gray-500 mb-6">Add your first debt to start managing your finances</p>
              <GlossyButton onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Debt
              </GlossyButton>
            </div>
          )}
        </GlassCard>

        {/* Floating Action Button */}
        <FloatingActionButton onClick={openCreateDialog} />

        {/* Add/Edit Debt Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="glass-card border-orange-500 border-opacity-30">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold glow-text">
                {editingDebt ? "Edit Debt" : "Add New Debt"}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Debt Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., BPI Credit Card" className="glossy-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="balance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Balance</FormLabel>
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
                    name="interestRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="glossy-input"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minimumPayment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Payment</FormLabel>
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
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date (Day of Month)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            max="31"
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            placeholder="15"
                            className="glossy-input"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="debtType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Debt Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="glossy-input">
                            <SelectValue placeholder="Select debt type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass-card border-orange-500 border-opacity-30">
                          <SelectItem value="credit_card">Credit Card</SelectItem>
                          <SelectItem value="auto_loan">Auto Loan</SelectItem>
                          <SelectItem value="mortgage">Mortgage</SelectItem>
                          <SelectItem value="student_loan">Student Loan</SelectItem>
                          <SelectItem value="personal_loan">Personal Loan</SelectItem>
                          <SelectItem value="medical_bill">Medical Bill</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                      : editingDebt
                      ? "Update Debt"
                      : "Add Debt"}
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
