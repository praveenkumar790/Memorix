import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white dark:ring-offset-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg dark:focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-fg dark:bg-gray-700 text-bg dark:text-white hover:bg-fg/90 dark:hover:bg-gray-600",
        destructive: "bg-red-500 dark:bg-red-600 text-slate-50 hover:bg-red-500/90 dark:hover:bg-red-700",
        outline: "border border-border dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-bg-secondary dark:hover:bg-gray-700 hover:text-fg dark:hover:text-white",
        secondary: "bg-bg-secondary dark:bg-gray-700 text-fg dark:text-gray-100 hover:bg-bg-secondary/80 dark:hover:bg-gray-600",
        ghost: "hover:bg-bg-secondary dark:hover:bg-gray-700 hover:text-fg dark:hover:text-white",
        link: "text-fg dark:text-gray-300 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
