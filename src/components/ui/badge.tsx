import * as React from "react"
import { cn } from "@/lib/utils"

// Temporary interface until class-variance-authority is installed
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'new' | 'assigned' | 'in-progress' | 'completed' | 'done' | 'closed'
}

const getVariantClasses = (variant: BadgeProps['variant'] = 'default') => {
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground",
    new: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-100/80",
    assigned: "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80",
    "in-progress": "border-transparent bg-purple-100 text-purple-800 hover:bg-purple-100/80",
    completed: "border-transparent bg-green-100 text-green-800 hover:bg-green-100/80",
    done: "border-transparent bg-indigo-100 text-indigo-800 hover:bg-indigo-100/80",
    closed: "border-transparent bg-gray-100 text-gray-800 hover:bg-gray-100/80",
  };
  
  return variants[variant] || variants.default;
};

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div 
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        getVariantClasses(variant),
        className
      )} 
      {...props} 
    />
  )
}

export { Badge }
