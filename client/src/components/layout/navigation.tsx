import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getAuthHeaders, clearStoredAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export function Navigation() {
  const [location] = useLocation();
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch user");
      return response.json();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      clearStoredAuth();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of DebtMaster Pro",
      });
      window.location.href = "/login";
    },
  });

  const navItems = [
    { href: "/", label: "Dashboard", active: location === "/" },
    { href: "/debts", label: "Debts", active: location === "/debts" },
    { href: "/budget", label: "Budget", active: location === "/budget" },
    { href: "/calendar", label: "Calendar", active: location === "/calendar" },
    { href: "/reports", label: "Reports", active: location === "/reports" },
  ];

  return (
    <nav className="glass-card rounded-none border-l-0 border-r-0 border-t-0 p-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <span className="text-xl font-bold text-white">₱</span>
          </div>
          <h1 className="text-2xl font-bold glow-text">DebtMaster Pro</h1>
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <span
                className={`font-semibold transition-colors cursor-pointer ${
                  item.active
                    ? "text-orange-500"
                    : "text-gray-400 hover:text-orange-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600"></div>
          <span className="hidden sm:block text-sm font-medium">
            {user?.fullName || "User"}
          </span>
          <Button
            onClick={() => logoutMutation.mutate()}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            disabled={logoutMutation.isPending}
          >
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}
