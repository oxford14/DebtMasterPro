import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function FloatingActionButton({ 
  onClick, 
  icon = <Plus className="w-6 h-6" />, 
  className 
}: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-8 right-8 w-16 h-16 rounded-full glossy-button",
        "flex items-center justify-center shadow-2xl hover:scale-110",
        "transition-transform z-40 text-white",
        className
      )}
    >
      {icon}
    </Button>
  );
}
