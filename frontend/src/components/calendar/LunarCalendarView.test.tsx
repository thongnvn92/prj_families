import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LunarCalendarView } from "./LunarCalendarView";
import { lunarEvent } from "../../test/fixtures";
import type { AppRole } from "../../context/AuthContext";
import type { EventDutyRegistrationInput } from "../../types/calendar";

/*
 * `vi.mock` được hoist lên đầu file, nên factory không được tham chiếu biến
 * `const` khai báo phía dưới (rơi vào TDZ). Dùng `vi.hoisted()` là pattern an toàn.
 */
const h = vi.hoisted(() => ({
  currentRole: "member" as AppRole,
  registerDuty: vi.fn(),
  events: [] as unknown[],
  // Nhãn ngày âm do backend đẩy lên; mock theo cùng contract với API thật.
  lunarDays: [] as { date: string; dayLabel: string }[],
}));

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    currentRole: h.currentRole,
    user: { id: 1, name: "Nguyễn Gia Bảo" },
    isInitializing: false,
    permissions: { canUsePrivateSections: h.currentRole !== "guest" },
  }),
}));

vi.mock("../../app/calendarApi", () => ({
  useGetUpcomingEventsQuery: () => ({ data: h.events, isLoading: false, isError: false, refetch: () => {} }),
  useGetEventsByMonthQuery: () => ({ data: h.events, isLoading: false, isError: false, refetch: () => {} }),
  useGetLunarMonthQuery: () => ({
    data: { year: 2026, month: 3, isLeapMonth: false, days: h.lunarDays },
    isLoading: false,
    isError: false,
    refetch: () => {},
  }),
  useRegisterEventDutyMutation: () => [h.registerDuty, { isLoading: false }],
}));

// Hook realtime dùng Echo thật (Pusher) nên không hoạt động trong jsdom.
vi.mock("../../lib/useAnniversaryReminder", () => ({ useAnniversaryReminder: () => undefined }));

beforeEach(() => {
  h.currentRole = "member";
  h.events = [lunarEvent()];
  h.lunarDays = [{ date: "2026-03-20", dayLabel: "Mùng 15" }];
  h.registerDuty.mockReset();
  h.registerDuty.mockReturnValue({ unwrap: () => Promise.resolve({}) });
});

async function openDutyDialog(user: ReturnType<typeof userEvent.setup>) {
  render(<LunarCalendarView />);
  // Dùng role + regex theo accessible name, không phụ thuộc thứ tự DOM.
  const trigger = await screen.findByText(/^Đăng ký mâm cúng \/ hậu cần$/);
  await user.click(trigger);
  return screen.findByText("Đăng ký nhiệm vụ");
}

describe("UT-CALENDAR-DUTY – Normal / Happy Path", () => {
  it("mở dialog đăng ký và hiển thị tên người đăng ký lấy từ session", async () => {
    const user = userEvent.setup();
    await openDutyDialog(user);

    expect(await screen.findByText("Nguyễn Gia Bảo")).toBeInTheDocument();
    expect(screen.getByText(/chuẩn bị cho/i)).toBeInTheDocument();
  });

  it("đăng ký thành công với số điện thoại hợp lệ", async () => {
    const user = userEvent.setup();
    await openDutyDialog(user);

    await user.type(screen.getByPlaceholderText("090 000 0000"), "0912345678");
    await user.type(screen.getByPlaceholderText(/có thể chuẩn bị từ/), "Có thể chuẩn bị từ 7 giờ sáng");
    await user.click(screen.getByRole("button", { name: /Xác nhận đăng ký/ }));

    await waitFor(() => expect(h.registerDuty).toHaveBeenCalledTimes(1));
    // Mutation được gọi với object { authKey, eventId, dutyData }.
    const args = h.registerDuty.mock.calls[0][0] as { authKey: string; eventId: string; dutyData: EventDutyRegistrationInput };
    expect(args.eventId).toBe("10");
    expect(args.authKey).toBe("member");
    expect(args.dutyData.phone).toBe("0912345678");
    expect(args.dutyData.dutyType).toBe("mam_cung");
    expect(args.dutyData.note).toBe("Có thể chuẩn bị từ 7 giờ sáng");
    // Client KHÔNG được gửi memberId/volunteerName — backend lấy từ Bearer token.
    expect(args.dutyData).not.toHaveProperty("memberId");
    expect(args.dutyData).not.toHaveProperty("volunteerName");
  });

  it("đóng dialog sau khi đăng ký thành công", async () => {
    const user = userEvent.setup();
    await openDutyDialog(user);

    await user.type(screen.getByPlaceholderText("090 000 0000"), "0912345678");
    await user.click(screen.getByRole("button", { name: /Xác nhận đăng ký/ }));

    await waitFor(() => expect(h.registerDuty).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText("Đăng ký nhiệm vụ")).not.toBeInTheDocument());
  });

  it("cho phép ghi chú rỗng", async () => {
    const user = userEvent.setup();
    await openDutyDialog(user);

    await user.type(screen.getByPlaceholderText("090 000 0000"), "0912345678");
    await user.click(screen.getByRole("button", { name: /Xác nhận đăng ký/ }));

    await waitFor(() => expect(h.registerDuty).toHaveBeenCalled());
    const args = h.registerDuty.mock.calls[0][0] as { dutyData: EventDutyRegistrationInput };
    expect(args.dutyData.note).toBe("");
  });
});



describe("UT-CALENDAR-DUTY – Abnormal / Validation", () => {
  it("HTML5 validation chặn submit khi thiếu số điện thoại", async () => {
    const user = userEvent.setup();
    await openDutyDialog(user);

    await user.click(screen.getByRole("button", { name: /Xác nhận đăng ký/ }));

    expect(screen.getByPlaceholderText("090 000 0000")).toBeRequired();
    expect(h.registerDuty).not.toHaveBeenCalled();
  });

  it("DEFECT-01 đã fix: input SĐT ràng buộc định dạng số điện thoại Việt Nam", async () => {
    const user = userEvent.setup();
    await openDutyDialog(user);
    const input = screen.getByPlaceholderText("090 000 0000");

    // inputMode bật bàn phím số trên mobile; title hiện gợi ý định dạng.
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("inputmode", "tel");
    expect(input).toHaveAttribute("title", expect.stringContaining("0901234567"));
  });

  it("chặn submit khi số điện thoại sai định dạng và báo lỗi tiếng Việt", async () => {
    const user = userEvent.setup();
    await openDutyDialog(user);

    await user.type(screen.getByPlaceholderText("090 000 0000"), "abc");
    await user.click(screen.getByRole("button", { name: /Xác nhận đăng ký/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Số điện thoại chưa hợp lệ");
    expect(h.registerDuty).not.toHaveBeenCalled();
  });

  it("chặn số điện thoại quá ngắn hoặc sai mã quốc gia", async () => {
    const user = userEvent.setup();
    await openDutyDialog(user);

    await user.type(screen.getByPlaceholderText("090 000 0000"), "0901234");
    await user.click(screen.getByRole("button", { name: /Xác nhận đăng ký/ }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("090 000 0000"));
    await user.type(screen.getByPlaceholderText("090 000 0000"), "+14155550123");
    await user.click(screen.getByRole("button", { name: /Xác nhận đăng ký/ }));
    expect(h.registerDuty).not.toHaveBeenCalled();
  });

  it("chuẩn hoá số điện thoại có khoảng trắng trước khi gửi", async () => {
    const user = userEvent.setup();
    await openDutyDialog(user);

    await user.type(screen.getByPlaceholderText("090 000 0000"), "090 123 4567");
    await user.click(screen.getByRole("button", { name: /Xác nhận đăng ký/ }));

    await waitFor(() => expect(h.registerDuty).toHaveBeenCalled());
    const args = h.registerDuty.mock.calls[0][0] as { dutyData: EventDutyRegistrationInput };
    expect(args.dutyData.phone).toBe("0901234567");
  });

  it("DEFECT-02 đã fix: lỗi API không làm kẹt nút và hiện thông báo", async () => {
    const user = userEvent.setup();
    h.registerDuty.mockReturnValue({ unwrap: () => Promise.reject({ data: { message: "Bạn đã đăng ký sự kiện này rồi." } }) });
    render(<LunarCalendarView />);
    await user.click(await screen.findByText(/^Đăng ký mâm cúng \/ hậu cần$/));
    await screen.findByText("Đăng ký nhiệm vụ");

    await user.type(screen.getByPlaceholderText("090 000 0000"), "0912345678");
    await user.click(screen.getByRole("button", { name: /Xác nhận đăng ký/ }));

    // try/catch/finally: nút trở lại bấm được và lỗi server hiện ra.
    expect(await screen.findByText(/Bạn đã đăng ký sự kiện này rồi\./)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Xác nhận đăng ký/ })).toBeEnabled();
    expect(screen.getByText("Đăng ký nhiệm vụ")).toBeInTheDocument();
  });

  it("sau lỗi, sửa dữ liệu và gửi lại vẫn được", async () => {
    const user = userEvent.setup();
    h.registerDuty.mockReturnValue({ unwrap: () => Promise.reject({ data: { message: "Bạn đã đăng ký sự kiện này rồi." } }) });
    render(<LunarCalendarView />);
    await user.click(await screen.findByText(/^Đăng ký mâm cúng \/ hậu cần$/));
    await screen.findByText("Đăng ký nhiệm vụ");

    await user.type(screen.getByPlaceholderText("090 000 0000"), "0912345678");
    await user.click(screen.getByRole("button", { name: /Xác nhận đăng ký/ }));
    await screen.findByText(/Bạn đã đăng ký sự kiện này rồi\./);

    h.registerDuty.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    await user.click(screen.getByRole("button", { name: /Xác nhận đăng ký/ }));

    await waitFor(() => expect(h.registerDuty).toHaveBeenCalledTimes(2));
  });
});

describe("UT-CALENDAR-DUTY – Security & RBAC Guard", () => {
  it("không cho Guest xem lịch và đăng ký nhiệm vụ", async () => {
    h.currentRole = "guest";
    render(<LunarCalendarView />);

    expect(await screen.findByText("Lịch Âm & Nhắc giỗ dành cho thành viên")).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: /^Đăng ký mâm cúng/ })).toHaveLength(0);
  });

  it("Member vẫn được đăng ký nhiệm vụ", async () => {
    render(<LunarCalendarView />);

    expect(await screen.findAllByRole("button", { name: /^Đăng ký mâm cúng/ })).not.toHaveLength(0);
  });

  it("DEFECT-03 đã fix: nút Nhắc dòng họ nói rõ chưa gửi qua Zalo/Telegram", async () => {
    const user = userEvent.setup();
    render(<LunarCalendarView />);

    const button = await screen.findAllByTitle(/chưa được tích hợp/);
    expect(button.length).toBeGreaterThan(0);
    await user.click(button[0]);

    // Toast không được hứa "đã gửi" khi hệ thống thực tế chưa gửi gì.
    const toast = await screen.findByText(/Đã ghi nhận lời nhắc/);
    expect(toast).toHaveTextContent("chưa được cấu hình");
    expect(h.registerDuty).not.toHaveBeenCalled();
  });
});

