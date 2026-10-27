import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FamilySettingsPanel } from "./FamilySettingsPanel";
import type { FamilySettings, ImageUploadRole, UpdateFamilySettingsInput } from "../../types/familySettings";

const updateSettings = vi.fn();

/** Hook RTK Query giả lập: chỉ cần trả dữ liệu và mutation để test hành vi panel. */
vi.mock("../../app/familySettingsApi", () => ({
  useGetFamilySettingsQuery: () => ({ data: currentSettings, isFetching: false, refetch: vi.fn() }),
  useGetFamilySettingRolesQuery: () => ({ data: roleOptions, isLoading: false }),
  useUpdateFamilySettingsMutation: () => [updateSettings, { isLoading: false }],
}));

let currentRole = "admin";
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ currentRole, isInitializing: false }),
}));

let currentSettings: FamilySettings = {
  familyId: "1",
  chatEnabled: true,
  imageUploadRoles: ["admin", "mod", "editor"],
  updatedAt: null,
};

const roleOptions: { value: ImageUploadRole; label: string }[] = [
  { value: "admin", label: "Admin (Trưởng Tộc)" },
  { value: "mod", label: "Mod (Trưởng Chi)" },
  { value: "editor", label: "Editor (Tác viên)" },
  { value: "member", label: "Member (Thành viên)" },
];

beforeEach(() => {
  currentRole = "admin";
  currentSettings = { familyId: "1", chatEnabled: true, imageUploadRoles: ["admin", "mod", "editor"], updatedAt: null };
  updateSettings.mockReset();
  // Component gọi `trigger(...).unwrap()` nên mock phải trả object có unwrap.
  updateSettings.mockReturnValue({ unwrap: () => Promise.resolve({ chatEnabled: false, imageUploadRoles: ["admin"] }) });
});

describe("FamilySettingsPanel – màn hình cấu hình của Admin", () => {
  it("hiển thị công tắc bật/tắt module chat cùng trạng thái hiện tại", () => {
    render(<FamilySettingsPanel />);

    const chatSwitch = screen.getByRole("switch", { name: "Bật hoặc tắt Trò chuyện nội bộ" });
    expect(chatSwitch).toBeInTheDocument();
    expect(chatSwitch).toBeChecked();
    expect(screen.getByText("Đang bật")).toBeInTheDocument();
  });

  it("hiển thị trạng thái tắt khi Admin đã khoá chat từ trước", () => {
    currentSettings = { ...currentSettings, chatEnabled: false };
    render(<FamilySettingsPanel />);

    expect(screen.getByRole("switch", { name: "Bật hoặc tắt Trò chuyện nội bộ" })).not.toBeChecked();
    expect(screen.getByText("Đang tắt")).toBeInTheDocument();
  });

  it("tắt chat rồi lưu sẽ gửi chat_enabled = false lên server", async () => {
    const user = userEvent.setup();
    render(<FamilySettingsPanel />);

    await user.click(screen.getByRole("switch", { name: "Bật hoặc tắt Trò chuyện nội bộ" }));
    await user.click(screen.getByRole("button", { name: /Lưu cấu hình/ }));

    await waitFor(() => expect(updateSettings).toHaveBeenCalledTimes(1));
    const payload = updateSettings.mock.calls[0][0] as UpdateFamilySettingsInput;
    expect(payload.chatEnabled).toBe(false);
    expect(payload.imageUploadRoles).toEqual(["admin", "mod", "editor"]);
    await screen.findByText("Đã lưu cấu hình tính năng cho dòng họ.");
  });

  it("bật lại chat rồi lưu sẽ gửi chat_enabled = true", async () => {
    currentSettings = { ...currentSettings, chatEnabled: false };
    const user = userEvent.setup();
    render(<FamilySettingsPanel />);

    await user.click(screen.getByRole("switch", { name: "Bật hoặc tắt Trò chuyện nội bộ" }));
    await user.click(screen.getByRole("button", { name: /Lưu cấu hình/ }));

    await waitFor(() => expect(updateSettings).toHaveBeenCalledTimes(1));
    expect((updateSettings.mock.calls[0][0] as UpdateFamilySettingsInput).chatEnabled).toBe(true);
  });

  it("tick thêm vai trò Member rồi lưu sẽ cấp quyền đưa ảnh lên hệ thống", async () => {
    const user = userEvent.setup();
    render(<FamilySettingsPanel />);

    expect(screen.getByRole("checkbox", { name: /Member \(Thành viên\)/ })).not.toBeChecked();
    await user.click(screen.getByRole("checkbox", { name: /Member \(Thành viên\)/ }));
    await user.click(screen.getByRole("button", { name: /Lưu cấu hình/ }));

    await waitFor(() => expect(updateSettings).toHaveBeenCalledTimes(1));
    expect((updateSettings.mock.calls[0][0] as UpdateFamilySettingsInput).imageUploadRoles).toEqual(["admin", "mod", "editor", "member"]);
  });

  it("bỏ chọn hết vai trò thì chặn lưu để không khoá vĩnh viễn việc tải ảnh", async () => {
    const user = userEvent.setup();
    render(<FamilySettingsPanel />);

    for (const label of [/Admin \(Trưởng Tộc\)/, /Mod \(Trưởng Chi\)/, /Editor \(Tác viên\)/]) {
      await user.click(screen.getByRole("checkbox", { name: label }));
    }
    await user.click(screen.getByRole("button", { name: /Lưu cấu hình/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Cần ít nhất một vai trò được phép đưa hình ảnh lên hệ thống.");
    expect(updateSettings).not.toHaveBeenCalled();
  });

  it("hiển thị cảnh báo khi chat đang bị khoá từ trước khi lưu", () => {
    currentSettings = { ...currentSettings, chatEnabled: false };
    render(<FamilySettingsPanel />);

    expect(screen.getByText(/Chat hiện đang bị khoá/)).toBeInTheDocument();
  });

  it("vai trò không phải Admin bị chặn bằng AccessDenied", () => {
    currentRole = "mod";
    render(<FamilySettingsPanel />);

    expect(screen.getByText("Không có quyền cấu hình")).toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "Bật hoặc tắt Trò chuyện nội bộ" })).not.toBeInTheDocument();
    expect(updateSettings).not.toHaveBeenCalled();
  });
});
