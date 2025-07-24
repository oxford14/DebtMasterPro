import { Input } from "@/components/ui/input";
import { formatPHPInput, parsePHP } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { forwardRef, useState } from "react";

interface CurrencyInputProps {
  value?: number;
  onChange?: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value = 0, onChange, placeholder = "₱0.00", className, disabled }, ref) => {
    const [displayValue, setDisplayValue] = useState(value > 0 ? value.toString() : "");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPHPInput(e.target.value);
      setDisplayValue(formatted);
      
      const numericValue = parsePHP(formatted);
      onChange?.(numericValue);
    };

    const handleBlur = () => {
      if (displayValue && !isNaN(parseFloat(displayValue))) {
        const numericValue = parseFloat(displayValue);
        setDisplayValue(numericValue.toFixed(2));
      }
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500 font-semibold">
          ₱
        </span>
        <Input
          ref={ref}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder.replace('₱', '')}
          disabled={disabled}
          className={cn("glossy-input pl-8", className)}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
