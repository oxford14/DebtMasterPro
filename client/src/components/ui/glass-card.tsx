import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  floating?: boolean;
  delay?: number;
}

export function GlassCard({ children, className, floating = false, delay = 0 }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-card p-6",
        floating && "floating-card",
        className
      )}
      style={floating ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
