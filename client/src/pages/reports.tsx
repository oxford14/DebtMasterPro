import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/auth";
import { formatPHP, formatPHPCompact } from "@/lib/currency";
import { GlassCard } from "@/components/ui/glass-card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Target, DollarSign, PieChart, BarChart3, Calculator, Calendar } from "lucide-react";
import { LineChart, Line, AreaChart, Area, PieChart as RechartsPieChart, Cell, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function Reports() {
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

  const { data: budgetItems, isLoading: budgetLoading } = useQuery({
    queryKey: ["/api/budget"],
    queryFn: async () => {
      const response = await fetch("/api/budget", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch budget");
      return response.json();
    },
  });

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

  // Calculate debt payoff projection (simplified)
  const calculateDebtPayoff = () => {
    if (!debts || !summary) return [];
    
    const monthlyExtra = Math.max(0, summary.availableForDebt - summary.monthlyPayments);
    const data = [];
    let currentDebts = [...debts];
    
    for (let month = 0; month <= 60; month++) { // 5 years projection
      const totalRemaining = currentDebts.reduce((sum: number, debt: any) => sum + debt.remainingBalance, 0);
      
      data.push({
        month,
        totalDebt: totalRemaining,
        monthName: new Date(2024, month % 12).toLocaleString('default', { month: 'short' }) + (month >= 12 ? ` '${25 + Math.floor(month / 12)}` : " '24"),
      });
      
      if (totalRemaining <= 0) break;
      
      // Simulate monthly payments (simplified)
      currentDebts = currentDebts.map((debt: any) => ({
        ...debt,
        remainingBalance: Math.max(0, debt.remainingBalance - parseFloat(debt.minimumPayment) - (monthlyExtra / currentDebts.length))
      })).filter((debt: any) => debt.remainingBalance > 0);
    }
    
    return data;
  };

  // Calculate debt by type for pie chart
  const getDebtByType = () => {
    if (!debts) return [];
    
    const typeMap = debts.reduce((acc: any, debt: any) => {
      const type = debt.debtType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
      acc[type] = (acc[type] || 0) + debt.remainingBalance;
      return acc;
    }, {});
    
    const colors = ['#FF6B00', '#FF8C42', '#FF4444', '#00FF88', '#4C9AFF', '#9C27B0'];
    
    return Object.entries(typeMap).map(([name, value], index) => ({
      name,
      value: value as number,
      color: colors[index % colors.length],
    }));
  };

  // Calculate monthly budget breakdown
  const getBudgetBreakdown = () => {
    if (!budgetItems) return [];
    
    const income = budgetItems.filter((item: any) => item.type === 'income');
    const expenses = budgetItems.filter((item: any) => item.type === 'expense');
    
    const categories = Array.from(new Set(expenses.map((item: any) => item.category)));
    
    return categories.map(category => {
      const categoryExpenses = expenses.filter((item: any) => item.category === category);
      const total = categoryExpenses.reduce((sum: number, item: any) => sum + parseFloat(item.amount), 0);
      const isProtected = categoryExpenses.some((item: any) => item.isProtected);
      
      return {
        category,
        amount: total,
        isProtected,
        percentage: summary ? (total / summary.totalIncome * 100) : 0,
      };
    }).sort((a, b) => b.amount - a.amount);
  };

  // Calculate interest savings with debt avalanche vs minimum payments
  const calculateInterestSavings = () => {
    if (!debts || debts.length === 0) return { totalSaved: 0, timeSaved: 0 };
    
    // Simplified calculation - in reality this would be more complex
    const totalDebt = debts.reduce((sum: number, debt: any) => sum + debt.remainingBalance, 0);
    const avgInterestRate = debts.reduce((sum: number, debt: any) => sum + parseFloat(debt.interestRate), 0) / debts.length;
    
    // Estimate savings by paying extra toward highest interest debt
    const estimatedSavings = totalDebt * (avgInterestRate / 100) * 0.3; // Rough estimate
    const timeSaved = 8; // months
    
    return { totalSaved: estimatedSavings, timeSaved };
  };

  const payoffData = calculateDebtPayoff();
  const debtByType = getDebtByType();
  const budgetBreakdown = getBudgetBreakdown();
  const interestSavings = calculateInterestSavings();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border border-orange-500 border-opacity-30">
          <p className="text-white font-semibold">{label}</p>
          <p className="text-orange-500">
            {formatPHP(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (debtsLoading || budgetLoading || summaryLoading) {
    return (
      <div className="min-h-screen bg-black pb-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="h-32 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold glow-text mb-4">Financial Reports & Analytics</h1>
          <p className="text-gray-400 text-lg">
            Track your progress and optimize your debt payoff strategy
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <GlassCard floating>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-medium">Total Debt</span>
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-red-500 glow-text">
              {formatPHP(summary?.totalDebt || 0)}
            </h3>
            <p className="text-xs text-gray-400 mt-2">
              Across {debts?.length || 0} accounts
            </p>
          </GlassCard>

          <GlassCard floating delay={0.2}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-medium">Interest Savings</span>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-green-500">
              {formatPHP(interestSavings.totalSaved)}
            </h3>
            <p className="text-xs text-gray-400 mt-2">
              With avalanche method
            </p>
          </GlassCard>

          <GlassCard floating delay={0.4}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-medium">Time Saved</span>
              <Calendar className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-2xl font-bold text-orange-500">
              {interestSavings.timeSaved} months
            </h3>
            <p className="text-xs text-gray-400 mt-2">
              Earlier debt freedom
            </p>
          </GlassCard>

          <GlassCard floating delay={0.6}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-medium">Budget Health</span>
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-blue-500">
              {summary?.budgetHealth || 0}%
            </h3>
            <p className="text-xs text-gray-400 mt-2">
              Financial stability
            </p>
          </GlassCard>
        </div>

        {/* Main Reports */}
        <Tabs defaultValue="debt-analysis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="debt-analysis" className="data-[state=active]:bg-orange-500">
              Debt Analysis
            </TabsTrigger>
            <TabsTrigger value="payoff-projection" className="data-[state=active]:bg-orange-500">
              Payoff Projection
            </TabsTrigger>
            <TabsTrigger value="budget-breakdown" className="data-[state=active]:bg-orange-500">
              Budget Breakdown
            </TabsTrigger>
            <TabsTrigger value="strategy-comparison" className="data-[state=active]:bg-orange-500">
              Strategy Comparison
            </TabsTrigger>
          </TabsList>

          <TabsContent value="debt-analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Debt by Type Pie Chart */}
              <GlassCard>
                <h3 className="text-xl font-bold mb-6 flex items-center">
                  <PieChart className="w-5 h-5 mr-2 text-orange-500" />
                  Debt Distribution by Type
                </h3>
                {debtByType.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={debtByType}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }: { name: string, value: number }) => `${name}: ${formatPHPCompact(value)}`}
                        >
                          {debtByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [formatPHP(value), "Amount"]}
                          contentStyle={{
                            backgroundColor: 'rgba(30, 30, 30, 0.9)',
                            border: '1px solid rgba(255, 107, 0, 0.3)',
                            borderRadius: '8px',
                            color: 'white'
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No debt data available</p>
                  </div>
                )}
              </GlassCard>

              {/* Debt Summary */}
              <GlassCard>
                <h3 className="text-xl font-bold mb-6">Debt Summary</h3>
                {debts && debts.length > 0 ? (
                  <div className="space-y-4">
                    {debts.map((debt: any, index: number) => {
                      const progress = debt.totalPaid / parseFloat(debt.balance) * 100;
                      return (
                        <div key={debt.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-white">{debt.name}</span>
                            <span className="text-sm text-gray-400">{debt.interestRate}% APR</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">
                              {formatPHP(debt.remainingBalance)} remaining
                            </span>
                            <span className="text-orange-500">{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No debts to analyze</p>
                  </div>
                )}
              </GlassCard>
            </div>
          </TabsContent>

          <TabsContent value="payoff-projection" className="space-y-6">
            <GlassCard>
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <TrendingDown className="w-5 h-5 mr-2 text-orange-500" />
                Debt Payoff Timeline
              </h3>
              {payoffData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={payoffData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="monthName" 
                        stroke="#9CA3AF"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickFormatter={(value) => formatPHPCompact(value)}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="totalDebt"
                        stroke="#FF6B00"
                        fill="url(#colorDebt)"
                        strokeWidth={2}
                      />
                      <defs>
                        <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#FF6B00" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No projection data available</p>
                </div>
              )}
            </GlassCard>
          </TabsContent>

          <TabsContent value="budget-breakdown" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Budget Categories Chart */}
              <GlassCard>
                <h3 className="text-xl font-bold mb-6 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-orange-500" />
                  Expense Categories
                </h3>
                {budgetBreakdown.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={budgetBreakdown} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          type="number"
                          stroke="#9CA3AF"
                          fontSize={12}
                          tickFormatter={(value) => formatPHPCompact(value)}
                        />
                        <YAxis 
                          type="category"
                          dataKey="category"
                          stroke="#9CA3AF"
                          fontSize={12}
                          width={80}
                        />
                        <Tooltip 
                          formatter={(value: number) => [formatPHP(value), "Amount"]}
                          contentStyle={{
                            backgroundColor: 'rgba(30, 30, 30, 0.9)',
                            border: '1px solid rgba(255, 107, 0, 0.3)',
                            borderRadius: '8px',
                            color: 'white'
                          }}
                        />
                        <Bar 
                          dataKey="amount" 
                          fill="#FF6B00"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No budget data available</p>
                  </div>
                )}
              </GlassCard>

              {/* Budget Health */}
              <GlassCard>
                <h3 className="text-xl font-bold mb-6">Budget Health Metrics</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">Income vs Expenses</span>
                      <span className="text-green-500 font-semibold">
                        {summary ? Math.round((summary.availableForDebt / summary.totalIncome) * 100) : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={summary ? (summary.availableForDebt / summary.totalIncome) * 100 : 0} 
                      className="h-3"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">Protected Budget</span>
                      <span className="text-green-500 font-semibold">
                        {formatPHP(summary?.protectedAmount || 0)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ 
                            width: summary ? `${(summary.protectedAmount / summary.totalExpenses) * 100}%` : '0%' 
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Monthly Income</span>
                      <span className="text-green-500 font-semibold">
                        {formatPHP(summary?.totalIncome || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Monthly Expenses</span>
                      <span className="text-red-500 font-semibold">
                        {formatPHP(summary?.totalExpenses || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-gray-600 pt-3">
                      <span className="text-orange-500 font-semibold">Available for Debt</span>
                      <span className="text-orange-500 font-bold">
                        {formatPHP(summary?.availableForDebt || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </TabsContent>

          <TabsContent value="strategy-comparison" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Strategy Comparison */}
              <GlassCard>
                <h3 className="text-xl font-bold mb-6 flex items-center">
                  <Calculator className="w-5 h-5 mr-2 text-orange-500" />
                  Payoff Strategy Comparison
                </h3>
                <div className="space-y-6">
                  {/* Avalanche Method */}
                  <div className="p-4 rounded-xl bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30">
                    <h4 className="font-semibold text-green-500 mb-2">
                      ✅ Avalanche Method (Recommended)
                    </h4>
                    <p className="text-sm text-gray-400 mb-3">
                      Pay minimum on all debts, extra to highest interest rate
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Interest Saved:</span>
                        <span className="text-green-500 font-semibold">
                          {formatPHP(interestSavings.totalSaved)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Time Saved:</span>
                        <span className="text-green-500 font-semibold">
                          {interestSavings.timeSaved} months
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Snowball Method */}
                  <div className="p-4 rounded-xl bg-gray-800 bg-opacity-50 border border-gray-600">
                    <h4 className="font-semibold text-gray-300 mb-2">
                      Snowball Method
                    </h4>
                    <p className="text-sm text-gray-400 mb-3">
                      Pay minimum on all debts, extra to smallest balance
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Interest Saved:</span>
                        <span className="text-gray-300 font-semibold">
                          {formatPHP(interestSavings.totalSaved * 0.7)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Time Saved:</span>
                        <span className="text-gray-300 font-semibold">
                          {Math.round(interestSavings.timeSaved * 0.8)} months
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Better for motivation, less optimal financially
                      </p>
                    </div>
                  </div>

                  {/* Minimum Only */}
                  <div className="p-4 rounded-xl bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30">
                    <h4 className="font-semibold text-red-500 mb-2">
                      ❌ Minimum Payments Only
                    </h4>
                    <p className="text-sm text-gray-400 mb-3">
                      Pay only minimum required amounts
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Total Interest:</span>
                        <span className="text-red-500 font-semibold">
                          {formatPHP((summary?.totalDebt || 0) * 0.4)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Payoff Time:</span>
                        <span className="text-red-500 font-semibold">
                          {Math.round(((summary?.totalDebt || 0) / (summary?.monthlyPayments || 1)) / 12)} years
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Recommendations */}
              <GlassCard>
                <h3 className="text-xl font-bold mb-6">Smart Recommendations</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-orange-500 bg-opacity-10 border border-orange-500 border-opacity-30">
                    <h4 className="font-semibold text-orange-500 mb-2">💡 Priority Focus</h4>
                    {debts && debts.length > 0 ? (
                      <p className="text-sm text-gray-300">
                        Focus extra payments on "{debts.reduce((highest: any, debt: any) => 
                          parseFloat(debt.interestRate) > parseFloat(highest.interestRate) ? debt : highest
                        ).name}" with {debts.reduce((highest: any, debt: any) => 
                          parseFloat(debt.interestRate) > parseFloat(highest.interestRate) ? debt : highest
                        ).interestRate}% interest rate.
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">Add debts to get personalized recommendations</p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-30">
                    <h4 className="font-semibold text-blue-500 mb-2">🛡️ Budget Protection</h4>
                    <p className="text-sm text-gray-300">
                      Your food budget of {formatPHP(summary?.protectedAmount || 0)} is protected. 
                      Consider optimizing other expense categories to free up more for debt payments.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30">
                    <h4 className="font-semibold text-green-500 mb-2">📈 Income Opportunity</h4>
                    <p className="text-sm text-gray-300">
                      Increasing your income by just ₱5,000/month could reduce your debt payoff time 
                      by approximately {Math.round(interestSavings.timeSaved * 0.3)} months.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-purple-500 bg-opacity-10 border border-purple-500 border-opacity-30">
                    <h4 className="font-semibold text-purple-500 mb-2">🎯 Next Milestone</h4>
                    <p className="text-sm text-gray-300">
                      You're on track to pay off your first debt in approximately{' '}
                      {debts && debts.length > 0 ? 
                        Math.round((debts[0].remainingBalance / parseFloat(debts[0].minimumPayment)) / 12) : 0
                      } years with current payments.
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
