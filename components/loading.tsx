import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  text?: string;
  className?: string;
  size?: number;
  variant?: "default" | "overlay" | "spinner";
}

export function Loading({ 
  text = "Loading...", 
  className = "", 
  size = 24,
  variant = "default"
}: LoadingProps) {
  const baseStyles = "flex items-center justify-center gap-2";
  const variants = {
    default: "text-gray-500",
    overlay: "fixed inset-0 bg-black/50 z-50",
    spinner: "text-primary"
  };

  const content = (
    <div className={cn(
      baseStyles,
      variants[variant],
      variant === "overlay" && "bg-black/50",
      className
    )}>
      <div className={cn(
        "flex items-center gap-2",
        variant === "overlay" && "bg-white p-4 rounded-lg shadow-lg"
      )}>
        <Loader2 className={cn(
          "animate-spin",
          variant === "spinner" && "text-primary"
        )} size={size} />
        {text && (
          <span className={cn(
            "text-sm",
            variant === "overlay" ? "text-gray-700" : "text-gray-500"
          )}>
            {text}
          </span>
        )}
      </div>
    </div>
  );

  return content;
}

// Alias for backward compatibility
export const LoadingOverlay = ({ text, className, size }: LoadingProps) => (
  <Loading text={text} className={className} size={size} variant="overlay" />
); 