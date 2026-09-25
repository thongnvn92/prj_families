import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "../../lib/utils";
import { buttonVariants } from "./button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-4",
        caption: "relative flex items-center justify-center h-9",
        caption_label: "text-sm font-semibold text-stone-800",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous: cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "size-8"),
        button_next: cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "size-8"),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "w-11 text-[0.7rem] font-medium text-stone-400",
        week: "mt-1 flex w-full",
        day: "relative size-11 p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day_button: cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "size-11 rounded-xl font-normal hover:bg-wine/8 hover:text-wine"),
        selected: "rounded-lg bg-wine text-white hover:bg-wine hover:text-white",
        today: "rounded-lg bg-gold/10 text-gold-deep",
        outside: "text-stone-300",
        disabled: "text-stone-300 opacity-50",
        range_start: "rounded-l-lg bg-wine text-white",
        range_end: "rounded-r-lg bg-wine text-white",
        range_middle: "bg-wine/10 text-wine",
        hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
