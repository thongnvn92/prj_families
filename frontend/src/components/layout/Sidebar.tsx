import type { LucideIcon } from "lucide-react";
import { Bot, CalendarDays, Image, MessageCircle, ScrollText, Settings2, SlidersHorizontal, TreePine, UsersRound } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";
import { canAccessSection } from "../../lib/rbacFilter";
import { useFamilySettings } from "../../lib/useFamilySettings";

export type AppSection = "tree" | "directory" | "calendar" | "gallery" | "chat" | "rituals" | "assistant" | "management" | "settings";
type NavItem = { id: AppSection; label: string; icon: LucideIcon; hint?: string };

const navItems: NavItem[] = [
  { id: "tree", label: "Cây gia phả", icon: TreePine },
  { id: "directory", label: "Danh sách thành viên", icon: UsersRound },
  { id: "calendar", label: "Lịch Âm & Nhắc giỗ", icon: CalendarDays, hint: "2" },
  { id: "gallery", label: "Album gia đình", icon: Image },
  { id: "chat", label: "Trò chuyện nội bộ", icon: MessageCircle, hint: "3" },
  { id: "rituals", label: "Văn cúng & Nghi lễ", icon: ScrollText },
  { id: "assistant", label: "Trợ lý AI Gia tộc", icon: Bot },
  { id: "management", label: "Quản lý & Đề xuất", icon: Settings2, hint: "5" },
  { id: "settings", label: "Cấu hình tính năng", icon: SlidersHorizontal },
];

interface SidebarProps { activeSection: AppSection; collapsed?: boolean; onToggle?: () => void; onNavigate: (section: AppSection) => void; onClose?: () => void; }

export function Sidebar({ activeSection, collapsed = false, onToggle, onNavigate, onClose }: SidebarProps) {
  const { currentRole } = useAuth();
  const { chatEnabled } = useFamilySettings();
  const visibleNavItems = navItems.filter((item) => canAccessSection(currentRole, item.id) && !(item.id === "chat" && !chatEnabled));
  return <div className="flex h-full flex-col bg-[#211719] text-stone-100">
    <div className={cn("flex h-20 items-center border-b border-white/10 px-4", collapsed ? "justify-center" : "justify-between")}>
      <button className={cn("flex items-center gap-3 text-left", collapsed && "justify-center")} onClick={() => onNavigate("tree")} aria-label="Về Cây gia phả">
        <span className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#8c2427] shadow-lg ring-1 ring-[#b48a2e]/40"><TreePine className="size-6 text-[#f1d88d]" strokeWidth={1.8} /><span className="absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-[#211719] bg-[#c59a37]" /></span>
        {!collapsed && <span className="min-w-0"><span className="block font-display text-[21px] font-semibold tracking-tight text-white">Gia Phả</span><span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-[#d5b66a]">Online</span></span>}
      </button>
      {onToggle && <Button variant="ghost" size="icon-sm" onClick={onToggle} className="hidden text-stone-400 hover:bg-white/10 hover:text-white lg:inline-flex" aria-label={collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}>{collapsed ? <PanelLeftOpenIcon /> : <PanelLeftCloseIcon />}</Button>}
    </div>
    <div className={cn("border-b border-white/10 py-5", collapsed ? "px-3" : "px-4")}><div className={cn("flex items-center gap-3 rounded-2xl bg-white/[0.06] p-2.5", collapsed && "justify-center px-0")}><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#a13a32]/25 text-[#e5bd6a]"><TreePine className="size-4" /></span>{!collapsed && <div className="min-w-0"><p className="truncate text-xs font-semibold text-white">Gia phả Họ Nguyễn</p><p className="mt-0.5 text-[11px] text-stone-400">Chi 3 · Bắc Ninh</p></div>}</div></div>
    <nav className={cn("thin-scrollbar flex-1 overflow-y-auto py-5", collapsed ? "px-2" : "px-3")} aria-label="Điều hướng chính">{!collapsed && <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">Không gian gia tộc</p>}<div className="space-y-1">{visibleNavItems.map((item) => { const Icon = item.icon; const active = activeSection === item.id; return <button key={item.id} className={cn("group relative flex w-full items-center gap-3 rounded-xl text-left text-sm font-medium transition-all", collapsed ? "justify-center px-2 py-3" : "px-3 py-2.5", active ? "bg-[#8c2427] text-white shadow-md" : "text-stone-400 hover:bg-white/[0.07] hover:text-stone-100")} onClick={() => { onNavigate(item.id); onClose?.(); }} title={collapsed ? item.label : undefined} aria-current={active ? "page" : undefined}><Icon className={cn("size-[18px] shrink-0", active ? "text-[#f1d88d]" : "text-stone-500 group-hover:text-stone-200")} strokeWidth={active ? 2 : 1.8} />{!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}{!collapsed && item.hint && <span className={cn("flex size-5 items-center justify-center rounded-md text-[10px] font-bold", active ? "bg-white/15 text-white" : "bg-white/[0.08] text-stone-400")}>{item.hint}</span>}{active && <span className="absolute -right-0.5 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-[#d7b45c]" />}</button>; })}</div></nav>
    <div className={cn("border-t border-white/10", collapsed ? "p-3" : "p-4")}>{!collapsed ? <div className="rounded-2xl border border-[#d7b45c]/20 bg-gradient-to-br from-[#4b2824] to-[#2a1b1c] p-3.5"><div className="mb-2 flex items-center gap-2 text-[#e4c77e]"><ShieldIcon /><span className="text-xs font-semibold">Gia phả riêng tư</span></div><p className="text-[11px] leading-5 text-stone-400">{currentRole === "guest" ? "Chỉ hiển thị thông tin công khai của dòng họ." : "Thông tin chỉ hiển thị cho thành viên đã xác thực."}</p></div> : <div className="mx-auto flex size-10 items-center justify-center rounded-xl text-[#e4c77e]" title="Gia phả riêng tư"><ShieldIcon /></div>}</div>
  </div>;
}

function PanelLeftCloseIcon() { return <span className="relative block size-4"><span className="absolute left-0 top-0 h-3.5 w-1 rounded-sm bg-current" /><span className="absolute right-0 top-0 h-px w-2.5 bg-current" /><span className="absolute right-0 top-2 h-px w-2.5 bg-current" /><span className="absolute right-0 top-4 h-px w-2.5 bg-current" /></span>; }
function ShieldIcon() { return <span className="relative flex size-4 items-center justify-center"><span className="absolute inset-x-0.5 top-0.5 h-3.5 rounded-b-full border border-current" /><span className="absolute top-1.5 size-1.5 rounded-full bg-current" /></span>; }
function PanelLeftOpenIcon() { return <span className="relative block size-4"><span className="absolute left-0 top-0 h-3.5 w-1 rounded-sm bg-current" /><span className="absolute right-0 top-0 h-px w-2.5 bg-current" /><span className="absolute right-0 top-2 h-px w-2.5 bg-current" /><span className="absolute right-0 top-4 h-px w-2.5 bg-current" /></span>; }

