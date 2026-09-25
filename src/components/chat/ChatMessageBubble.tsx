import { ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import type { ChatMessage } from "../../types/chat";
import { cn } from "../../lib/utils";

export function ChatMessageBubble({ message, isOwn }: { message: ChatMessage; isOwn: boolean }) {
  return <div className={cn("flex items-end gap-2.5", isOwn && "flex-row-reverse")}><Avatar className="size-8 shrink-0"><AvatarFallback className={isOwn ? "bg-wine text-white" : "bg-stone-200 text-stone-600"}>{message.senderAvatar || message.senderName.slice(0, 2)}</AvatarFallback></Avatar><div className={cn("max-w-[min(78%,620px)]", isOwn && "text-right")}><div className={cn("mb-1 flex items-center gap-2", isOwn && "justify-end")}><span className="text-xs font-semibold text-stone-700">{message.senderName}</span><Badge variant={message.senderRole === "Trưởng Tộc" ? "softWine" : "outline"} className="px-1.5 py-0 text-[9px]">{message.senderRole}</Badge></div><div className={cn("overflow-hidden rounded-2xl border px-4 py-3 text-left text-sm leading-6 shadow-sm", isOwn ? "border-wine bg-wine text-white" : "border-stone-200 bg-white text-stone-700")}><p className="whitespace-pre-wrap">{message.messageText}</p>{message.imageBase64 && <img src={message.imageBase64} alt="Tệp đính kèm trong trò chuyện" className="mt-3 max-h-80 w-full rounded-xl border border-white/20 object-cover" />}</div><p className="mt-1 flex items-center gap-1 text-[10px] text-stone-400">{message.imageBase64 && <ImageIcon className="size-3" />}{new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.createdAt))}</p></div></div>;
}
