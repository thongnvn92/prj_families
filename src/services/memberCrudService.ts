import { familyMembers, type FamilyMember, type Gender } from "../lib/mock-data";
import type { AppRole } from "../context/AuthContext";
import { filterMemberForRole, filterMembersForRole } from "../lib/rbacFilter";
import type { MemberFormData, MemberListFilters } from "../types/memberCrud";

const MOCK_LATENCY = 200;

function delay<T>(operation: () => T): Promise<T> {
  return new Promise((resolve, reject) => setTimeout(() => {
    try { resolve(operation()); } catch (error) { reject(error); }
  }, MOCK_LATENCY));
}

function clone(member: FamilyMember): FamilyMember { return { ...member }; }
function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("vi").trim();
}
function makeInitials(name: string): string {
  return name.trim().split(/\s+/).slice(-2).map((part) => part[0] ?? "").join("").toUpperCase() || "TV";
}
function nullableNumber(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
function calculatedGeneration(data: MemberFormData, existing?: FamilyMember): number {
  const parentIds = [data.father_id, data.mother_id].filter((id): id is string => Boolean(id && id !== existing?.id));
  const parents = familyMembers.filter((member) => parentIds.includes(member.id));
  if (parents.length) return Math.max(...parents.map((parent) => parent.generation)) + 1;
  return Math.max(1, data.generation || existing?.generation || 1);
}

function toMember(data: MemberFormData, existing?: FamilyMember): FamilyMember {
  const name = data.full_name.trim();
  if (!name) throw new Error("Họ tên không được để trống.");
  if (data.is_alive && (data.death_date_solar || data.death_day_lunar)) throw new Error("Thành viên còn sống không thể nhập ngày mất.");
  if (data.father_id === existing?.id || data.mother_id === existing?.id) throw new Error("Không thể tự chọn mình làm cha hoặc mẹ.");
  const birthYear = Number(data.birth_date_solar.slice(0, 4)) || data.birth_year_lunar || existing?.birthYear || new Date().getFullYear();
  const deathYear = data.is_alive ? undefined : Number(data.death_date_solar.slice(0, 4)) || data.death_year_lunar || undefined;
  const gender: Gender = data.gender;
  return {
    id: existing?.id ?? `member-${Date.now()}`,
    name,
    nickname: data.nickname.trim() || undefined,
    initials: makeInitials(name),
    gender,
    generation: calculatedGeneration(data, existing),
    orderInFamily: Math.max(0, data.order_in_family || 0),
    role: existing?.role ?? "Thành viên",
    birthYear,
    birthDateSolar: data.birth_date_solar,
    deathYear,
    deathDateSolar: data.is_alive ? "" : data.death_date_solar,
    isAlive: data.is_alive,
    birthLunar: data.birth_day_lunar && data.birth_month_lunar && data.birth_year_lunar ? `${data.birth_day_lunar} / ${data.birth_month_lunar} / ${data.birth_year_lunar} âm lịch` : "Không ghi nhận",
    deathLunar: !data.is_alive && data.death_day_lunar && data.death_month_lunar && data.death_year_lunar ? `${data.death_day_lunar} / ${data.death_month_lunar} / ${data.death_year_lunar} âm lịch` : undefined,
    birthDayLunar: nullableNumber(data.birth_day_lunar),
    birthMonthLunar: nullableNumber(data.birth_month_lunar),
    birthYearLunar: nullableNumber(data.birth_year_lunar),
    deathDayLunar: nullableNumber(data.death_day_lunar),
    deathMonthLunar: nullableNumber(data.death_month_lunar),
    deathYearLunar: nullableNumber(data.death_year_lunar),
    fatherId: data.father_id || undefined,
    motherId: data.mother_id || undefined,
    spouseId: data.spouse_id || undefined,
    phone: data.phone.trim(),
    birthplace: existing?.birthplace ?? "Bắc Ninh",
    address: data.address.trim(),
    bio: data.bio.trim(),
    burialPlace: data.burial_place.trim(),
    burialMapUrl: data.burial_map_url.trim(),
    homeMapUrl: data.home_map_url.trim(),
    avatarUrl: data.avatar_url.trim(),
    avatarTone: existing?.avatarTone ?? (gender === "female" ? "sage" : "wine"),
  };
}

export async function getMembers(role: AppRole): Promise<FamilyMember[]> {
  return delay(() => filterMembersForRole(familyMembers, role).map(clone));
}

export async function getMemberById(id: string, role: AppRole): Promise<FamilyMember | null> {
  return delay(() => {
    const member = familyMembers.find((item) => item.id === id);
    return member ? filterMemberForRole(member, role) : null;
  });
}

export async function getMembersList(filters: MemberListFilters, role: AppRole): Promise<FamilyMember[]> {
  return delay(() => {
    const query = normalize(filters.query ?? "");
    const visibleMembers = filterMembersForRole(familyMembers, role);
    return visibleMembers.filter((member) => {
      const searchable = normalize(role === "guest" ? member.name : `${member.name} ${member.nickname ?? ""} ${member.phone}`);
      const matchesQuery = !query || searchable.includes(query);
      const matchesGeneration = filters.generation === undefined || filters.generation === "all" || member.generation === filters.generation;
      const matchesGender = filters.gender === undefined || filters.gender === "all" || member.gender === filters.gender;
      const matchesStatus = filters.status === undefined || filters.status === "all" || (filters.status === "alive" ? member.isAlive : !member.isAlive);
      return matchesQuery && matchesGeneration && matchesGender && matchesStatus;
    }).sort((a, b) => a.generation - b.generation || (a.orderInFamily ?? 0) - (b.orderInFamily ?? 0) || a.name.localeCompare(b.name, "vi")).map(clone);
  });
}

export async function searchMembers(query: string, role: AppRole): Promise<FamilyMember[]> {
  return getMembersList({ query }, role);
}

export async function createMember(data: MemberFormData, role: AppRole): Promise<FamilyMember> {
  return delay(() => {
    if (!(["admin", "mod", "editor"] as AppRole[]).includes(role)) throw new Error("Bạn không có quyền thêm thành viên.");
    const member = toMember(data);
    familyMembers.push(member);
    return clone(member);
  });
}

export async function updateMember(id: string, data: MemberFormData, role: AppRole): Promise<FamilyMember> {
  return delay(() => {
    if (!(["admin", "mod", "editor"] as AppRole[]).includes(role)) throw new Error("Bạn không có quyền cập nhật thành viên.");
    const index = familyMembers.findIndex((member) => member.id === id);
    if (index < 0) throw new Error("Không tìm thấy thành viên cần cập nhật.");
    const member = toMember(data, familyMembers[index]);
    familyMembers[index] = member;
    return clone(member);
  });
}

export async function deleteMember(id: string, role: AppRole): Promise<FamilyMember> {
  return delay(() => {
    if (!(role === "admin" || role === "mod")) throw new Error("Bạn không có quyền xóa thành viên.");
    const index = familyMembers.findIndex((member) => member.id === id);
    if (index < 0) throw new Error("Không tìm thấy thành viên cần xóa.");
    if (familyMembers.some((member) => member.fatherId === id || member.motherId === id)) {
      throw new Error("Không thể xóa thành viên đã có nhánh con. Vui lòng cập nhật lại mối quan hệ của các con trước.");
    }
    const member = familyMembers[index];
    familyMembers.splice(index, 1);
    familyMembers.forEach((item) => { if (item.spouseId === id) item.spouseId = undefined; });
    return clone(member);
  });
}

