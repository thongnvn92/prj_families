import type { AppRole } from "../context/AuthContext";
import type { FamilyMember } from "./mock-data";

export const MASKED_VALUE = "***";
export type ProtectedSection = "tree" | "directory" | "calendar" | "gallery" | "chat" | "rituals" | "assistant" | "management";
export function isGuest(role: AppRole): boolean { return role === "guest"; }
export function isPublicMember(member: FamilyMember): boolean {
  return member.phone === MASKED_VALUE && member.address === MASKED_VALUE && member.birthLunar === MASKED_VALUE;
}

export function filterMemberForRole(member: FamilyMember, role: AppRole): FamilyMember {
  if (role !== "guest") return { ...member };
  return {
    ...member,
    nickname: undefined,
    role: "Thành viên",
    gender: "other",
    phone: MASKED_VALUE,
    birthplace: MASKED_VALUE,
    address: MASKED_VALUE,
    bio: MASKED_VALUE,
    burialPlace: MASKED_VALUE,
    burialMapUrl: MASKED_VALUE,
    homeMapUrl: MASKED_VALUE,
    avatarUrl: MASKED_VALUE,
    birthDateSolar: MASKED_VALUE,
    deathDateSolar: MASKED_VALUE,
    birthLunar: MASKED_VALUE,
    deathLunar: MASKED_VALUE,
    birthDayLunar: undefined,
    birthMonthLunar: undefined,
    birthYearLunar: undefined,
    deathDayLunar: undefined,
    deathMonthLunar: undefined,
    deathYearLunar: undefined,
  };
}

export function filterMembersForRole(members: FamilyMember[], role: AppRole): FamilyMember[] {
  return members.map((member) => filterMemberForRole(member, role));
}

export function filterChatHistoryForRole<T>(messages: T[], role: AppRole): T[] {
  return role === "guest" ? [] : [...messages];
}

export function canAccessSection(role: AppRole, section: ProtectedSection): boolean {
  if (section === "management") return role === "admin" || role === "mod";
  if (section === "tree" || section === "directory" || section === "chat" || section === "gallery") return true;
  return role !== "guest";
}

