import { MASKED_VALUE } from "./rbacFilter";
import type { FamilyMember } from "./mock-data";

/** Nhãn hiển thị khi một mục hồ sơ chưa có dữ liệu, ví dụ thành viên còn sống. */
export const EMPTY_PROFILE_VALUE = "-";

/** Rỗng, không ghi nhận, hoặc đã bị masking cho Guest — đều không phải ngày hợp lệ. */
function isBlank(value: string | null | undefined): boolean {
  const text = value?.trim() ?? "";
  return text === "" || text === MASKED_VALUE || text === "Không ghi nhận";
}

/**
 * Định dạng ngày kiểu Việt Nam: "21/05/1962".
 *
 * Cố tình KHÔNG dùng `new Date(iso)` vì chuỗi "1962-05-21" được JS parse theo giờ
 * địa phương, dễ lệch một ngày ở múi giờ âm (UTC-7 của Việt Nam) và làm ngày
 * giỗ/ngày sinh hiển thị sai. Tách thủ công từng thành phần là an toàn tuyệt đối.
 */
export function formatVietnameseDate(isoDate: string | null | undefined): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate?.trim() ?? "");
  return match ? `${match[3]}/${match[2]}/${match[1]}` : null;
}

/** Đầu vào tối giản cho một mốc ngày của hồ sơ. */
export interface ProfileDateInput {
  solarDate?: string | null;
  zodiac?: string | null;
  lunarLabel?: string | null;
}

/**
 * Ngày sinh / ngày mất theo định dạng ưu tiên của gia phả:
 * "21/05/1962 (Mậu Thân)" — năm dương kèm can - chi của NĂM ÂM do backend tính.
 *
 * Khi chưa có ngày dương thì lùi về ngày âm đã ghi nhận; chưa có gì thì trả
 * null để caller hiển thị EMPTY_PROFILE_VALUE ("-") thay vì in chuỗi rỗng.
 */
export function formatProfileDateValue({ solarDate, zodiac, lunarLabel }: ProfileDateInput): string | null {
  const solarText = isBlank(solarDate) ? null : formatVietnameseDate(solarDate);
  if (solarText) return zodiac?.trim() ? `${solarText} (${zodiac.trim()})` : solarText;
  // Chỉ lùi về ngày âm khi ngày âm thực sự có dữ liệu (không phải chuỗi masking).
  if (isBlank(lunarLabel)) return null;
  const lunarText = lunarLabel!.trim();
  return zodiac?.trim() ? `${lunarText} (${zodiac.trim()})` : lunarText;
}

/** Nhãn âm lịch "03 / 06 / 1898 âm lịch" khi đủ ngày/tháng/năm. */
export function lunarLabel(day?: number | null, month?: number | null, year?: number | null): string | null {
  return day && month && year ? `${day} / ${month} / ${year} âm lịch` : null;
}

/** Ngày ưu tiên của hồ sơ, luôn có giá trị hiển thị (không có thì "-"). */
export function formatProfileDateValueOrEmpty(input: ProfileDateInput): string {
  return formatProfileDateValue(input) ?? EMPTY_PROFILE_VALUE;
}

/** Quê quán, luôn có giá trị hiển thị (không có thì "-"). */
export function formatProfileHometownValue(birthplace: string | null | undefined): string {
  return isBlank(birthplace) ? EMPTY_PROFILE_VALUE : birthplace!.trim();
}

/** Quê quán của một thành viên trên cây gia phả. */
export function formatProfileHometown(member: FamilyMember): string {
  return formatProfileHometownValue(member.birthplace);
}

/** Ngày sinh / ngày mất của một thành viên trên cây gia phả. */
export function formatProfileDateOrEmpty(member: FamilyMember, kind: "birth" | "death"): string {
  return formatProfileDateValueOrEmpty(kind === "birth"
    ? { solarDate: member.birthDateSolar, zodiac: member.birthZodiac, lunarLabel: member.birthLunar }
    : { solarDate: member.deathDateSolar, zodiac: member.deathZodiac, lunarLabel: member.deathLunar });
}