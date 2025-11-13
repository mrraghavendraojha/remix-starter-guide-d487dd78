import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-smooth focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-card hover:shadow-hover",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-card hover:shadow-hover",
        outline: "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20 shadow-soft hover:shadow-card",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-card hover:shadow-hover",
        ghost: "hover:bg-accent hover:text-accent-foreground transition-bounce",
        link: "text-primary underline-offset-4 hover:underline",
        community: "bg-community-gradient text-primary-foreground hover:opacity-90 shadow-community hover:shadow-glow transition-bounce font-bold",
        warm: "bg-warm-gradient text-secondary-foreground hover:opacity-90 shadow-card hover:shadow-hover transition-bounce font-bold",
        card: "bg-glass-gradient text-card-foreground border border-border hover:shadow-card shadow-soft backdrop-blur-sm hover:border-primary/30",
        success: "bg-success text-success-foreground hover:bg-success/90 shadow-card hover:shadow-hover",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 shadow-card hover:shadow-hover",
        cta: "bg-community-gradient text-white hover:opacity-95 shadow-glow hover:shadow-hover transition-spring font-bold text-base scale-105 hover:scale-110",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-14 rounded-xl px-10 text-base",
        xl: "h-16 rounded-2xl px-12 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
