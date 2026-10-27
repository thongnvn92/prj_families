import { familyMembers, type FamilyMember } from "../lib/mock-data";
import type { AuthUser } from "../app/authSlice";
import type { AppRole } from "../context/AuthContext";
import type { LunarEvent } from "../types/calendar";

/** Fixture dùng chung cho toàn bộ test để không lệch shape với domain types. */

/** Thành viên đầy đủ thông tin nhạy cảm (không masking) để test RBAC/masking. */
export const fullMember: FamilyMember = {
  ...familyMembers[0],
  id: "1",
  name: "Nguyễn Văn Minh",
  // Chốt rõ đời để test tự tính đời không phụ thuộc thứ tự mảng mock-data.
  generation: 3,
  phone: "0912345678",
  address: "Bắc Ninh",
  birthplace: "Bắc Ninh",
  birthLunar: "10/3/1920",
  bio: "Tiểu sử chi tiết",
  burialPlace: "Khu di tích gia tộc",
  avatarUrl: "https://cdn.test/a.png",
};

export const parentMember: FamilyMember = { ...familyMembers[0], id: "2", name: "Nguyễn Văn An", generation: 1 };
export const sampleMembers: FamilyMember[] = [fullMember, parentMember];

export function authUser(role: AppRole = "member", overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 7,
    name: "Nguyễn Văn Test",
    email: `${role}@gia-pha.local`,
    phone: "0912345678",
    role,
    member_id: 1,
    family_id: 1,
    email_verified_at: null,
    created_at: null,
    ...overrides,
  };
}

export function lunarEvent(overrides: Partial<LunarEvent> = {}): LunarEvent {
  return {
    id: "10",
    memberId: "1",
    memberName: "Nguyễn Văn Minh",
    generation: 3,
    eventType: "death_anniversary",
    lunarDay: 15,
    lunarMonth: 3,
    lunarLabel: "Mùng 15 tháng Ba",
    lunarDayLabel: "Mùng 15",
    lunarMonthName: "Ba",
    solarDate: "2026-03-20",
    daysRemaining: 12,
    burialPlace: "Khu di tích gia tộc",
    organizer: "Ban Trưởng chi",
    status: "upcoming",
    ...overrides,
  };
}

/** Tạo File giả với MIME và dung lượng kiểm soát được cho test upload. */
export function makeFile(name: string, type: string, sizeBytes: number): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: sizeBytes });
  return file;
}

export const MB = 1024 * 1024;
