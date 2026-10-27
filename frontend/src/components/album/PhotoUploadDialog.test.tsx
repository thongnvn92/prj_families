import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PhotoUploadDialog } from "./PhotoUploadDialog";
import { MB, makeFile } from "../../test/fixtures";
import type { UploadAlbumPhotoInput } from "../../types/album";

let canUploadImages = true;
vi.mock("../../lib/useFamilySettings", () => ({
  useFamilySettings: () => ({ canUploadImages }),
}));

const onSubmit = vi.fn();
const onOpenChange = vi.fn();

function renderDialog() {
  return render(<PhotoUploadDialog open onOpenChange={onOpenChange} onSubmit={onSubmit} />);
}

/** Chọn file vào input ẩn của form upload. */
async function chooseFile(user: ReturnType<typeof userEvent.setup>, file: File) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await user.upload(input, file);
}

/**
 * Nạp file BỎ QUA thuộc tính `accept` của input. `user.upload` tự lọc file sai
 * MIME theo `accept` nên không chứng minh được lớp kiểm tra MIME trong component —
 * đây chính là kịch bản kẻ xấu cố tình chọn file .pdf/.exe.
 */
function forceChooseFile(file: File) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
}

beforeEach(() => {
  canUploadImages = true;
  onSubmit.mockReset();
  onSubmit.mockResolvedValue(undefined);
  onOpenChange.mockReset();
});

describe("UT-PHOTO-UPLOAD – Abnormal / Validation", () => {
  it("từ chối file PDF", async () => {
    renderDialog();

    forceChooseFile(makeFile("ho-so.pdf", "application/pdf", 500 * 1024));

    expect(await screen.findByText("Vui lòng chọn ảnh định dạng JPG, PNG hoặc WebP.")).toBeInTheDocument();
    expect(screen.queryByAltText("Xem trước ảnh")).not.toBeInTheDocument();
  });

  it("từ chối file EXE", async () => {
    renderDialog();

    forceChooseFile(makeFile("malware.exe", "application/x-msdownload", 500 * 1024));

    expect(await screen.findByText("Vui lòng chọn ảnh định dạng JPG, PNG hoặc WebP.")).toBeInTheDocument();
  });

  it("từ chối file ảnh vượt quá 10MB", async () => {
    const user = userEvent.setup();
    renderDialog();

    await chooseFile(user, makeFile("lon.webp", "image/webp", 11 * MB));

    expect(await screen.findByText("Ảnh vượt quá 10MB. Vui lòng chọn ảnh nhỏ hơn.")).toBeInTheDocument();
  });

  it("chấp nhận đúng mốc biên 10MB", async () => {
    const user = userEvent.setup();
    renderDialog();

    await chooseFile(user, makeFile("vien.webp", "image/webp", 10 * MB));

    expect(await screen.findByAltText("Xem trước ảnh")).toBeInTheDocument();
  });

  it("chặn submit khi thiếu ảnh", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByPlaceholderText(/Họp mặt dòng họ/), "Tiêu đề");
    await user.type(screen.getByPlaceholderText(/Kể lại khoảnh khắc/), "Mô tả");
    await user.click(screen.getByRole("button", { name: /Tải lên Album/ }));

    expect(await screen.findByText("Vui lòng chọn ảnh và nhập đầy đủ thông tin.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("chặn submit khi thiếu mô tả", async () => {
    const user = userEvent.setup();
    renderDialog();

    await chooseFile(user, makeFile("a.jpg", "image/jpeg", MB));
    await user.type(screen.getByPlaceholderText(/Họp mặt dòng họ/), "Tiêu đề");
    await user.click(screen.getByRole("button", { name: /Tải lên Album/ }));

    expect(await screen.findByText("Vui lòng chọn ảnh và nhập đầy đủ thông tin.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("hiển thị lỗi API khi server từ chối và giữ nguyên Modal", async () => {
    const user = userEvent.setup();
    onSubmit.mockRejectedValue(new Error("Ảnh phải có kích thước tối thiểu 100x100."));
    renderDialog();

    await chooseFile(user, makeFile("nho.jpg", "image/jpeg", MB));
    await user.type(screen.getByPlaceholderText(/Họp mặt dòng họ/), "Tiêu đề");
    await user.type(screen.getByPlaceholderText(/Kể lại khoảnh khắc/), "Mô tả");
    await user.click(screen.getByRole("button", { name: /Tải lên Album/ }));

    expect(await screen.findByText("Ảnh phải có kích thước tối thiểu 100x100.")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});

describe("UT-PHOTO-UPLOAD – Security & RBAC Guard", () => {
  it("hiển thị AccessDenied khi vai trò chưa được cấp quyền upload", () => {
    canUploadImages = false;
    renderDialog();

    expect(screen.getByText("Không có quyền tải ảnh")).toBeInTheDocument();
    expect(screen.queryByText("Tải Ảnh Gia Đình Mới")).not.toBeInTheDocument();
  });

  it("không render form upload khi bị chặn quyền", () => {
    canUploadImages = false;
    renderDialog();

    expect(document.querySelector('input[type="file"]')).toBeNull();
    expect(screen.queryByRole("button", { name: /Tải lên Album/ })).not.toBeInTheDocument();
  });
});

