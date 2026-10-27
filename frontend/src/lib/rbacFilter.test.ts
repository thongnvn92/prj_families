import { describe, expect, it } from "vitest";
import { familyMembers, type FamilyMember } from "./mock-data";
import { MASKED_VALUE, canAccessSection, filterChatHistoryForRole, filterMemberForRole, filterMembersForRole, isGuest, isPublicMember } from "./rbacFilter";

const fullMember: FamilyMember = { ...familyMembers[0], phone: "0912345678", address: "Bắc Ninh", birthLunar: "10/3/1920", avatarUrl: "https://cdn.test/a.png" };

describe("rbacFilter – che dữ liệu nội bộ cho khách", () => {
  it("dùng đúng ký hiệu masking ***", () => {
    expect(MASKED_VALUE).toBe("***");
  });

  it("giấu toàn bộ trường riêng tư khi role là guest", () => {
    const masked = filterMemberForRole(fullMember, "guest");

    expect(masked.phone).toBe("***");
    expect(masked.address).toBe("***");
    expect(masked.birthLunar).toBe("***");
    expect(masked.birthDateSolar).toBe("***");
    expect(masked.deathDateSolar).toBe("***");
    expect(masked.bio).toBe("***");
    expect(masked.burialPlace).toBe("***");
    expect(masked.burialMapUrl).toBe("***");
    expect(masked.homeMapUrl).toBe("***");
    expect(masked.avatarUrl).toBe("***");
    expect(masked.nickname).toBeUndefined();
    // Các trường mô tả quan hệ huyết thống cũng phải bị xoá hoàn toàn.
    expect(masked.birthDayLunar).toBeUndefined();
    expect(masked.birthMonthLunar).toBeUndefined();
    expect(masked.birthYearLunar).toBeUndefined();
    expect(masked.deathDayLunar).toBeUndefined();
    expect(masked.deathMonthLunar).toBeUndefined();
    expect(masked.deathYearLunar).toBeUndefined();
  });

  it("vẫn giữ các trường công khai để khách xem được cây gia phả", () => {
    const masked = filterMemberForRole(fullMember, "guest");

    expect(masked.id).toBe(fullMember.id);
    expect(masked.name).toBe(fullMember.name);
    expect(masked.generation).toBe(fullMember.generation);
    expect(masked.birthYear).toBe(fullMember.birthYear);
    expect(masked.deathYear).toBe(fullMember.deathYear);
    expect(masked.isAlive).toBe(fullMember.isAlive);
  });

  it("không sửa dữ liệu gốc khi masking", () => {
    const source: FamilyMember = { ...fullMember };
    filterMemberForRole(source, "guest");

    expect(source.phone).toBe("0912345678");
    expect(source.avatarUrl).toBe("https://cdn.test/a.png");
  });

  it("thành viên đã đăng nhập không bị che dữ liệu", () => {
    (["admin", "mod", "editor", "member"] as const).forEach((role) => {
      const result = filterMemberForRole(fullMember, role);
      expect(result.phone).toBe("0912345678");
      expect(result.avatarUrl).toBe("https://cdn.test/a.png");
    });
  });

  it("filterMembersForRole áp dụng cho cả danh sách", () => {
    const masked = filterMembersForRole([fullMember, fullMember], "guest");

    expect(masked).toHaveLength(2);
    expect(masked.every((member) => member.phone === MASKED_VALUE)).toBe(true);
  });

  it("isPublicMember nhận diện đúng hồ sơ đã che", () => {
    expect(isPublicMember(filterMemberForRole(fullMember, "guest"))).toBe(true);
    expect(isPublicMember(fullMember)).toBe(false);
  });

  it("khách không được xem lịch sử chat", () => {
    const messages = [{ id: "1" }, { id: "2" }];

    expect(filterChatHistoryForRole(messages, "guest")).toEqual([]);
    expect(filterChatHistoryForRole(messages, "member")).toEqual(messages);
  });

  it("chỉ admin và mod được vào mục quản trị", () => {
    expect(canAccessSection("admin", "management")).toBe(true);
    expect(canAccessSection("mod", "management")).toBe(true);
    expect(canAccessSection("editor", "management")).toBe(false);
    expect(canAccessSection("member", "management")).toBe(false);
  });

  it("khách ngoài dòng họ chỉ vào được cây gia phả", () => {
    expect(canAccessSection("guest", "tree")).toBe(true);
    // Các mục nhạy cảm phải bị chặn hoàn toàn, kể cả danh sách thành viên, album và chat.
    expect(canAccessSection("guest", "directory")).toBe(false);
    expect(canAccessSection("guest", "gallery")).toBe(false);
    expect(canAccessSection("guest", "chat")).toBe(false);
    expect(canAccessSection("guest", "calendar")).toBe(false);
    expect(canAccessSection("guest", "rituals")).toBe(false);
    expect(canAccessSection("guest", "assistant")).toBe(false);
    expect(canAccessSection("guest", "management")).toBe(false);
    expect(canAccessSection("guest", "settings")).toBe(false);
  });

  it("thành viên đã đăng nhập xem được toàn bộ mục công khai và nội bộ", () => {
    (["admin", "mod", "editor", "member"] as const).forEach((role) => {
      (["tree", "directory", "gallery", "chat", "calendar", "rituals", "assistant"] as const).forEach((section) => {
        expect(canAccessSection(role, section)).toBe(true);
      });
    });
  });

  it("isGuest đúng cho đúng một role", () => {
    expect(isGuest("guest")).toBe(true);
    expect(isGuest("member")).toBe(false);
  });
});
