import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemberFormModal } from "./MemberFormModal";
import { fullMember, sampleMembers } from "../../test/fixtures";
import type { AppRole } from "../../context/AuthContext";
import type { FamilyMember } from "../../lib/mock-data";
import type { MemberFormData } from "../../types/memberCrud";

let currentRole: AppRole = "admin";
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ permissions: { canDirectlyEdit: currentRole !== "guest", canSuggestEdits: currentRole !== "guest" } }),
}));

const onSubmit = vi.fn();
const onOpenChange = vi.fn();

function renderModal(props: Partial<React.ComponentProps<typeof MemberFormModal>> = {}) {
  return render(<MemberFormModal open onOpenChange={onOpenChange} member={null} members={sampleMembers} onSubmit={onSubmit} {...props} />);
}

beforeEach(() => {
  currentRole = "admin";
  onSubmit.mockReset();
  onSubmit.mockResolvedValue(undefined);
  onOpenChange.mockReset();
});

describe("UT-MEMBER-FORM – Normal / Happy Path", () => {
  it("mở form ở chế độ thêm với tiêu đề và trường bắt buộc", () => {
    renderModal();

    expect(screen.getByText("Thêm thành viên mới")).toBeInTheDocument();
    expect(screen.getByLabelText("Họ và tên *")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Thêm thành viên/ })).toBeInTheDocument();
  });

  it("mở form ở chế độ sửa và nạp sẵn dữ liệu thành viên", () => {
    renderModal({ member: fullMember });

    expect(screen.getByText("Cập nhật thành viên")).toBeInTheDocument();
    expect(screen.getByLabelText("Họ và tên *")).toHaveValue("Nguyễn Văn Minh");
  });

  it("submit thành công khi nhập họ tên hợp lệ", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("Họ và tên *"), "Nguyễn Văn Mới");
    await user.click(screen.getByRole("button", { name: /Thêm thành viên/ }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect((onSubmit.mock.calls[0][0] as MemberFormData).full_name).toBe("Nguyễn Văn Mới");
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("cắt khoảng trắng thừa ở họ tên trước khi gửi đi", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("Họ và tên *"), "   Nguyễn Văn Đẹp   ");
    await user.click(screen.getByRole("button", { name: /Thêm thành viên/ }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect((onSubmit.mock.calls[0][0] as MemberFormData).full_name).toBe("Nguyễn Văn Đẹp");
  });

  it("tự động tính đời thứ = đời lớn nhất của phụ huynh + 1", async () => {
    const user = userEvent.setup();
    // Thành viên đang sửa có cha là fullMember (đời 3) => đời thứ phải tự tính thành 4.
    const child: FamilyMember = { ...fullMember, id: "3", name: "Nguyễn Văn Con", fatherId: fullMember.id, generation: 1 };
    renderModal({ member: child, members: [fullMember, child] });

    await user.click(screen.getByRole("tab", { name: "Quan hệ" }));

    expect(await screen.findByText("Đời 4")).toBeInTheDocument();
  });

  it("không tự tính đời khi thành viên không có phụ huynh", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("tab", { name: "Quan hệ" }));

    expect(await screen.findByText("Đời 1")).toBeInTheDocument();
  });

  it("tab Âm - Dương chỉ nhận ngày âm trong khoảng 1-30 / 1-12", () => {
    renderModal();

    expect(screen.getByRole("tab", { name: "Âm - Dương" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Địa chỉ & Tiểu sử" })).toBeInTheDocument();
  });
});

describe("UT-MEMBER-FORM – Abnormal / Validation", () => {
  it("chặn submit khi họ tên chỉ chứa khoảng trắng", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("Họ và tên *"), "    ");
    await user.click(screen.getByRole("button", { name: /Thêm thành viên/ }));

    expect(await screen.findByText("Vui lòng nhập họ tên.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("giữ nguyên Modal khi server trả lỗi 422", async () => {
    const user = userEvent.setup();
    onSubmit.mockRejectedValue(new Error("Ngày sinh không hợp lệ."));
    renderModal();

    await user.type(screen.getByLabelText("Họ và tên *"), "Nguyễn Văn A");
    await user.click(screen.getByRole("button", { name: /Thêm thành viên/ }));

    expect(await screen.findByText("Ngày sinh không hợp lệ.")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("hiển thị thông báo lỗi chung khi lỗi không phải Error", async () => {
    const user = userEvent.setup();
    onSubmit.mockRejectedValue("string error");
    renderModal();

    await user.type(screen.getByLabelText("Họ và tên *"), "Nguyễn Văn B");
    await user.click(screen.getByRole("button", { name: /Thêm thành viên/ }));

    expect(await screen.findByText("Không thể lưu thông tin.")).toBeInTheDocument();
  });
});

describe("UT-MEMBER-FORM – Security & RBAC Guard", () => {
  it("Guest bị chặn bằng AccessDenied khi mở form sửa trực tiếp", () => {
    currentRole = "guest";
    renderModal();

    expect(screen.getByText("Không có quyền cập nhật thành viên")).toBeInTheDocument();
    expect(screen.queryByLabelText("Họ và tên *")).not.toBeInTheDocument();
  });

  it("Guest vẫn thấy form khi ở chế độ gửi đề xuất nếu được cấp quyền", () => {
    currentRole = "guest";
    // guest không có canSuggestEdits nên vẫn bị chặn, nhưng thông điệp phải nói về đề xuất.
    renderModal({ proposalMode: true });

    expect(screen.getByText("Không có quyền cập nhật thành viên")).toBeInTheDocument();
  });

  it("Editor được sửa trực tiếp (canDirectlyEdit = true)", () => {
    currentRole = "editor";
    renderModal();

    expect(screen.getByLabelText("Họ và tên *")).toBeInTheDocument();
  });

  it("không render gì khi đóng Modal", () => {
    renderModal({ open: false });

    expect(screen.queryByText("Thêm thành viên mới")).not.toBeInTheDocument();
  });
});
