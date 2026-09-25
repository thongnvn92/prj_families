import { Lock, MessageCircle, Plus, Search, UsersRound } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import type { ChatGroup } from "../../types/chat";
import { normalizeText } from "../../lib/utils";

interface ChatGroupListProps {
  groups: ChatGroup[];
  selectedGroupId: string | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelect: (group: ChatGroup) => void;
  canCreate: boolean;
  onCreate: () => void;
}

const typeLabels: Record<ChatGroup["type"], string> = { all: "Toàn dòng", branch: "Nhánh họ", custom: "Nhóm riêng" };

export function ChatGroupList({ groups, selectedGroupId, searchQuery, onSearchChange, onSelect, canCreate, onCreate }: ChatGroupListProps) {
  const filtered = groups.filter((group) => normalizeText(group.name).includes(normalizeText(searchQuery)));
  const unread = groups.reduce((sum, group) => sum + (group.unreadCount ?? 0), 0);
  return <aside className="flex min-h-0 flex-col border-r border-stone-200 bg-white"><div className="border-b p-4"><div className="flex items-center justify-between gap-2"><div><p className="font-display text-lg font-semibold text-stone-900">Trò chuyện</p><p className="mt-0.5 text-xs text-stone-400">{unread} tin nhắn chưa đọc</p></div>{canCreate && <Button size="sm" onClick={onCreate}><Plus className="size-3.5" />Tạo nhóm</Button>}</div><div className="relative mt-4"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" /><Input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Tìm nhóm chat..." className="pl-9" aria-label="Tìm nhóm chat" /></div></div><div className="thin-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto p-2">{filtered.map((group) => <button key={group.id} onClick={() => onSelect(group)} className={`flex w-full gap-3 rounded-2xl p-3 text-left transition ${selectedGroupId === group.id ? "bg-wine/8 ring-1 ring-wine/15" : "hover:bg-stone-50"}`}><Avatar className="size-11 shrink-0"><AvatarFallback className={group.type === "all" ? "bg-wine text-white" : group.type === "branch" ? "bg-gold-soft text-gold-deep" : "bg-sage-soft text-sage"}>{group.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-bold text-stone-800">{group.name}</span>{(group.unreadCount ?? 0) > 0 && <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-wine text-[10px] font-bold text-white">{group.unreadCount}</span>}</span><span className="mt-1 flex items-center gap-1 text-[10px] text-stone-400"><Badge variant="outline" className="h-4 px-1.5 py-0 text-[8px]">{typeLabels[group.type]}</Badge><UsersRound className="size-3" />{group.memberCount}</span><span className="mt-1.5 block truncate text-xs text-stone-500">{group.lastMessage}</span></span></button>)}{filtered.length === 0 && <div className="p-8 text-center text-sm text-stone-400">Không tìm thấy nhóm chat.</div>}</div></aside>;
}

export function MaskedChatGroups() { return <aside className="border-r border-stone-200 bg-white"><div className="border-b p-4"><p className="font-display text-lg font-semibold">Trò chuyện</p><div className="mt-4 flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-400"><Lock className="size-3.5" />Danh sách đã được che mờ</div></div><div className="space-y-2 p-3">{[1, 2, 3].map((item) => <div key={item} className="flex gap-3 rounded-2xl bg-stone-50 p-3"><Avatar><AvatarFallback><MessageCircle className="size-4" /></AvatarFallback></Avatar><div className="flex-1"><div className="h-3 w-32 rounded bg-stone-200 blur-[2px]" /><div className="mt-2 h-2.5 w-full rounded bg-stone-200 blur-[2px]" /></div></div>)}</div></aside>; }
