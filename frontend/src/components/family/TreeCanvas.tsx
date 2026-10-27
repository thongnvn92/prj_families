import { useMemo } from "react";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import type { FamilyMember } from "../../lib/mock-data";
import { cn, normalizeText } from "../../lib/utils";
import { isPublicMember } from "../../lib/rbacFilter";

interface TreeCanvasProps { root: FamilyMember | undefined; allMembers: FamilyMember[]; showDeceased: boolean; searchQuery: string; zoom: number; onSelectMember: (member: FamilyMember) => void; }

export function TreeCanvas({ root, allMembers, showDeceased, searchQuery, zoom, onSelectMember }: TreeCanvasProps) {
  const byId = useMemo(() => new Map(allMembers.map((member) => [member.id, member])), [allMembers]);
  const query = normalizeText(searchQuery.trim());
  const match = (member: FamilyMember) => Boolean(query) && normalizeText(`${member.name} ${member.role} ${member.birthYear}`).includes(query);
  if (!root) return <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/60 px-6 text-center text-sm text-stone-500" role="status">Chưa có dữ liệu thành viên để dựng cây gia phả.</div>;
  return <div className="min-w-[1080px] pb-12 pt-4" style={{ transform: `scale(${zoom})`, transformOrigin: "top center", width: `${100 / zoom}%` }}><Branch member={root} all={allMembers} byId={byId} showDeceased={showDeceased} match={match} onSelect={onSelectMember} /></div>;
}

function Branch({ member, all, byId, showDeceased, match, onSelect }: { member: FamilyMember | undefined; all: FamilyMember[]; byId: Map<string, FamilyMember>; showDeceased: boolean; match: (member: FamilyMember) => boolean; onSelect: (member: FamilyMember) => void }) {
  if (!member) return null;
  const spouse = member.spouseId ? byId.get(member.spouseId) : undefined;
  const children = all.filter((item) => item.fatherId === member.id).filter((item) => showDeceased || item.isAlive);
  const showMember = showDeceased || member.isAlive;
  const showSpouse = spouse && (showDeceased || spouse.isAlive);
  if (!showMember && !showSpouse && children.length === 0) return null;
  return <div className="flex flex-col items-center"><div className="flex items-center gap-3">{showMember && <Node member={member} highlighted={match(member)} onClick={() => onSelect(member)} />}{showSpouse && <><span className="text-[10px] text-stone-400">vợ / chồng</span><Node member={spouse} highlighted={match(spouse)} compact onClick={() => onSelect(spouse)} /></>}</div>{children.length > 0 && <div className="relative mt-8 flex gap-8 before:absolute before:bottom-0 before:left-1/2 before:top-0 before:w-px before:bg-stone-300 after:absolute after:left-6 after:right-6 after:top-0 after:h-px after:bg-stone-300"><div className="relative z-10 flex gap-8 pt-7 before:absolute before:left-1/2 before:top-[-1.75rem] before:h-7 before:w-px before:bg-stone-300">{children.map((child) => <Branch key={child.id} member={child} all={all} byId={byId} showDeceased={showDeceased} match={match} onSelect={onSelect} />)}</div></div>}</div>;
}

function Node({ member, highlighted, onClick, compact = false }: { member: FamilyMember; highlighted: boolean; onClick: () => void; compact?: boolean }) {
  return <button onClick={onClick} aria-label={`Xem hồ sơ ${member.name}`} className={cn("group w-[190px] rounded-2xl border bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-wine/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine/30", compact && "w-[166px]", highlighted ? "border-gold/60 ring-2 ring-gold/15" : "border-stone-200", !member.isAlive && "bg-stone-50/90")}><div className="flex items-center gap-2.5"><Avatar className={cn("size-9 shrink-0", compact && "size-8")}><AvatarFallback className={avatarClass(member.avatarTone)}>{member.initials}</AvatarFallback></Avatar><div className="min-w-0 text-left"><p className={cn("truncate font-semibold text-stone-800", compact ? "text-xs" : "text-sm")}>{member.name}</p><p className="mt-0.5 text-[10px] text-stone-400">Đời {member.generation} · {member.birthYear}{member.deathYear ? ` — ${member.deathYear}` : " — nay"}</p></div></div><div className="mt-2 flex items-center justify-between gap-1.5">{!isPublicMember(member) && <Badge variant={member.role === "Trưởng tộc" || member.role === "Thủy Tổ" ? "softWine" : "secondary"} className="max-w-[145px] truncate px-2 text-[9px]">{member.role}</Badge>}{!isPublicMember(member) && <span className={cn("size-2 rounded-full", member.isAlive ? "bg-emerald-500" : "bg-stone-300")} />}</div></button>;
}
export function GenerationView({ generation, members, onSelect, onReset }: { generation: number; members: FamilyMember[]; onSelect: (member: FamilyMember) => void; onReset: () => void }) { return <div className="mx-auto flex min-w-[600px] max-w-4xl flex-col items-center py-8"><div className="mb-7 text-center"><Badge variant="gold">Đang lọc theo đời</Badge><h3 className="mt-3 font-display text-2xl font-semibold text-stone-900">Thế hệ thứ {generation}</h3><p className="mt-1 text-sm text-stone-500">{members.length} thành viên · Nhấn vào tên để xem hồ sơ</p><Button variant="ghost" size="sm" className="mt-3 text-wine" onClick={onReset}>Xem toàn bộ cây</Button></div><div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{members.map((member) => <Node key={member.id} member={member} highlighted onClick={() => onSelect(member)} />)}</div></div>; }
export function MetricCard({ icon, value, label, note, tone }: { icon: ReactNode; value: string | number; label: string; note: string; tone: "wine" | "gold" | "sage" | "amber" }) { const toneClass = { wine: "bg-wine/8 text-wine", gold: "bg-gold-soft text-gold-deep", sage: "bg-sage-soft text-sage", amber: "bg-amber-50 text-amber-700" }[tone]; return <div className="flex items-center gap-3.5 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm"><span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", toneClass)}>{icon}</span><div className="min-w-0"><p className="text-xl font-bold text-stone-900">{value} <span className="text-sm font-semibold text-stone-500">{label}</span></p><p className="mt-0.5 truncate text-[11px] text-stone-400">{note}</p></div></div>; }
export function avatarClass(tone: FamilyMember["avatarTone"]) { return tone === "wine" ? "bg-wine text-white" : tone === "amber" ? "bg-gold-soft text-gold-deep" : tone === "sage" ? "bg-sage-soft text-sage" : "bg-stone-200 text-stone-600"; }
export function CalendarIcon() { return <span className="relative block size-5 rounded-md border-2 border-current"><span className="absolute left-0 right-0 top-1 h-px bg-current" /><span className="absolute left-1 top-[-3px] h-1.5 w-px bg-current" /><span className="absolute right-1 top-[-3px] h-1.5 w-px bg-current" /></span>; }
export function RootMember(members: FamilyMember[]): FamilyMember | undefined {
  return members.find((member) => !member.fatherId) ?? members[0];
}
