import { cn } from '@/lib/utils';

interface ProgressBarProps {
  percentage: number;
  isOverBudget?: boolean;
  className?: string;
}

export function ProgressBar({ percentage, isOverBudget = false, className }: ProgressBarProps) {
  const clampedPercentage = Math.min(percentage, 100);
  
  return (
    <div className={cn("w-full bg-gray-200 rounded-full h-2", className)}>
      <div
        className={cn(
          "h-2 rounded-full transition-all duration-300",
          isOverBudget ? "bg-red-500" : "bg-green-500"
        )}
        style={{ width: `${clampedPercentage}%` }}
      />
    </div>
  );
}