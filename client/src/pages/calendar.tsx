import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/auth";
import { formatPHP } from "@/lib/currency";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, AlertCircle } from "lucide-react";
import { addDays, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, getDay } from "date-fns";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/payments"],
    queryFn: async () => {
      const response = await fetch("/api/payments", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch payments");
      return response.json();
    },
  });

  // Calculate upcoming payments for the current month
  const getUpcomingPayments = () => {
    if (!debts) return [];
    
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    return debts.map((debt: any) => {
      const dueDate = new Date(currentYear, currentMonth, debt.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...debt,
        dueDate: dueDate,
        daysUntilDue,
        isOverdue: daysUntilDue < 0,
        isUpcoming: daysUntilDue >= 0 && daysUntilDue <= 7,
      };
    }).sort((a: any, b: any) => a.daysUntilDue - b.daysUntilDue);
  };

  const upcomingPayments = getUpcomingPayments();

  // Get payments for a specific date
  const getPaymentsForDate = (date: Date) => {
    return upcomingPayments.filter((payment: any) => 
      isSameDay(payment.dueDate, date)
    );
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days for the calendar grid
  const startDay = getDay(monthStart);
  const paddingDays = Array.from({ length: startDay }, (_, i) => 
    addDays(monthStart, -(startDay - i))
  );

  const allDays = [...paddingDays, ...calendarDays];

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

  const getDayClass = (day: Date) => {
    const payments = getPaymentsForDate(day);
    const hasPayments = payments.length > 0;
    const hasOverdue = payments.some((p: any) => p.isOverdue);
    const hasUpcoming = payments.some((p: any) => p.isUpcoming);
    
    let classes = "relative w-full h-12 flex items-center justify-center rounded-lg transition-all cursor-pointer ";
    
    if (!isSameMonth(day, currentDate)) {
      classes += "text-gray-600 hover:bg-gray-800 hover:bg-opacity-50 ";
    } else if (isToday(day)) {
      classes += "bg-orange-500 text-white font-bold ";
    } else if (selectedDate && isSameDay(day, selectedDate)) {
      classes += "bg-orange-500 bg-opacity-30 text-orange-500 font-semibold ";
    } else {
      classes += "text-white hover:bg-gray-800 hover:bg-opacity-50 ";
    }
    
    if (hasPayments) {
      if (hasOverdue) {
        classes += "ring-2 ring-red-500 ";
      } else if (hasUpcoming) {
        classes += "ring-2 ring-orange-500 ";
      } else {
        classes += "ring-1 ring-gray-400 ";
      }
    }
    
    return classes;
  };

  return (
    <div className="min-h-screen bg-black pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold glow-text mb-4">Payment Calendar</h1>
          <p className="text-gray-400 text-lg">
            Track your payment due dates and never miss a payment
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <GlassCard>
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {format(currentDate, "MMMM yyyy")}
                </h2>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                    className="text-gray-400 hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                    className="text-gray-400 hover:text-orange-500"
                  >
                    Today
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                    className="text-gray-400 hover:text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-2">
                {allDays.map((day, index) => {
                  const payments = getPaymentsForDate(day);
                  return (
                    <div
                      key={index}
                      className={getDayClass(day)}
                      onClick={() => setSelectedDate(day)}
                    >
                      <span className="relative z-10">
                        {format(day, 'd')}
                      </span>
                      {payments.length > 0 && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                          <div className="flex space-x-1">
                            {payments.slice(0, 3).map((payment: any, i: number) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  payment.isOverdue ? 'bg-red-500' : 
                                  payment.isUpcoming ? 'bg-orange-500' : 'bg-gray-400'
                                }`}
                              />
                            ))}
                            {payments.length > 3 && (
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 pt-4 border-t border-gray-700">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-gray-400">Today</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-gray-400">Overdue</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500 opacity-60"></div>
                    <span className="text-gray-400">Due Soon</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <span className="text-gray-400">Scheduled</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Date Details */}
            {selectedDate && (
              <GlassCard>
                <h3 className="text-lg font-bold mb-4">
                  {format(selectedDate, "MMMM d, yyyy")}
                </h3>
                {getPaymentsForDate(selectedDate).length > 0 ? (
                  <div className="space-y-3">
                    {getPaymentsForDate(selectedDate).map((payment: any) => (
                      <div
                        key={payment.id}
                        className={`p-3 rounded-lg border ${
                          payment.isOverdue
                            ? "border-red-500 bg-red-500 bg-opacity-10"
                            : payment.isUpcoming
                            ? "border-orange-500 bg-orange-500 bg-opacity-10"
                            : "border-gray-600 bg-gray-800 bg-opacity-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getDebtIcon(payment.debtType)}</span>
                            <div>
                              <h4 className="font-semibold text-white">{payment.name}</h4>
                              <p className="text-sm text-gray-400">
                                {payment.isOverdue ? "Overdue" : 
                                 payment.isUpcoming ? "Due Soon" : "Scheduled"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-orange-500">
                              {formatPHP(payment.minimumPayment)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">
                    No payments scheduled for this date
                  </p>
                )}
              </GlassCard>
            )}

            {/* Upcoming Payments */}
            <GlassCard>
              <h3 className="text-lg font-bold mb-4">Upcoming Payments</h3>
              {debtsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-800 h-16 rounded-lg"></div>
                  ))}
                </div>
              ) : upcomingPayments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingPayments.slice(0, 5).map((payment: any) => (
                    <div
                      key={payment.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg ${
                        payment.isOverdue
                          ? "bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30"
                          : payment.isUpcoming
                          ? "bg-orange-500 bg-opacity-10 border border-orange-500 border-opacity-30"
                          : "bg-gray-800 bg-opacity-50"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        payment.isOverdue ? "bg-red-500 bg-opacity-20" :
                        payment.isUpcoming ? "bg-orange-500 bg-opacity-20" : "bg-gray-600 bg-opacity-20"
                      }`}>
                        <span className={`font-bold text-sm ${
                          payment.isOverdue ? "text-red-500" :
                          payment.isUpcoming ? "text-orange-500" : "text-gray-400"
                        }`}>
                          {format(payment.dueDate, 'd')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white">{payment.name}</p>
                        <p className="text-sm text-gray-400">
                          {payment.isOverdue 
                            ? `${Math.abs(payment.daysUntilDue)} days overdue`
                            : payment.daysUntilDue === 0
                            ? "Due today"
                            : `Due in ${payment.daysUntilDue} days`
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          payment.isOverdue ? "text-red-500" :
                          payment.isUpcoming ? "text-orange-500" : "text-white"
                        }`}>
                          {formatPHP(payment.minimumPayment)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No upcoming payments</p>
                </div>
              )}
            </GlassCard>

            {/* Payment Summary */}
            <GlassCard>
              <h3 className="text-lg font-bold mb-4">This Month</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Total Due
                  </span>
                  <span className="text-orange-500 font-bold">
                    {formatPHP(upcomingPayments.reduce((sum: number, p: any) => sum + parseFloat(p.minimumPayment), 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Overdue
                  </span>
                  <span className="text-red-500 font-bold">
                    {formatPHP(upcomingPayments.filter((p: any) => p.isOverdue).reduce((sum: number, p: any) => sum + parseFloat(p.minimumPayment), 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Upcoming (7 days)</span>
                  <span className="text-yellow-500 font-bold">
                    {formatPHP(upcomingPayments.filter((p: any) => p.isUpcoming && !p.isOverdue).reduce((sum: number, p: any) => sum + parseFloat(p.minimumPayment), 0))}
                  </span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
