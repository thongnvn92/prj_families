import { Radio, WifiOff } from "lucide-react";
import { Badge } from "../ui/badge";
import type { RealtimeStatus } from "../../lib/echo";

type BadgeVariant = "default" | "secondary" | "outline" | "gold" | "success" | "softWine";

const statusMeta: Record<RealtimeStatus, { label: string; variant: BadgeVariant; pulse: boolean }> = {
  connected: { label: "Đã kết nối Realtime", variant: "success", pulse: true },
  connecting: { label: "Đang kết nối Realtime", variant: "gold", pulse: true },
  reconnecting: { label: "Đang kết nối lại Realtime", variant: "gold", pulse: true },
  disconnected: { label: "Đang ngoại tuyến", variant: "outline", pulse: false },
  failed: { label: "Mất kết nối Realtime", variant: "outline", pulse: false },
  idle: { label: "Đang ngoại tuyến", variant: "outline", pulse: false },
};

/**
 * Badge trạng thái WebSocket, cập nhật theo state_change/connected/disconnected
 * của pusher-js nên phản ánh cả trạng thái đang reconnect lẫn mất kết nối.
 */
export function RealtimeStatusBadge({ status }: { status: RealtimeStatus }) {
  const meta = statusMeta[status] ?? statusMeta.idle;
  return (
    <Badge variant={meta.variant} role="status" aria-live="polite" className="gap-1.5 whitespace-nowrap">
      {meta.pulse ? <Radio className="size-3 animate-pulse" /> : <WifiOff className="size-3" />}
      {meta.label}
    </Badge>
  );
}
