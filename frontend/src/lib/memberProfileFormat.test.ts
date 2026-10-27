import { describe, expect, it } from "vitest";
import { familyMembers, type FamilyMember } from "./mock-data";
import { EMPTY_PROFILE_VALUE } from "./memberProfileFormat";
import { MASKED_VALUE } from "./rbacFilter";
import { formatProfileDateOrEmpty, formatProfileHometown, formatVietnameseDate } from "./memberProfileFormat";

const member = (overrides: Partial<FamilyMember> = {}): FamilyMember => ({ ...familyMembers[0], ...overrides });

describe("memberProfileFormat – định dạng thông tin ưu tiên của hồ sơ", () => {
  it("định dạng ngày kiểu Việt Nam dd/MM/yyyy", () => {
    expect(formatVietnameseDate("1962-05-21")).toBe("21/05/1962");
    expect(formatVietnameseDate("1900-01-31")).toBe("31/01/1900");
  });

  it("trả null với ngày rỗng hoặc không đúng định dạng ISO", () => {
    expect(formatVietnameseDate("")).toBeNull();
    expect(formatVietnameseDate(null)).toBeNull();
    expect(formatVietnameseDate("21/05/1962")).toBeNull();
  });

  it("ghép con giáp theo năm âm cho ngày sinh: 21/05/1962 (Mậu Thân)", () => {
    const value = formatProfileDateOrEmpty(member({ birthDateSolar: "1968-05-21", birthZodiac: "Mậu Thân" }), "birth");
    expect(value).toBe("21/05/1968 (Mậu Thân)");
  });

  it("bỏ dấu ngoặc khi backend chưa tính được con giáp", () => {
    expect(formatProfileDateOrEmpty(member({ birthDateSolar: "1962-05-21", birthZodiac: undefined }), "birth")).toBe("21/05/1962");
  });

  it("lùi về ngày âm khi chưa có ngày dương", () => {
    const value = formatProfileDateOrEmpty(member({ birthDateSolar: "", birthLunar: "03 / 06 / 1898 âm lịch", birthZodiac: "Mậu Tuất" }), "birth");
    expect(value).toBe("03 / 06 / 1898 âm lịch (Mậu Tuất)");
  });

  it("hiển thị '-' khi thành viên chưa có ngày sinh", () => {
    expect(formatProfileDateOrEmpty(member({ birthDateSolar: "", birthLunar: "Không ghi nhận" }), "birth")).toBe(EMPTY_PROFILE_VALUE);
  });

  it("hiển thị '-' cho ngày mất khi thành viên còn sống", () => {
    const living = member({ isAlive: true, deathDateSolar: "", deathLunar: "Không ghi nhận", deathZodiac: undefined });
    expect(formatProfileDateOrEmpty(living, "death")).toBe(EMPTY_PROFILE_VALUE);
  });

  it("hiển thị ngày mất khi đã ghi nhận", () => {
    const deceased = member({ isAlive: false, deathDateSolar: "1974-08-19", deathZodiac: "Giáp Tý" });
    expect(formatProfileDateOrEmpty(deceased, "death")).toBe("19/08/1974 (Giáp Tý)");
  });

  it("không đọc nhầm chuỗi masking của guest thành ngày hợp lệ", () => {
    // filterMemberForRole mask cả ngày dương, ngày âm và quê quán cho Guest.
    const masked = member({ birthDateSolar: MASKED_VALUE, birthLunar: MASKED_VALUE, birthZodiac: undefined, deathDateSolar: MASKED_VALUE, deathLunar: MASKED_VALUE, deathZodiac: undefined, birthplace: MASKED_VALUE });
    expect(formatProfileDateOrEmpty(masked, "birth")).toBe(EMPTY_PROFILE_VALUE);
    expect(formatProfileDateOrEmpty(masked, "death")).toBe(EMPTY_PROFILE_VALUE);
    expect(formatProfileHometown(masked)).toBe(EMPTY_PROFILE_VALUE);
  });

  it("lấy quê quán đúng chuỗi nhiều cấp, ví dụ An Lão, Kiến An, Hải Phòng", () => {
    expect(formatProfileHometown(member({ birthplace: "An Lão, Kiến An, Hải Phòng" }))).toBe("An Lão, Kiến An, Hải Phòng");
    expect(formatProfileHometown(member({ birthplace: "  " }))).toBe(EMPTY_PROFILE_VALUE);
  });
});