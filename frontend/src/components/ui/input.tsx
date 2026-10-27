import * as React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, type, ...props }, ref) => (
  <input type={type} className={cn("flex h-10 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm text-stone-800 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-wine/50 focus:ring-4 focus:ring-wine/10 disabled:cursor-not-allowed disabled:opacity-50", className)} ref={ref} {...props} />
));
Input.displayName = "Input";

export { Input };
