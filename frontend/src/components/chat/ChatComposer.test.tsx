import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatComposer } from "./ChatComposer";
import { MB, makeFile } from "../../test/fixtures";

const onSend = vi.fn();
const onTyping = vi.fn();

function renderComposer(props: Partial<React.ComponentProps<typeof ChatComposer>> = {}) {
  return render(<ChatComposer onSend={onSend} onTyping={onTyping} {...props} />);
}

function fileInput() {
  return document.querySelector('input[type="file"]') as HTMLInputElement;
}

beforeEach(() => {
  onSend.mockReset();
  onSend.mockResolvedValue(undefined);
  onTyping.mockReset();
});

describe("UT-CHAT-COMPOSER – Normal / Happy Path", () => {
  it("render ô nhập và nút gửi ở trạng thái ban đầu", () => {
    renderComposer();

    expect(screen.getByLabelText("Nội dung tin nhắn")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gửi tin nhắn" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Đính kèm ảnh" })).toBeInTheDocument();
  });

  it("gửi tin nhắn text thành công và xoá nội dung ô nhập", async () => {
    const user = userEvent.setup();
    renderComposer();

    await user.type(screen.getByLabelText("Nội dung tin nhắn"), "Chào bà con");
    await user.click(screen.getByRole("button", { name: "Gửi tin nhắn" }));

    await waitFor(() => expect(onSend).toHaveBeenCalledWith("Chào bà con", null));
    expect(screen.getByLabelText("Nội dung tin nhắn")).toHaveValue("");
  });

  it("giữ nguyên khoảng trắng — trim thuộc tầng API mapper, không phải composer", async () => {
    const user = userEvent.setup();
    renderComposer();

    await user.type(screen.getByLabelText("Nội dung tin nhắn"), "   Xin chào   ");
    await user.click(screen.getByRole("button", { name: "Gửi tin nhắn" }));

    // chatMessageFormData() mới là nơi trim; composer giữ nguyên để không mất ý định người dùng.
    await waitFor(() => expect(onSend).toHaveBeenCalledWith("   Xin chào   ", null));
  });

  it("đính kèm ảnh hợp lệ kèm dung lượng hiển thị", async () => {
    const user = userEvent.setup();
    renderComposer();

    await user.upload(fileInput(), makeFile("anh.jpg", "image/jpeg", 2 * MB));

    expect(await screen.findByAltText("Xem trước ảnh đính kèm")).toBeInTheDocument();
    expect(screen.getByText("Dung lượng: 2.00 MB")).toBeInTheDocument();
  });

  it("gửi được tin nhắn chỉ có ảnh, không cần nhập chữ", async () => {
    const user = userEvent.setup();
    renderComposer();
    const file = makeFile("anh.png", "image/png", MB);

    await user.upload(fileInput(), file);
    await user.click(screen.getByRole("button", { name: "Gửi tin nhắn" }));

    await waitFor(() => expect(onSend).toHaveBeenCalledWith("", file));
  });

  it("xóa được ảnh đính kèm trước khi gửi", async () => {
    const user = userEvent.setup();
    renderComposer();

    await user.upload(fileInput(), makeFile("a.jpg", "image/jpeg", MB));
    await user.click(await screen.findByRole("button", { name: "Xóa ảnh đính kèm" }));

    expect(screen.queryByAltText("Xem trước ảnh đính kèm")).not.toBeInTheDocument();
  });

  it("báo trạng thái đang gõ khi có nội dung và tắt sau khi gửi", async () => {
    const user = userEvent.setup();
    renderComposer();

    await user.type(screen.getByLabelText("Nội dung tin nhắn"), "A");
    expect(onTyping).toHaveBeenCalledWith(true);

    await user.click(screen.getByRole("button", { name: "Gửi tin nhắn" }));
    await waitFor(() => expect(onTyping).toHaveBeenLastCalledWith(false));
  });
});

describe("UT-CHAT-COMPOSER – Abnormal / Validation", () => {
  it("từ chối ảnh vượt quá 10MB", async () => {
    renderComposer();

    fireEvent.change(fileInput(), { target: { files: [makeFile("lon.webp", "image/webp", 11 * MB)] } });

    expect(await screen.findByText("Ảnh vượt quá 10MB. Vui lòng chọn ảnh nhỏ hơn.")).toBeInTheDocument();
  });

  it("từ chối ảnh sai định dạng khi bypass thuộc tính accept", async () => {
    renderComposer();

    fireEvent.change(fileInput(), { target: { files: [makeFile("tai-lieu.pdf", "application/pdf", MB)] } });

    expect(await screen.findByText("Vui lòng chọn ảnh định dạng JPG, PNG hoặc WebP.")).toBeInTheDocument();
  });

  it("không gửi được khi cả chữ và ảnh đều rỗng", () => {
    renderComposer();

    expect(screen.getByRole("button", { name: "Gửi tin nhắn" })).toBeDisabled();
    expect(onSend).not.toHaveBeenCalled();
  });

  it("giữ nội dung và hiển thị lỗi khi API thất bại", async () => {
    const user = userEvent.setup();
    onSend.mockRejectedValue(new Error("Tin nhắn nội bộ đang tạm khoá."));
    renderComposer();

    await user.type(screen.getByLabelText("Nội dung tin nhắn"), "Xin chào");
    await user.click(screen.getByRole("button", { name: "Gửi tin nhắn" }));

    expect(await screen.findByText("Tin nhắn nội bộ đang tạm khoá.")).toBeInTheDocument();
    expect(screen.getByLabelText("Nội dung tin nhắn")).toHaveValue("Xin chào");
  });

  it("hiển thị lỗi chung khi lỗi không phải Error", async () => {
    const user = userEvent.setup();
    onSend.mockRejectedValue("network down");
    renderComposer();

    await user.type(screen.getByLabelText("Nội dung tin nhắn"), "Xin chào");
    await user.click(screen.getByRole("button", { name: "Gửi tin nhắn" }));

    expect(await screen.findByText("Không thể gửi tin nhắn.")).toBeInTheDocument();
  });

  it("không gửi lặp khi đang trong trạng thái sending", async () => {
    const user = userEvent.setup();
    let release: () => void = () => {};
    onSend.mockReturnValue(new Promise<void>((resolve) => { release = resolve; }));
    renderComposer();

    await user.type(screen.getByLabelText("Nội dung tin nhắn"), "A");
    await user.click(screen.getByRole("button", { name: "Gửi tin nhắn" }));
    await user.click(screen.getByRole("button", { name: "Gửi tin nhắn" }));

    expect(onSend).toHaveBeenCalledTimes(1);
    release();
  });
});

describe("UT-CHAT-COMPOSER – Security & RBAC Guard", () => {
  it("ẩn nút đính kèm ảnh khi vai trò chưa được cấp quyền upload", () => {
    renderComposer({ canAttachImage: false });

    expect(screen.queryByRole("button", { name: "Đính kèm ảnh" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Nội dung tin nhắn")).toBeEnabled();
  });

  it("vẫn cho đính kèm ảnh mặc định khi không truyền cờ", () => {
    renderComposer();

    expect(screen.getByRole("button", { name: "Đính kèm ảnh" })).toBeInTheDocument();
  });

  it("disable toàn bộ composer khi bị khóa", () => {
    renderComposer({ disabled: true });

    expect(screen.getByLabelText("Nội dung tin nhắn")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Gửi tin nhắn" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Đính kèm ảnh" })).toBeDisabled();
  });
});
