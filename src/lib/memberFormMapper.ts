import type { FamilyMember } from "./mock-data";
import type { MemberFormData } from "../types/memberCrud";

function parseLunar(value: string | undefined): { day: number | null; month: number | null; year: number | null } {
  const match = value?.match(/(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)/);
  return match ? { day: Number(match[1]), month: Number(match[2]), year: Number(match[3]) } : { day: null, month: null, year: null };
}

export function memberToFormData(member: FamilyMember): MemberFormData {
  const birth = parseLunar(member.birthLunar);
  const death = parseLunar(member.deathLunar);
  return {
    full_name: member.name,
    nickname: member.nickname ?? "",
    gender: member.gender,
    father_id: member.fatherId ?? null,
    mother_id: member.motherId ?? null,
    spouse_id: member.spouseId ?? null,
    generation: member.generation,
    order_in_family: member.orderInFamily ?? 1,
    is_alive: member.isAlive,
    birth_date_solar: member.birthDateSolar ?? "",
    birth_day_lunar: member.birthDayLunar ?? birth.day,
    birth_month_lunar: member.birthMonthLunar ?? birth.month,
    birth_year_lunar: member.birthYearLunar ?? birth.year,
    death_date_solar: member.deathDateSolar ?? "",
    death_day_lunar: member.deathDayLunar ?? death.day,
    death_month_lunar: member.deathMonthLunar ?? death.month,
    death_year_lunar: member.deathYearLunar ?? death.year,
    burial_place: member.burialPlace ?? "",
    burial_map_url: member.burialMapUrl,
    home_map_url: member.homeMapUrl ?? "",
    bio: member.bio,
    avatar_url: member.avatarUrl ?? "",
    phone: member.phone,
    address: member.address,
  };
}
