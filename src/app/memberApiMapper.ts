import { MASKED_VALUE } from "../lib/rbacFilter";
import type { AvatarTone, FamilyMember, Gender } from "../lib/mock-data";
import type { MemberFormData } from "../types/memberCrud";

export interface MemberApiRecord {
  id: number;
  family_id?: number;
  full_name: string;
  nickname?: string | null;
  role?: string | null;
  gender?: Gender;
  generation: number;
  order_in_family?: number | null;
  is_alive?: boolean;
  birth_year?: number | null;
  death_year?: number | null;
  birth_date_solar?: string | null;
  birth_day_lunar?: number | null;
  birth_month_lunar?: number | null;
  birth_year_lunar?: number | null;
  death_date_solar?: string | null;
  death_day_lunar?: number | null;
  death_month_lunar?: number | null;
  death_year_lunar?: number | null;
  father_id?: number | null;
  mother_id?: number | null;
  spouse_id?: number | null;
  burial_place?: string | null;
  burial_map_url?: string | null;
  home_map_url?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface MemberListResponse {
  data: MemberApiRecord[];
  meta?: { current_page: number; last_page: number; total: number; per_page: number };
}

export interface MemberResponse {
  data?: MemberApiRecord;
  message?: string;
}

function initials(fullName: string): string {
  return fullName.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join("").toLocaleUpperCase("vi");
}

function lunarLabel(day: number | null | undefined, month: number | null | undefined, year: number | null | undefined, fallback = MASKED_VALUE): string {
  return day && month && year ? `${day} / ${month} / ${year} âm lịch` : fallback;
}

function avatarTone(generation: number): AvatarTone {
  return (["wine", "amber", "sage", "slate"] as AvatarTone[])[Math.max(0, generation - 1) % 4];
}

export function memberFromApi(record: MemberApiRecord): FamilyMember {
  const isPublicRecord = !("phone" in record) || !("address" in record) || record.gender === undefined;
  return {
    id: String(record.id),
    name: record.full_name,
    nickname: record.nickname ?? undefined,
    initials: initials(record.full_name),
    gender: record.gender ?? "other",
    generation: record.generation,
    orderInFamily: record.order_in_family ?? undefined,
    role: record.role ?? "Thành viên",
    birthYear: record.birth_year ?? record.birth_year_lunar ?? 0,
    birthDateSolar: record.birth_date_solar ?? (isPublicRecord ? MASKED_VALUE : ""),
    deathYear: record.death_year ?? record.death_year_lunar ?? undefined,
    deathDateSolar: record.death_date_solar ?? (isPublicRecord ? MASKED_VALUE : ""),
    isAlive: record.is_alive ?? record.death_year == null,
    birthLunar: lunarLabel(record.birth_day_lunar, record.birth_month_lunar, record.birth_year_lunar, isPublicRecord ? MASKED_VALUE : "Không ghi nhận"),
    deathLunar: record.death_day_lunar && record.death_month_lunar && record.death_year_lunar
      ? lunarLabel(record.death_day_lunar, record.death_month_lunar, record.death_year_lunar)
      : isPublicRecord ? MASKED_VALUE : "Không ghi nhận",
    birthDayLunar: record.birth_day_lunar ?? undefined,
    birthMonthLunar: record.birth_month_lunar ?? undefined,
    birthYearLunar: record.birth_year_lunar ?? undefined,
    deathDayLunar: record.death_day_lunar ?? undefined,
    deathMonthLunar: record.death_month_lunar ?? undefined,
    deathYearLunar: record.death_year_lunar ?? undefined,
    fatherId: record.father_id ? String(record.father_id) : undefined,
    motherId: record.mother_id ? String(record.mother_id) : undefined,
    spouseId: record.spouse_id ? String(record.spouse_id) : undefined,
    phone: "phone" in record ? record.phone ?? "" : MASKED_VALUE,
    birthplace: "address" in record ? record.address ?? "" : MASKED_VALUE,
    address: "address" in record ? record.address ?? "" : MASKED_VALUE,
    bio: "bio" in record ? record.bio ?? "" : MASKED_VALUE,
    burialPlace: "burial_place" in record ? record.burial_place ?? undefined : MASKED_VALUE,
    burialMapUrl: "burial_map_url" in record ? record.burial_map_url ?? "" : MASKED_VALUE,
    homeMapUrl: "home_map_url" in record ? record.home_map_url ?? "" : MASKED_VALUE,
    avatarUrl: "avatar_url" in record ? record.avatar_url ?? "" : MASKED_VALUE,
    avatarTone: avatarTone(record.generation),
  };
}

export function memberListFromApi(response: MemberListResponse): FamilyMember[] {
  return response.data.map(memberFromApi);
}

export function memberPayload(data: MemberFormData, familyId?: number | null): Record<string, unknown> {
  const numericId = (value: string | null) => value ? Number(value) : null;
  return {
    ...data,
    father_id: numericId(data.father_id),
    mother_id: numericId(data.mother_id),
    spouse_id: numericId(data.spouse_id),
    ...(familyId ? { family_id: familyId } : {}),
  };
}
