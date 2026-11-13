import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0099FF]/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#0099FF] via-[#0088e6] to-[#0077cc] text-white hover:from-[#0088e6] hover:to-[#0066b3] shadow-sm shadow-[#0099FF]/25 hover:shadow-md hover:shadow-[#0099FF]/35 border border-[#0099FF]/30",
        gradient:
          "bg-gradient-to-r from-sky-500 via-[#0099FF] to-blue-600 text-white hover:from-sky-400 hover:to-blue-500 shadow-sm shadow-[#0099FF]/25 hover:shadow-md hover:shadow-[#0099FF]/35 border border-[#0099FF]/30",
        emerald:
          "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-sm shadow-emerald-500/25 hover:shadow-md hover:shadow-emerald-500/35 border border-emerald-400/20",
        destructive:
          "bg-gradient-to-r from-rose-600 to-red-600 text-white hover:from-rose-500 hover:to-red-500 shadow-sm shadow-rose-500/25 hover:shadow-md hover:shadow-rose-500/35 border border-rose-400/20",
        outline:
          "border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-xs",
        secondary:
          "bg-sky-50 text-[#0077cc] hover:bg-sky-100/80 border border-sky-200/80 shadow-xs",
        ghost:
          "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900",
        link:
          "text-[#0099FF] underline-offset-4 hover:underline hover:text-[#0077cc] font-semibold",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8.5 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-6 text-sm font-bold",
        icon: "h-9 w-9 rounded-lg",
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
