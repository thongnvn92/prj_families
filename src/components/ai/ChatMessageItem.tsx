import { Bot, BookOpenText, Clock3, UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import type { ChatMessage } from "../../types/ai";

interface ChatMessageItemProps {
  message: ChatMessage;
  onReferenceClick?: (memberId: string) => void;
  isStreaming?: boolean;
}

export function ChatMessageItem({ message, onReferenceClick, isStreaming = false }: ChatMessageItemProps) {
  const isUser = message.sender === "user";
  return <div className={cn("flex items-end gap-2.5", isUser && "flex-row-reverse")}><Avatar className="size-8 shrink-0"><AvatarFallback className={isUser ? "bg-wine text-white" : "bg-gold-soft text-gold-deep"}>{isUser ? <UserRound className="size-4" /> : <Bot className="size-4" />}</AvatarFallback></Avatar><div className={cn("max-w-[min(88%,680px)]", isUser && "text-right")}><div className={cn("rounded-2xl border px-4 py-3 text-left text-sm leading-6 shadow-sm", isUser ? "border-wine bg-wine text-white" : "border-gold/40 bg-[#fffaf0] text-stone-700")}><p className="whitespace-pre-wrap">{message.text}{isStreaming && <span className="ml-0.5 inline-block h-4 w-1 animate-pulse rounded-full bg-gold align-middle" />}</p>{message.references && message.references.length > 0 && <div className={cn("mt-3 border-t pt-2", isUser ? "border-white/20" : "border-gold/25")}><p className={cn("mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em]", isUser ? "text-white/70" : "text-gold-deep")}><BookOpenText className="size-3" />Nguồn tham chiếu</p><div className="flex flex-wrap gap-1.5">{message.references.map((item) => <Button key={item.memberId} type="button" variant="outline" size="sm" onClick={() => onReferenceClick?.(item.memberId)} className={cn("h-7 rounded-full border-gold/30 bg-gold-soft px-2.5 text-[10px] text-gold-deep hover:border-wine/30 hover:bg-wine/5 hover:text-wine", isUser && "border-white/20 bg-white/15 text-white hover:bg-white/25 hover:text-white")}>{item.name}</Button>)}</div></div>}</div><p className={cn("mt-1.5 flex items-center gap-1 text-[10px] text-stone-400", isUser && "justify-end")}><Clock3 className="size-3" />{new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.timestamp))}</p></div></div>;
}
