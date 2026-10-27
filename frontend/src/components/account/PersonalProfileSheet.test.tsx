import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PersonalProfileSheet } from "./PersonalProfileSheet";
import type { AuthUserMember } from "../../app/authSlice";

const logout = vi.fn();
vi.mock("../../app/authApi", () => ({ useLogoutMutation: () => [logout, { isLoading: false }] }));

let member: AuthUserMember | null = null;
vi.mock("../../context/AuthContext", () => ({
  roleLabels: { admin: "Admin", mod: "Mod", editor: "Editor", member: "Member", guest: "Guest" },
  useAuth: () => ({
    user: { id: 7, name: "Nguyễn Văn A", email: "member@gia-pha.local", phone: "0912345678", role: "member", member_id: 1, family_id: 1, email_verified_at: null, created_at: null, member },
    currentRole: "member",
    permissions: { canSuggestEdits: true },
  }),
}));

beforeEach(() => { logout.mockReset(); });

describe("PersonalProfileSheet – hồ sơ cá nhân", () => {
  it("hiển thị 4 thông tin ưu tiên đúng thứ tự yêu cầu", () => {
    member = {
      id: 1,
      full_name: "Nguyễn Văn A",
      generation: 3,
      birthplace: "An Lão, Kiến An, Hải Phòng",
      birth_date_solar: "1968-05-21",
      birth_zodiac: "Mậu Thân",
      birth_day_lunar: 12,
      birth_month_lunar: 3,
      birth_year_lunar: 1968,
    };
    render(<PersonalProfileSheet open onOpenChange={vi.fn()} />);

    const core = screen.getByRole("region", { name: "Thông tin ưu tiên" });
    expect(core).toHaveTextContent("Nguyễn Văn A");
    expect(core).toHaveTextContent("An Lão, Kiến An, Hải Phòng");
    expect(core).toHaveTextContent("21/05/1968 (Mậu Thân)");

    // Thứ tự ưu tiên: Họ và tên -> Quê quán -> Ngày sinh -> Ngày mất.
    const labels = Array.from(core.querySelectorAll("dt")).map((item) => item.textContent);
    expect(labels).toEqual(["Họ và tên", "Quê quán", "Ngày sinh", "Ngày mất"]);
  });

  it("để '-' cho ngày mất khi thành viên còn sống", () => {
    member = { id: 1, full_name: "Nguyễn Văn A", generation: 3, birth_date_solar: "1962-05-21", birth_zodiac: "Nhâm Dần" };
    render(<PersonalProfileSheet open onOpenChange={vi.fn()} />);

    const core = screen.getByRole("region", { name: "Thông tin ưu tiên" });
    expect(core).toHaveTextContent("21/05/1962 (Nhâm Dần)");
    // Ô "Ngày mất" phải hiện "-", ô "Quê quán" cũng chưa có dữ liệu nên cùng "-".
    const deathRow = Array.from(core.querySelectorAll("dt")).find((item) => item.textContent === "Ngày mất")?.nextElementSibling;
    expect(deathRow?.textContent).toBe("-");
  });

  it("báo chưa liên kết khi tài khoản chưa gắn nút thành viên", () => {
    member = null;
    render(<PersonalProfileSheet open onOpenChange={vi.fn()} />);

    expect(screen.getByText("Chưa liên kết thành viên nào")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Thông tin ưu tiên" })).toHaveTextContent("Nguyễn Văn A");
  });
});