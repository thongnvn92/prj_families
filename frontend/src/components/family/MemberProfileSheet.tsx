import { CalendarDays, ExternalLink, MapPin, PencilLine, Phone, ShieldAlert, UserRound } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet";
import type { FamilyMember } from "../../lib/mock-data";
import { formatProfileDateOrEmpty, formatProfileHometown } from "../../lib/memberProfileFormat";
import { useAuth } from "../../context/AuthContext";
import { filterMemberForRole, filterMembersForRole, isPublicMember } from "../../lib/rbacFilter";

interface MemberProfileSheetProps {
  member: FamilyMember | null;
  onOpenChange: (open: boolean) => void;
  onSelectMember: (member: FamilyMember) => void;
  allMembers: FamilyMember[];
}

export function MemberProfileSheet({ member: sourceMember, onOpenChange, onSelectMember, allMembers }: MemberProfileSheetProps) {
  const { currentRole, permissions } = useAuth();
  const [notice, setNotice] = useState("");
  const member = sourceMember ? filterMemberForRole(sourceMember, currentRole) : null;
  const safeRelatedMembers = filterMembersForRole(allMembers, currentRole);
  return (
    <Sheet open={Boolean(member)} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-[31rem]">
        {member && (
          <>
            <div className="relative overflow-hidden bg-[#4e1015] px-6 pb-7 pt-7 text-white">
              <div className="absolute -right-12 -top-16 size-48 rounded-full border border-[#d7b45c]/20" />
              <div className="absolute -right-3 -top-7 size-32 rounded-full border border-[#d7b45c]/15" />
              <div className="relative">
                <div className="mb-5 flex items-center justify-between">
                  <Badge className="border border-white/15 bg-white/10 text-[#f5d98e]">{currentRole === "guest" ? "Hồ sơ công khai" : "Hồ sơ thành viên"}</Badge>
                  {currentRole !== "guest" && <span className="text-[11px] text-stone-300">Mã: {member.id.toUpperCase()}</span>}
                </div>
                <div className="flex items-end gap-4">
                  <Avatar className="size-[76px] border-4 border-white/20 shadow-xl">
                    <AvatarFallback className={avatarClass(member.avatarTone)}>{member.initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 pb-1">
                    <h2 className="font-display text-2xl font-semibold leading-tight text-white">{member.name}</h2>
                    <p className="mt-1.5 text-sm text-stone-300">{isPublicMember(member) ? `Đời thứ ${member.generation}` : `${member.role} · Đời thứ ${member.generation}`}</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2 text-xs text-stone-200">
                  <span className="rounded-lg bg-white/10 px-2.5 py-1.5">{member.birthYear} — {member.deathYear ?? "nay"}</span>
                  {currentRole !== "guest" && <><span className="rounded-lg bg-white/10 px-2.5 py-1.5">{member.gender === "male" ? "Nam" : "Nữ"}</span><span className="rounded-lg bg-white/10 px-2.5 py-1.5">{member.isAlive ? "Đang sống" : "Đã mất"}</span></>}
                </div>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-6 px-6 py-6">
              <SheetHeader className="sr-only">
                <SheetTitle>Hồ sơ {member.name}</SheetTitle>
                <SheetDescription>Thông tin chi tiết về thành viên {member.name}</SheetDescription>
              </SheetHeader>
              {permissions.canViewPrivateData ? <>
              <div>
                <SectionHeading title="Thông tin cốt lõi" icon={<UserRound className="size-4" />} />
                <p className="mt-1 text-xs leading-5 text-stone-500">Bốn thông tin ưu tiên của hồ sơ: họ và tên, quê quán, ngày sinh và ngày mất.</p>
                <div className="mt-3 grid gap-3">
                  <InfoRow icon={<UserRound className="size-4" />} label="Họ và tên" value={member.name} />
                  <InfoRow icon={<MapPin className="size-4" />} label="Quê quán" value={formatProfileHometown(member)} />
                  <InfoRow icon={<CalendarDays className="size-4" />} label="Ngày sinh" value={formatProfileDateOrEmpty(member, "birth")} />
                  <InfoRow icon={<CalendarDays className="size-4" />} label="Ngày mất" value={formatProfileDateOrEmpty(member, "death")} />
                </div>
              </div>
              <Separator />
              <div>
                <SectionHeading title="Thông tin liên hệ & Âm lịch" icon={<Phone className="size-4" />} />
                <div className="mt-3 grid gap-3">
                  <InfoRow icon={<Phone className="size-4" />} label="Điện thoại" value={member.phone || "-"} />
                  <InfoRow icon={<CalendarDays className="size-4" />} label="Ngày sinh âm lịch" value={member.birthLunar} />
                  {member.deathLunar && <InfoRow icon={<CalendarDays className="size-4" />} label="Ngày giỗ âm lịch" value={member.deathLunar} />}
                </div>
              </div>
              <Separator />
              <div>
                <SectionHeading title="Nơi cư ngụ & Mộ phần" icon={<MapPin className="size-4" />} />
                <div className="mt-3 rounded-2xl border border-stone-200 bg-stone-50 p-3.5">
                  <p className="text-sm font-medium leading-6 text-stone-700">{member.address}</p>
                  <p className="mt-1 text-xs leading-5 text-stone-500">{member.isAlive ? "Địa chỉ liên hệ hiện tại" : "Vị trí mộ phần trong khu di tích gia tộc"}</p>
                  <Button asChild variant="outline" size="sm" className="mt-3 border-gold/30 bg-white text-gold-deep hover:bg-gold-soft">
                    <a href={member.burialMapUrl} target="_blank" rel="noreferrer"><MapPin className="size-3.5" />Mở trên Google Maps<ExternalLink className="ml-1 size-3" /></a>
                  </Button>
                </div>
              </div>
              <Separator />
              <div>
                <SectionHeading title="Tiểu sử" icon={<UserRound className="size-4" />} />
                <p className="mt-3 text-sm leading-7 text-stone-600">{member.bio}</p>
              </div>
              </> : <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center gap-2 text-sm font-semibold text-amber-800"><ShieldAlert className="size-4" />Thông tin riêng tư đã được bảo vệ</div><p className="mt-2 text-xs leading-5 text-amber-700">Khách chỉ xem tên, đời thứ, năm sinh/mất và các mối quan hệ trong cây thu gọn.</p></div>}
              <RelatedMembers member={member} allMembers={safeRelatedMembers} onSelectMember={onSelectMember} />
              {permissions.canSuggestEdits && <div className="rounded-2xl border border-stone-200 bg-white p-3"><Button variant="outline" className="w-full" onClick={() => setNotice(permissions.canDirectlyEdit ? "Đã mở chế độ chỉnh sửa trực tiếp cho phạm vi được giao." : "Đã mở phiếu đề xuất cập nhật để Mod/Admin xem xét.")}><PencilLine className="size-4" />{permissions.canDirectlyEdit ? "Chỉnh sửa trực tiếp" : "Đề xuất chỉnh sửa"}</Button>{notice && <p className="mt-2 text-xs font-medium text-emerald-700">{notice}</p>}</div>}
              <div className="mt-auto rounded-2xl border border-gold/20 bg-gold-soft/60 p-4">
                <p className="text-xs font-semibold text-gold-deep">Ghi chú bảo mật</p>
                <p className="mt-1 text-xs leading-5 text-stone-600">{currentRole === "guest" ? "Bạn đang xem chế độ công khai; dữ liệu liên hệ đã được che mờ." : "Thông tin liên hệ chỉ hiển thị với vai trò nội bộ được cấp quyền."}</p>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function SectionHeading({ title, icon }: { title: string; icon: ReactNode }) { return <div className="flex items-center gap-2 text-sm font-bold text-stone-800"><span className="flex size-7 items-center justify-center rounded-lg bg-wine/8 text-wine">{icon}</span>{title}</div>; }
function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div className="flex items-start gap-3 rounded-xl bg-stone-50 px-3.5 py-3"><span className="mt-0.5 text-stone-400">{icon}</span><div><p className="text-[11px] text-stone-400">{label}</p><p className="mt-0.5 text-sm font-medium text-stone-700">{value}</p></div></div>; }
function RelatedMembers({ member, allMembers, onSelectMember }: { member: FamilyMember; allMembers: FamilyMember[]; onSelectMember: (member: FamilyMember) => void }) { const related = [member.fatherId, member.motherId, member.spouseId].filter(Boolean).map((id) => allMembers.find((item) => item.id === id)).filter((item): item is FamilyMember => Boolean(item)); if (!related.length) return null; return <div><SectionHeading title="Người thân trực hệ" icon={<UserRound className="size-4" />} /><div className="mt-3 space-y-2">{related.map((item) => <button key={item.id} onClick={() => onSelectMember(item)} className="flex w-full items-center gap-3 rounded-xl border border-stone-200 px-3 py-2.5 text-left hover:border-wine/30 hover:bg-wine/5"><Avatar className="size-8"><AvatarFallback className={avatarClass(item.avatarTone)}>{item.initials}</AvatarFallback></Avatar><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-stone-700">{item.name}</span><span className="block text-[11px] text-stone-400">{isPublicMember(item) ? `Đời thứ ${item.generation}` : item.role}</span></span><span>→</span></button>)}</div></div>; }
function avatarClass(tone: FamilyMember["avatarTone"]) { return tone === "wine" ? "bg-wine text-white" : tone === "amber" ? "bg-gold-soft text-gold-deep" : tone === "sage" ? "bg-sage-soft text-sage" : "bg-stone-200 text-stone-600"; }

