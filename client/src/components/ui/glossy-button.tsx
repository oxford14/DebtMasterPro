import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GlossyButtonProps extends ButtonProps {
  children: React.ReactNode;
}

export function GlossyButton({ children, className, ...props }: GlossyButtonProps) {
  return (
    <Button
      className={cn("glossy-button text-white font-semibold", className)}
      {...props}
    >
      {children}
    </Button>
  );
}
