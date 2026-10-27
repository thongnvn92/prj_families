import { useState } from "react";
import { Bell, CalendarDays, ChevronDown, LogIn, LogOut, Menu, Search, UserRound, X } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { useSearchMembersQuery } from "../../app/memberApi";
import { useLoginMutation, useLogoutMutation } from "../../app/authApi";
import { roleLabels, useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../app/apiSlice";
import { filterMemberForRole, isPublicMember } from "../../lib/rbacFilter";
import { LoginDialog } from "../auth/LoginDialog";
import { PersonalProfileSheet } from "../account/PersonalProfileSheet";
import type { FamilyMember } from "../../lib/mock-data";
import type { AppSection } from "./Sidebar";

interface HeaderProps {
  activeSection: AppSection;
  familyName: string;
  members: FamilyMember[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectMember: (member: FamilyMember) => void;
  onFamilyChange: (value: string) => void;
  onMenuClick: () => void;
  onNavigate: (section: AppSection) => void;
}

const sectionNames: Record<AppSection, string> = { tree: "Cây gia phả", directory: "Danh sách thành viên", calendar: "Lịch Âm & Nhắc giỗ", gallery: "Album gia đình", chat: "Trò chuyện nội bộ", rituals: "Văn cúng & Nghi lễ", assistant: "Trợ lý AI Gia tộc", management: "Quản lý & Đề xuất", settings: "Cấu hình tính năng" };

export function Header({ activeSection, familyName, members, searchQuery, onSearchChange, onSelectMember, onFamilyChange, onMenuClick, onNavigate }: HeaderProps) {
  const { currentRole, permissions, user, isInitializing } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const { data: searchResults = [] } = useSearchMembersQuery(
    { authKey: currentRole, query: searchQuery },
    { skip: isInitializing || !searchQuery.trim() },
  );
  const safeResults = searchResults.slice(0, 5).map((member) => filterMemberForRole(member, currentRole));

  return <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#f8f7f4]/90 backdrop-blur-xl">
    <div className="flex min-h-20 items-center gap-3 px-4 sm:px-6 xl:px-8">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick} aria-label="Mở thanh điều hướng"><Menu className="size-5" /></Button>
      <div className="hidden min-w-0 lg:block"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">Gia phả trực tuyến</p><h1 className="mt-1 truncate font-display text-xl font-semibold text-stone-900">{sectionNames[activeSection]}</h1></div>
      <div className="relative ml-auto hidden w-full max-w-md md:block"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" /><Input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Tìm nhanh thành viên..." className="h-11 rounded-2xl bg-white pl-10 pr-10" aria-label="Tìm nhanh thành viên" />{searchQuery && <button onClick={() => onSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-stone-400 hover:bg-stone-100" aria-label="Xóa tìm kiếm"><X className="size-3.5" /></button>}{searchQuery.trim() && <SearchResults results={safeResults} onSelect={(member) => { onSelectMember(member); onSearchChange(""); }} />}</div>
      <FamilySwitcher familyName={familyName} onFamilyChange={onFamilyChange} />
      {permissions.canViewPrivateData && <ReminderMenu members={members} onSelectMember={onSelectMember} onNavigate={onNavigate} />}
      <AccountMenu onNavigate={onNavigate} onLogin={() => setLoginOpen(true)} />
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
    <div className="border-t border-stone-200/70 px-4 py-2 md:hidden"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" /><Input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Tìm nhanh thành viên..." className="h-10 bg-white pl-9 pr-9" aria-label="Tìm nhanh thành viên trên mobile" />{searchQuery && <button onClick={() => onSearchChange("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400" aria-label="Xóa tìm kiếm"><X className="size-3.5" /></button>}</div>{searchQuery.trim() && <SearchResults results={safeResults} onSelect={(member) => { onSelectMember(member); onSearchChange(""); }} mobile />}{!user && <button onClick={() => setLoginOpen(true)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-wine/20 bg-wine/5 py-2 text-xs font-semibold text-wine"><LogIn className="size-3.5" />Đăng nhập tài khoản dòng họ</button>}</div>
  </header>;
}

function SearchResults({ results, onSelect, mobile = false }: { results: FamilyMember[]; onSelect: (member: FamilyMember) => void; mobile?: boolean }) {
  return <div className={cnSearchResults(mobile)}>{results.length ? results.map((member) => <button key={member.id} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-wine/8" onClick={() => onSelect(member)}><Avatar className="size-8"><AvatarFallback className="bg-gold-soft text-[10px] text-gold-deep">{member.initials}</AvatarFallback></Avatar><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-stone-800">{member.name}</span><span className="block text-[11px] text-stone-400">Đời {member.generation}{isPublicMember(member) ? "" : ` · ${member.role}`}</span></span></button>) : <p className="px-3 py-4 text-center text-sm text-stone-500">Không tìm thấy thành viên phù hợp.</p>}</div>;
}
function cnSearchResults(mobile: boolean) { return mobile ? "mt-2 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg" : "absolute left-0 right-0 top-[3.25rem] z-50 overflow-hidden rounded-2xl border border-stone-200 bg-white p-1.5 shadow-xl"; }

function FamilySwitcher({ familyName, onFamilyChange }: { familyName: string; onFamilyChange: (value: string) => void }) {
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="hidden h-11 max-w-[220px] shrink-0 justify-between px-3.5 lg:flex xl:max-w-[260px]" aria-label="Chuyển đổi gia tộc"><span className="min-w-0 truncate text-left text-xs font-semibold">{familyName}</span><ChevronDown className="size-4 shrink-0 text-stone-400" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-64"><DropdownMenuLabel>Gia tộc của bạn</DropdownMenuLabel><DropdownMenuItem onSelect={() => onFamilyChange("Gia phả Họ Nguyễn — Chi 3")}><span className="mr-2 size-2 rounded-full bg-wine" />Gia phả Họ Nguyễn — Chi 3<DropdownMenuShortcut>Hiện tại</DropdownMenuShortcut></DropdownMenuItem><DropdownMenuItem onSelect={() => onFamilyChange("Gia phả Họ Nguyễn — Chi 2")}><span className="mr-2 size-2 rounded-full bg-gold" />Gia phả Họ Nguyễn — Chi 2</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => onFamilyChange("Thêm gia tộc của bạn")}><span className="mr-2 flex size-5 items-center justify-center rounded-md bg-stone-100 text-stone-500">+</span>Thêm gia tộc</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}

function ReminderMenu({ members, onSelectMember, onNavigate }: { members: FamilyMember[]; onSelectMember: (member: FamilyMember) => void; onNavigate: (section: AppSection) => void }) {
  const first = members.find((member) => member.id === "van-thanh");
  const second = members.find((member) => member.id === "nga");
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="relative size-10 shrink-0 rounded-xl text-stone-600 hover:bg-wine/8 hover:text-wine" aria-label="Xem nhắc giỗ sắp tới"><Bell className="size-[19px]" /><span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full border-2 border-[#f8f7f4] bg-wine text-[9px] font-bold text-white">2</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-80 p-2"><div className="flex items-center justify-between px-2 py-1.5"><p className="font-display text-base font-semibold text-stone-900">Nhắc giỗ sắp tới</p><Badge variant="softWine">2 việc</Badge></div><DropdownMenuSeparator />{first && <DropdownMenuItem className="items-start gap-3 py-3" onSelect={() => onSelectMember(first)}><span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-gold-soft text-gold-deep"><CalendarDays className="size-4" /></span><span><span className="block text-sm font-semibold text-stone-800">Giỗ cụ Nguyễn Văn Thành</span><span className="mt-0.5 block text-xs text-stone-500">Còn 5 ngày · 19 / 08 âm lịch</span></span></DropdownMenuItem>}{second && <DropdownMenuItem className="items-start gap-3 py-3" onSelect={() => onSelectMember(second)}><span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-wine/8 text-wine"><CalendarDays className="size-4" /></span><span><span className="block text-sm font-semibold text-stone-800">Giỗ bà Nguyễn Thị Nga</span><span className="mt-0.5 block text-xs text-stone-500">Còn 12 ngày · 05 / 11 âm lịch</span></span></DropdownMenuItem>}<DropdownMenuSeparator /><DropdownMenuItem onSelect={() => onNavigate("calendar")} className="justify-center text-xs font-semibold text-wine">Xem tất cả ngày giỗ <span className="ml-1">→</span></DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}

function AccountMenu({ onNavigate, onLogin }: { onNavigate: (section: AppSection) => void; onLogin: () => void }) {
  const { currentRole, permissions, user, isInitializing } = useAuth();
  const [logoutMutation, logoutState] = useLogoutMutation();
  const [profileOpen, setProfileOpen] = useState(false);
  const roleLabel = currentRole === "admin" ? "Trưởng tộc · Admin" : roleLabels[currentRole];
  const displayName = user?.name ?? "Khách dòng họ";
  const initials = displayName.split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase();
  const logout = async () => { try { await logoutMutation().unwrap(); } catch (error) { console.error(getApiErrorMessage(error, "Không thể đăng xuất khỏi máy chủ.")); } };
  return <>
  <DropdownMenu><DropdownMenuTrigger asChild><button className="flex items-center gap-2.5 rounded-xl p-1.5 text-left transition hover:bg-stone-100" aria-label={user ? "Mở menu tài khoản" : "Đăng nhập"}><Avatar className="size-9 ring-2 ring-white"><AvatarFallback className="bg-wine text-xs text-white">{user ? initials : <LogIn className="size-4" />}</AvatarFallback></Avatar><span className="hidden min-w-0 xl:block"><span className="block max-w-[110px] truncate text-xs font-semibold text-stone-800">{isInitializing ? "Đang kiểm tra..." : displayName}</span><span className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-wine"><span className="size-1.5 rounded-full bg-wine" />{user ? roleLabel : "Chưa đăng nhập"}</span></span><ChevronDown className="hidden size-3.5 text-stone-400 xl:block" /></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-56"><DropdownMenuLabel><span className="block text-xs text-stone-800">{displayName}</span><span className="mt-0.5 block text-[10px] font-normal text-stone-400">{user?.email ?? "Xem dữ liệu công khai"}</span></DropdownMenuLabel><DropdownMenuSeparator />{user ? <><DropdownMenuItem onSelect={() => setProfileOpen(true)}><UserRound className="mr-2 size-4" />Hồ sơ cá nhân</DropdownMenuItem>{permissions.canManagePendingEdits && <DropdownMenuItem onSelect={() => onNavigate("management")}><span className="mr-2 size-4">⚙</span>Cài đặt tài khoản</DropdownMenuItem>}<DropdownMenuSeparator /><DropdownMenuItem disabled={logoutState.isLoading} className="text-red-600 focus:bg-red-50 focus:text-red-700" onSelect={() => void logout()}><LogOut className="mr-2 size-4" />Đăng xuất</DropdownMenuItem></> : <DropdownMenuItem onSelect={onLogin}><LogIn className="mr-2 size-4" />Đăng nhập</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu>
  <PersonalProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
  </>;
}
