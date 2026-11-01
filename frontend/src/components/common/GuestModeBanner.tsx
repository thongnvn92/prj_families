import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface GuestModeBannerProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  storageKey: string;
  className?: string;
}

export function GuestModeBanner({ title, description, icon, storageKey, className }: GuestModeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(storageKey) === "1") setDismissed(true);
    } catch {
      // localStorage may be unavailable in restricted contexts.
    }
  }, [storageKey]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // localStorage may be unavailable in restricted contexts.
    }
  }, [storageKey]);

  if (dismissed) return null;

  return (
    <div className={cn("flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800", className)}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-amber-800">{title}</p>
        <p className="mt-1 text-xs leading-5 text-amber-700">{description}</p>
      </div>
      <button type="button" onClick={handleDismiss} className="ml-auto shrink-0 rounded-lg p-1 hover:bg-amber-100" aria-label="Đóng thông báo">
        <X className="size-4 shrink-0" />
      </button>
    </div>
  );
}
