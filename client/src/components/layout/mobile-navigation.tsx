import { Link, useLocation } from "wouter";
import { Home, CreditCard, PieChart, Calendar } from "lucide-react";

export function MobileNavigation() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Home", icon: Home, active: location === "/" },
    { href: "/debts", label: "Debts", icon: CreditCard, active: location === "/debts" },
    { href: "/budget", label: "Budget", icon: PieChart, active: location === "/budget" },
    { href: "/calendar", label: "Calendar", icon: Calendar, active: location === "/calendar" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-card rounded-none border-l-0 border-r-0 border-b-0 p-4 md:hidden z-30">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <a className="flex flex-col items-center space-y-1">
                <Icon
                  className={`w-5 h-5 ${
                    item.active ? "text-orange-500" : "text-gray-400"
                  }`}
                />
                <span
                  className={`text-xs font-semibold ${
                    item.active ? "text-orange-500" : "text-gray-400"
                  }`}
                >
                  {item.label}
                </span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
