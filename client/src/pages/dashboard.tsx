import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/auth";
import { formatPHP } from "@/lib/currency";
import { GlassCard } from "@/components/ui/glass-card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Shield, Target, CreditCard, Calendar, DollarSign } from "lucide-react";

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["/api/dashboard/summary"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/summary", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch summary");
      return response.json();
    },
  });

  const { data: debts, isLoading: debtsLoading } = useQuery({
    queryKey: ["/api/debts"],
    queryFn: async () => {
      const response = await fetch("/api/debts", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch debts");
      return response.json();
    },
  });

  const { data: upcomingPayments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/payments"],
    queryFn: async () => {
      const response = await fetch("/api/payments", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch payments");
      return response.json();
    },
  });

  if (summaryLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 glass-card" />
          ))}
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-bold mb-4">
            Financial Freedom
            <span className="glow-text block">Starts Here</span>
          </h2>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
            Take control of your debts, protect your food budget, and plan your financial future with our premium debt management platform.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <GlassCard floating delay={0}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-medium">Total Debt</span>
              <div className="w-8 h-8 rounded-lg bg-red-500 bg-opacity-20 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-bold text-red-500 glow-text">
                {formatPHP(summary?.totalDebt || 0)}
              </h3>
              <p className="text-xs text-gray-400">
                Across {summary?.debtCount || 0} accounts
              </p>
            </div>
          </GlassCard>

          <GlassCard floating delay={0.2}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-medium">Monthly Payments</span>
              <div className="w-8 h-8 rounded-lg bg-orange-500 bg-opacity-20 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-orange-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-bold text-orange-500">
                {formatPHP(summary?.monthlyPayments || 0)}
              </h3>
              <p className="text-xs text-gray-400">Next payment in 5 days</p>
            </div>
          </GlassCard>

          <GlassCard floating delay={0.4}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-medium">Budget Health</span>
              <div className="w-8 h-8 rounded-lg bg-green-500 bg-opacity-20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-green-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-bold text-green-500">
                {summary?.budgetHealth || 0}%
              </h3>
              <p className="text-xs text-gray-400">Food budget protected</p>
            </div>
          </GlassCard>

          <GlassCard floating delay={0.6}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-medium">Available for Debt</span>
              <div className="w-8 h-8 rounded-lg bg-orange-500 bg-opacity-20 flex items-center justify-center">
                <Target className="w-4 h-4 text-orange-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-bold text-white">
                {formatPHP(summary?.availableForDebt || 0)}
              </h3>
              <p className="text-xs text-gray-400">After expenses</p>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Debt Overview */}
          <div className="lg:col-span-2 space-y-8">
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Active Debts</h3>
                <button className="glossy-button px-4 py-2 rounded-xl text-white font-semibold text-sm">
                  Add Debt
                </button>
              </div>
              
              {debtsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 glass-card" />
                  ))}
                </div>
              ) : debts && debts.length > 0 ? (
                <div className="space-y-4">
                  {debts.map((debt: any) => {
                    const progress = debt.totalPaid / parseFloat(debt.balance) * 100;
                    return (
                      <GlassCard 
                        key={debt.id} 
                        className={`${getDebtPriorityClass(parseFloat(debt.interestRate))}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">{getDebtIcon(debt.debtType)}</span>
                              <div>
                                <h4 className="font-semibold text-white">{debt.name}</h4>
                                <p className="text-sm text-gray-400">
                                  {debt.interestRate}% APR • Due: {debt.dueDate}th
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-red-500">
                              {formatPHP(debt.remainingBalance)}
                            </p>
                            <p className="text-sm text-gray-400">
                              Min: {formatPHP(debt.minimumPayment)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">Progress to payoff</span>
                            <span className="text-orange-500">{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No debts found. Add your first debt to get started.</p>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <GlassCard>
              <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 rounded-xl bg-orange-500 bg-opacity-10 border border-orange-500 border-opacity-30 hover:bg-opacity-20 transition-all">
                  <span className="text-orange-500 font-semibold">Make Payment</span>
                  <span className="text-orange-500">→</span>
                </button>
                <button className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-800 bg-opacity-50 hover:bg-opacity-70 transition-all">
                  <span className="text-white font-semibold">Update Budget</span>
                  <span className="text-gray-400">→</span>
                </button>
                <button className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-800 bg-opacity-50 hover:bg-opacity-70 transition-all">
                  <span className="text-white font-semibold">View Reports</span>
                  <span className="text-gray-400">→</span>
                </button>
              </div>
            </GlassCard>

            {/* Budget Summary */}
            <GlassCard>
              <h3 className="text-xl font-bold mb-4">Budget Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Monthly Income</span>
                  <span className="text-green-500 font-semibold">
                    {formatPHP(summary?.totalIncome || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Monthly Expenses</span>
                  <span className="text-red-500 font-semibold">
                    {formatPHP(summary?.totalExpenses || 0)}
                  </span>
                </div>
                <div className="protected-budget p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-green-500 font-semibold flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      Protected Budget
                    </span>
                    <span className="text-green-500 font-bold">
                      {formatPHP(summary?.protectedAmount || 0)}
                    </span>
                  </div>
                </div>
                <div className="border-t border-orange-500 border-opacity-30 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-orange-500 font-semibold">Available for Debt</span>
                    <span className="text-orange-500 font-bold text-lg">
                      {formatPHP(summary?.availableForDebt || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>
    </div>
  );
}
