import { lazy, Suspense, useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "./components/ui/sheet";
import { Header } from "./components/layout/Header";
import { Sidebar, type AppSection } from "./components/layout/Sidebar";
import { FamilyTree } from "./components/family/FamilyTree";
import { MemberProfileSheet } from "./components/family/MemberProfileSheet";
import { useGetMembersQuery } from "./app/memberApi";
import type { FamilyMember } from "./lib/mock-data";
import { cn } from "./lib/utils";
import { useAuth } from "./context/AuthContext";
import { canAccessSection, filterMemberForRole, filterMembersForRole } from "./lib/rbacFilter";
import { useFamilySettings } from "./lib/useFamilySettings";

const MemberDirectoryView = lazy(() => import("./components/directory/MemberDirectoryView").then((module) => ({ default: module.MemberDirectoryView })));
const LunarCalendarView = lazy(() => import("./components/calendar/LunarCalendarView").then((module) => ({ default: module.LunarCalendarView })));
const FamilyAlbumView = lazy(() => import("./components/album/FamilyAlbumView").then((module) => ({ default: module.FamilyAlbumView })));
const FamilyChatView = lazy(() => import("./components/chat/FamilyChatView").then((module) => ({ default: module.FamilyChatView })));
const ClanAiAssistant = lazy(() => import("./components/ai/ClanAiAssistant").then((module) => ({ default: module.ClanAiAssistant })));
const PrayerLibraryView = lazy(() => import("./components/prayers/PrayerLibraryView").then((module) => ({ default: module.PrayerLibraryView })));
const PendingEditsManager = lazy(() => import("./components/admin/PendingEditsManager").then((module) => ({ default: module.PendingEditsManager })));
const FamilySettingsPanel = lazy(() => import("./components/admin/FamilySettingsPanel").then((module) => ({ default: module.FamilySettingsPanel })));

const sectionLabels: Record<AppSection, string> = { tree: "Cây gia phả", directory: "Danh sách thành viên", calendar: "Lịch Âm & Nhắc giỗ", gallery: "Album gia đình", chat: "Trò chuyện nội bộ", rituals: "Văn cúng & Nghi lễ", assistant: "Trợ lý AI Gia tộc", management: "Quản lý & Đề xuất", settings: "Cấu hình tính năng" };

function SectionLoading() {
  return <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Đang tải màn hình"><span className="size-7 animate-spin rounded-full border-2 border-wine/20 border-t-wine" /></div>;
}

function renderSection(activeSection: AppSection, members: FamilyMember[], searchQuery: string, onSelectMember: (member: FamilyMember) => void, onSelectMemberId: (memberId: string) => void, onOpenMember: (member: FamilyMember) => void, onMembersChanged: () => Promise<void>) {
  if (activeSection === "tree") return <FamilyTree members={members} searchQuery={searchQuery} onSelectMember={onSelectMember} />;
  if (activeSection === "directory") return <MemberDirectoryView onOpenMember={onOpenMember} onMembersChanged={onMembersChanged} />;
  if (activeSection === "calendar") return <LunarCalendarView />;
  if (activeSection === "gallery") return <FamilyAlbumView />;
  if (activeSection === "chat") return <FamilyChatView members={members} />;
  if (activeSection === "rituals") return <PrayerLibraryView />;
  if (activeSection === "assistant") return <ClanAiAssistant onSelectMember={onSelectMemberId} />;
  if (activeSection === "management") return <PendingEditsManager onMembersChanged={onMembersChanged} />;
  if (activeSection === "settings") return <FamilySettingsPanel />;
  return null;
}

export default function App() {
  const { currentRole, isInitializing } = useAuth();
  const [activeSection, setActiveSection] = useState<AppSection>("tree");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [familyName, setFamilyName] = useState("Gia phả Họ Nguyễn — Chi 3");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const { data: members = [], isLoading: membersLoading, isError: membersError, refetch: refetchMembers } = useGetMembersQuery({ authKey: currentRole }, { skip: isInitializing });
  const { chatEnabled } = useFamilySettings();
  const visibleMembers = filterMembersForRole(members, currentRole);
  useEffect(() => { if (!canAccessSection(currentRole, activeSection)) setActiveSection("tree"); }, [currentRole, activeSection]);
  // Admin có thể tắt chat; người dùng đang mở mục chat phải được đưa về Cây gia phả.
  useEffect(() => { if (!chatEnabled && activeSection === "chat") setActiveSection("tree"); }, [chatEnabled, activeSection]);
  const navigate = (section: AppSection) => { if (!canAccessSection(currentRole, section) || (section === "chat" && !chatEnabled)) { setActiveSection("tree"); return; } setActiveSection(section); setMobileSidebarOpen(false); };
  const openMemberProfile = (member: FamilyMember) => setSelectedMember(visibleMembers.find((item) => item.id === member.id) ?? filterMemberForRole(member, currentRole));
  const selectMember = (member: FamilyMember) => { openMemberProfile(member); setActiveSection("tree"); };
  const refreshMembers = async () => { await refetchMembers(); };

  return <div className="min-h-screen bg-background">
    <aside className={cn("fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-300 lg:block", sidebarCollapsed ? "w-[88px]" : "w-[276px]")}><Sidebar activeSection={activeSection} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((value) => !value)} onNavigate={navigate} /></aside>
    <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}><SheetContent side="left" className="w-[min(88vw,310px)] p-0"><SheetTitle className="sr-only">Điều hướng chính</SheetTitle><Sidebar activeSection={activeSection} onNavigate={navigate} onClose={() => setMobileSidebarOpen(false)} /></SheetContent></Sheet>
    <div className={cn("min-h-screen transition-[padding] duration-300", sidebarCollapsed ? "lg:pl-[88px]" : "lg:pl-[276px]")}>
      <Header activeSection={activeSection} familyName={familyName} members={visibleMembers} searchQuery={searchQuery} onSearchChange={setSearchQuery} onSelectMember={selectMember} onFamilyChange={setFamilyName} onMenuClick={() => setMobileSidebarOpen(true)} onNavigate={navigate} />
      <main className="mx-auto max-w-[1680px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
        {activeSection === "tree" && (membersLoading ? <SectionLoading /> : membersError ? <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">Không tải được dữ liệu thành viên. <Button variant="outline" size="sm" onClick={() => void refetchMembers()}>Thử lại</Button></div> : <FamilyTree members={visibleMembers} searchQuery={searchQuery} onSelectMember={selectMember} />)}
        {activeSection !== "tree" && <Suspense fallback={<SectionLoading />}>{renderSection(activeSection, visibleMembers, searchQuery, selectMember, (memberId) => { const member = visibleMembers.find((item) => item.id === memberId); if (member) openMemberProfile(member); }, openMemberProfile, refreshMembers)}</Suspense>}
      </main>
    </div>
    <MemberProfileSheet member={selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)} onSelectMember={openMemberProfile} allMembers={visibleMembers} />
  </div>;
}


