import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide transition-colors", {
  variants: {
    variant: {
      default: "border-transparent bg-wine text-white",
      secondary: "border-transparent bg-stone-100 text-stone-600",
      outline: "border-stone-200 bg-white text-stone-600",
      gold: "border-transparent bg-gold/10 text-gold-deep",
      success: "border-transparent bg-emerald-50 text-emerald-700",
      softWine: "border-transparent bg-wine/8 text-wine",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
