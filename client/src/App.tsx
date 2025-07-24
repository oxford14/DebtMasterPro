import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/layout/navigation";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import NotFound from "./pages/not-found";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Debts from "./pages/debts";
import Budget from "./pages/budget";
import Calendar from "./pages/calendar";
import Reports from "./pages/reports";
import { getStoredAuth } from "@/lib/auth";

function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const auth = getStoredAuth();
  
  if (!auth) {
    window.location.href = "/login";
    return null;
  }
  
  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <Component />
      <MobileNavigation />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/debts" component={() => <ProtectedRoute component={Debts} />} />
      <Route path="/budget" component={() => <ProtectedRoute component={Budget} />} />
      <Route path="/calendar" component={() => <ProtectedRoute component={Calendar} />} />
      <Route path="/reports" component={() => <ProtectedRoute component={Reports} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
