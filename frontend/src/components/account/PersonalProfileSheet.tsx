import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { useLogoutMutation } from "../../app/authApi";
import { roleLabels, useAuth } from "../../context/AuthContext";
import { EMPTY_PROFILE_VALUE, formatProfileDateValueOrEmpty, formatProfileHometownValue, lunarLabel } from "../../lib/memberProfileFormat";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet";

interface PersonalProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Hồ sơ cá nhân của tài khoản đang đăng nhập.
 *
 * Thứ tự thể hiện là yêu cầu nghiệp vụ của gia phả: Họ và tên → Quê quán →
 * Ngày sinh → Ngày mất (chưa mất thì để "-"). Ngày hiển thị dương lịch kèm
 * can - chi của NĂM ÂM do backend tính, ví dụ "21/05/1962 (Nhâm Dần)".
 */
export function PersonalProfileSheet({ open, onOpenChange }: PersonalProfileSheetProps) {
  const { user, currentRole, permissions } = useAuth();
  const [logout, { isLoading: loggingOut }] = useLogoutMutation();
  if (!user) return null;

  const member = user.member ?? null;
  const birthDate = formatProfileDateValueOrEmpty({
    solarDate: member?.birth_date_solar,
    zodiac: member?.birth_zodiac,
    lunarLabel: lunarLabel(member?.birth_day_lunar, member?.birth_month_lunar, member?.birth_year_lunar),
  });
  const deathDate = formatProfileDateValueOrEmpty({
    solarDate: member?.death_date_solar,
    zodiac: member?.death_zodiac,
    lunarLabel: lunarLabel(member?.death_day_lunar, member?.death_month_lunar, member?.death_year_lunar),
  });
return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="right" className="w-full p-0 sm:max-w-[31rem]">
      <SheetHeader className="sr-only">
        <SheetTitle>Hồ sơ cá nhân</SheetTitle>
        <SheetDescription>Thông tin tài khoản và hồ sơ thành viên của bạn.</SheetDescription>
      </SheetHeader>
      <ProfileHero name={user.name} email={user.email} />
      <div className="thin-scrollbar flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
        <section aria-labelledby="personal-core">
          <SectionTitle id="personal-core">Thông tin ưu tiên</SectionTitle>
          <p className="mt-1 text-xs leading-5 text-stone-500">Họ và tên, quê quán, ngày sinh và ngày mất — hiển thị theo đúng thứ tự này ở mọi hồ sơ.</p>
          <dl className="mt-3 grid gap-3">
            <ProfileRow label="Họ và tên" value={member?.full_name || user.name} />
            <ProfileRow label="Quê quán" value={formatProfileHometownValue(member?.birthplace)} />
            <ProfileRow label="Ngày sinh" value={birthDate} />
            <ProfileRow label="Ngày mất" value={deathDate} />
          </dl>
        </section>
        <Separator />
        <section aria-labelledby="personal-account">
          <SectionTitle id="personal-account">Tài khoản đăng nhập</SectionTitle>
          <dl className="mt-3 grid gap-3">
            <ProfileRow label="Email" value={user.email} />
            <ProfileRow label="Điện thoại" value={user.phone?.trim() || EMPTY_PROFILE_VALUE} />
            <ProfileRow label="Vai trò" value={roleLabels[currentRole]} />
            <ProfileRow label="Liên kết cây gia phả" value={member ? `Đời thứ ${member.generation} · ${member.full_name}` : "Chưa liên kết thành viên nào"} />
          </dl>
        </section>
        <MemberHint linked={Boolean(member)} canSuggest={permissions.canSuggestEdits} />
        <div className="mt-auto flex flex-col gap-2 pt-2">
          <Button variant="outline" className="w-full text-red-600 hover:bg-red-50" disabled={loggingOut} onClick={() => void logout()}><LogOut className="size-4" />{loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>;
}

function MemberHint({ linked, canSuggest }: { linked: boolean; canSuggest: boolean }) {
  if (!linked) return <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs leading-5 text-amber-800">Tài khoản chưa liên kết với nút thành viên nào trên cây. Liên kết để họ và tên, quê quán, ngày sinh và ngày mất hiển thị theo dữ liệu gia phả.</p>;
  return <p className="rounded-2xl border border-stone-200 bg-stone-50 p-3.5 text-xs leading-5 text-stone-600">Muốn sửa quê quán hoặc ngày sinh/ngày mất? Vào <b>Danh sách thành viên</b>, tìm tên bạn rồi chọn <b>Sửa</b>. {canSuggest ? "Bạn gửi đề xuất để Ban quản trị duyệt trước khi áp dụng." : "Ban quản trị duyệt trước khi áp dụng."}</p>;
}

function SectionTitle({ id, children }: { id: string; children: ReactNode }) {
  return <h3 id={id} className="text-sm font-bold text-stone-800">{children}</h3>;
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start gap-3 rounded-xl bg-stone-50 px-3.5 py-3"><div className="min-w-0"><dt className="text-[11px] text-stone-400">{label}</dt><dd className="mt-0.5 break-words text-sm font-medium text-stone-700">{value}</dd></div></div>;
}

function ProfileHero({ name, email }: { name: string; email: string }) {
  const initials = name.split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase();
  return <div className="relative overflow-hidden bg-[#4e1015] px-6 pb-6 pt-7 text-white"><div className="absolute -right-12 -top-16 size-48 rounded-full border border-[#d7b45c]/20" /><div className="relative"><Badge className="mb-4 border border-white/15 bg-white/10 text-[#f5d98e]">Hồ sơ cá nhân</Badge><div className="flex items-end gap-4"><Avatar className="size-[68px] border-4 border-white/20 shadow-xl"><AvatarFallback className="bg-wine text-sm text-white">{initials}</AvatarFallback></Avatar><div className="min-w-0 pb-1"><p className="font-display text-xl font-semibold leading-tight text-white">{name}</p><p className="mt-1 truncate text-xs text-stone-300">{email}</p></div></div></div></div>;
}