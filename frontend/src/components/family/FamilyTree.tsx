import { useState } from "react";
import { Eye, EyeOff, Filter, Maximize2, Search, SlidersHorizontal, Sparkles, UsersRound, ZoomIn, ZoomOut } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import type { FamilyMember } from "../../lib/mock-data";
import { normalizeText } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";
import { filterMembersForRole } from "../../lib/rbacFilter";
import { CalendarIcon, GenerationView, MetricCard, RootMember, TreeCanvas } from "./TreeCanvas";

interface Props { members: FamilyMember[]; searchQuery: string; onSelectMember: (member: FamilyMember) => void; }
export function FamilyTree({ members: sourceMembers, searchQuery, onSelectMember }: Props) {
  const { currentRole } = useAuth();
  const members = filterMembersForRole(sourceMembers, currentRole);
  const [zoom, setZoom] = useState(0.82);
  const [showDeceased, setShowDeceased] = useState(true);
  const [generation, setGeneration] = useState("all");
  const [localSearch, setLocalSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const search = localSearch || searchQuery;
  const normalized = normalizeText(search.trim());
  const matches = (member: FamilyMember) => !normalized || normalizeText(`${member.name} ${member.role} ${member.birthYear}`).includes(normalized);
  const selectedGeneration = generation === "all" ? null : Number(generation);
  const generationMembers = selectedGeneration ? members.filter((member) => member.generation === selectedGeneration && (showDeceased || member.isAlive)) : [];
  const root = RootMember(members);
  const count = members.filter((member) => (showDeceased || member.isAlive) && matches(member)).length;
  if (!root) return <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/60 px-6 text-center" role="status"><h2 className="font-display text-xl font-semibold text-stone-800">Chưa có dữ liệu cây gia phả</h2><p className="mt-2 max-w-md text-sm text-stone-500">Hãy thử tải lại dữ liệu. Nếu tài khoản chưa có quyền xem nhánh này, bạn có thể chỉ thấy phần dữ liệu công khai.</p></div>;
  return <div className="space-y-5">
    {currentRole === "guest" && <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"><span className="text-lg">◈</span><div><p className="text-sm font-semibold text-amber-800">Chế độ khách đang hoạt động</p><p className="mt-1 text-xs leading-5 text-amber-700">Cây chỉ hiển thị tên, đời thứ, năm sinh/mất và quan hệ công khai. Số điện thoại, địa chỉ, mộ phần và bản đồ đã được bảo vệ.</p></div><Badge variant="outline" className="ml-auto shrink-0 border-amber-200 bg-white text-amber-700">Guest</Badge></div>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard icon={<UsersRound className="size-5" />} value={members.length} label="Thành viên" note={currentRole === "guest" ? "Dữ liệu công khai" : `${members.filter((member) => member.isAlive).length} đang sống`} tone="wine" />
      <MetricCard icon={<Sparkles className="size-5" />} value={Math.max(0, ...members.map((member) => member.generation))} label="Thế hệ" note="Từ Thủy Tổ đến thế hệ thứ 5" tone="gold" />
      <MetricCard icon={<span className="text-lg">♧</span>} value="1898" label="Năm khởi thủy" note="Dòng họ Họ Nguyễn" tone="sage" />
      {currentRole === "guest" ? <MetricCard icon={<UsersRound className="size-5" />} value={members.length} label="Quan hệ" note="Cây gia phả thu gọn" tone="amber" /> : <MetricCard icon={<CalendarIcon />} value="05 / 09" label="Giỗ sắp tới" note="Cụ Nguyễn Văn Thành" tone="amber" />}
    </div>
    <Card className="overflow-hidden border-0 shadow-[0_12px_40px_rgba(28,25,23,0.06)]">
      <TreeHeader root={root} publicOnly={currentRole === "guest"} onSelect={onSelectMember} />
      <TreeToolbar search={search} setSearch={setLocalSearch} generation={generation} setGeneration={setGeneration} showDeceased={showDeceased} setShowDeceased={setShowDeceased} showFilter={showFilter} setShowFilter={setShowFilter} zoom={zoom} setZoom={setZoom} />
      {showFilter && <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b bg-white px-4 py-3 text-xs text-stone-500 sm:px-6"><span className="font-semibold text-stone-700">Đang lọc:</span><span>{count} thành viên phù hợp</span><span>·</span><span>{showDeceased ? "Hiện đầy đủ người đã mất" : "Ẩn người đã mất"}</span><span>·</span><span>{selectedGeneration ? `Đời thứ ${selectedGeneration}` : "Tất cả các đời"}</span></div>}
      <TreeLegend publicOnly={currentRole === "guest"} /><TreeCanvasArea members={members} root={root} generation={selectedGeneration} generationMembers={generationMembers} showDeceased={showDeceased} search={search} zoom={zoom} setGeneration={setGeneration} onSelect={onSelectMember} />
      <TreeFooter members={members} />
    </Card>
  </div>;
}

function TreeToolbar({ search, setSearch, generation, setGeneration, showDeceased, setShowDeceased, showFilter, setShowFilter, zoom, setZoom }: { search: string; setSearch: (value: string) => void; generation: string; setGeneration: (value: string) => void; showDeceased: boolean; setShowDeceased: (value: boolean) => void; showFilter: boolean; setShowFilter: (value: (old: boolean) => boolean) => void; zoom: number; setZoom: (value: (old: number) => number) => void }) {
  return <div className="flex flex-col gap-3 border-b border-stone-200/80 bg-[#fcfbf9] px-4 py-3.5 sm:px-6 xl:flex-row xl:items-center"><div className="relative min-w-0 flex-1 xl:max-w-[330px]"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm trên cây gia phả..." className="h-10 bg-white pl-9 pr-9" aria-label="Tìm thành viên trên cây gia phả" />{search && <button className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-stone-400" onClick={() => setSearch("")} aria-label="Xóa tìm kiếm trên cây">×</button>}</div><div className="flex flex-wrap items-center gap-2"><Select value={generation} onValueChange={setGeneration}><SelectTrigger className="h-10 w-[148px] bg-white text-xs"><Filter className="mr-1 size-3.5 text-stone-400" /><SelectValue placeholder="Tất cả các đời" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả các đời</SelectItem>{[1, 2, 3, 4, 5].map((item) => <SelectItem key={item} value={String(item)}>Đời thứ {item}</SelectItem>)}</SelectContent></Select><Button variant="outline" size="sm" className="h-10 px-3" onClick={() => setShowFilter((value) => !value)}><SlidersHorizontal className="size-3.5" />Bộ lọc</Button><div className="hidden h-7 w-px bg-stone-200 sm:block" /><div className="flex h-10 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3">{showDeceased ? <Eye className="size-3.5 text-stone-500" /> : <EyeOff className="size-3.5 text-stone-500" />}<span className="text-xs font-medium text-stone-600">Người đã mất</span><Switch checked={showDeceased} onCheckedChange={setShowDeceased} aria-label="Ẩn hoặc hiện người đã mất" /></div></div><div className="flex items-center gap-1 rounded-xl border border-stone-200 bg-white p-1"><Button variant="ghost" size="icon-sm" onClick={() => setZoom((value) => Math.max(0.55, Number((value - 0.1).toFixed(2))))} aria-label="Thu nhỏ cây"><ZoomOut className="size-3.5" /></Button><span className="min-w-[42px] text-center text-[11px] font-semibold text-stone-500">{Math.round(zoom * 100)}%</span><Button variant="ghost" size="icon-sm" onClick={() => setZoom((value) => Math.min(1.15, Number((value + 0.1).toFixed(2))))} aria-label="Phóng to cây"><ZoomIn className="size-3.5" /></Button><div className="mx-0.5 h-5 w-px bg-stone-200" /><Button variant="ghost" size="icon-sm" onClick={() => setZoom(() => 0.82)} aria-label="Đặt lại tỷ lệ"><Maximize2 className="size-3.5" /></Button></div></div>;
}
function TreeCanvasArea({ members, root, generation, generationMembers, showDeceased, search, zoom, setGeneration, onSelect }: { members: FamilyMember[]; root: FamilyMember; generation: number | null; generationMembers: FamilyMember[]; showDeceased: boolean; search: string; zoom: number; setGeneration: (value: string) => void; onSelect: (member: FamilyMember) => void }) { return <div className="thin-scrollbar tree-canvas min-h-[630px] overflow-auto p-5 sm:p-10">{generation ? <GenerationView generation={generation} members={generationMembers} onSelect={onSelect} onReset={() => setGeneration("all")} /> : <TreeCanvas root={root} allMembers={members} showDeceased={showDeceased} searchQuery={search} zoom={zoom} onSelectMember={onSelect} />}</div>; }
function TreeLegend({ publicOnly }: { publicOnly: boolean }) { return <div className="flex items-center gap-2 border-b border-stone-200/70 bg-white px-4 py-2.5 text-xs text-stone-500 sm:px-6"><span className="size-2 rounded-full bg-wine" />{publicOnly ? "Dữ liệu công khai" : "Đang hiển thị dòng chính"}{!publicOnly && <><span className="ml-2 size-2 rounded-full bg-gold" />Thành viên đã mất</>}</div>; }
function TreeFooter({ members }: { members: FamilyMember[] }) { return <div className="flex flex-col gap-2 border-t border-stone-200/80 bg-[#fcfbf9] px-4 py-3 text-[11px] text-stone-400 sm:flex-row sm:items-center sm:justify-between sm:px-6"><span>Đơn vị dữ liệu: Họ Nguyễn · Chi 3</span><span>Dữ liệu đã đồng bộ · {members.length} thành viên</span></div>; }

function TreeHeader({ root, publicOnly, onSelect }: { root: FamilyMember; publicOnly: boolean; onSelect: (member: FamilyMember) => void }) { return <div className="border-b border-stone-200/80 bg-gradient-to-r from-white to-[#fdfcf9] px-4 py-5 sm:px-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge variant="gold">Dữ liệu minh hoạ</Badge><span className="text-xs text-stone-400">Cập nhật gần nhất: 28/08/2026</span></div><h2 className="mt-2 font-display text-2xl font-semibold text-stone-900 sm:text-3xl">Dòng họ Nguyễn · Chi 3</h2><p className="mt-1.5 max-w-2xl text-sm leading-6 text-stone-500">Khám phá gốc tích, các thế hệ và cơ cấu gia đình. Nhấn vào một thành viên để xem hồ sơ chi tiết.</p></div><Button className="w-full shrink-0 sm:w-auto" onClick={() => onSelect(root)}><span className="text-base">♧</span>{publicOnly ? "Xem dòng gốc" : "Xem Thủy Tổ"}</Button></div></div>; }

