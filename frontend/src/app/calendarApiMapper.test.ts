import { describe, expect, it } from "vitest";
import { anniversaryReminderFromBroadcast, lunarEventFromApi, lunarMonthFromApi, type LunarEventApiRecord, type LunarMonthApiRecord } from "./calendarApiMapper";

const event: LunarEventApiRecord = {
  id: 1,
  member_id: 2,
  member_name: "Nguyễn Văn Minh",
  generation: 3,
  event_type: "death_anniversary",
  lunar_day: 19,
  lunar_month: 8,
  solar_date: "2026-10-26",
  days_remaining: 5,
  burial_place: "Nghĩa trang",
  organizer: "Ban Trưởng tộc",
  status: "upcoming",
};

describe("calendarApiMapper – nhãn âm lịch do backend tính", () => {
  it("lấy nhãn âm lịch từ API khi backend đã tính sẵn", () => {
    const mapped = lunarEventFromApi({
      ...event,
      lunar_label: "Mùng 19 tháng Tám",
      lunar_day_label: "Mùng 19",
      lunar_month_name: "Tám",
    });

    expect(mapped.lunarLabel).toBe("Mùng 19 tháng Tám");
    expect(mapped.lunarDayLabel).toBe("Mùng 19");
    expect(mapped.lunarMonthName).toBe("Tám");
  });

  it("có nhãn dự phòng khi API cũ chưa trả về", () => {
    const mapped = lunarEventFromApi(event);

    expect(mapped.lunarLabel).toBe("19/8");
    expect(mapped.lunarDayLabel).toBe("Mùng 19");
    expect(mapped.lunarMonthName).toBe("Tháng 8");
  });

  it("ánh xạ lịch âm của tháng sang key date -> nhãn", () => {
    const payload: LunarMonthApiRecord = {
      year: 2026,
      month: 2,
      is_leap_month: false,
      days: [
        { date: "2026-02-17", day_label: "Mùng 1", month_name: "Giêng", lunar_month: 1, is_leap_month: false },
        { date: "2026-03-01", day_label: "Rằm", month_name: "Giêng", lunar_month: 1, is_leap_month: false },
      ],
    };
    const month = lunarMonthFromApi({ data: payload });

    expect(month.days).toHaveLength(2);
    expect(month.days[0]).toEqual({ date: "2026-02-17", dayLabel: "Mùng 1", monthName: "Giêng", lunarMonth: 1, isLeapMonth: false });
    expect(month.days[1].dayLabel).toBe("Rằm");
  });

  it("trả về tháng rỗng khi API không có dữ liệu", () => {
    const month = lunarMonthFromApi({ data: undefined as unknown as LunarMonthApiRecord });

    expect(month.days).toEqual([]);
    expect(month.year).toBe(0);
  });
});

describe("calendarApiMapper – payload nhắc giỗ từ Reverb", () => {
  it("ánh xạ payload broadcast sang AnniversaryReminder", () => {
    const reminder = anniversaryReminderFromBroadcast({
      event_id: 10,
      member_name: "Nguyễn Văn Minh",
      event_type: "death_anniversary",
      solar_date: "2026-10-26",
      lunar_label: "Mùng 19 tháng Tám",
      days_remaining: 7,
      burial_place: "Nghĩa trang",
      organizer: "Ban Trưởng tộc",
    });

    expect(reminder).not.toBeNull();
    expect(reminder?.eventId).toBe("10");
    expect(reminder?.lunarLabel).toBe("Mùng 19 tháng Tám");
    expect(reminder?.daysRemaining).toBe(7);
    expect(reminder?.eventType).toBe("death_anniversary");
  });

  it("trả null khi payload thiếu event_id hoặc không phải object", () => {
    expect(anniversaryReminderFromBroadcast({ member_name: "Không có id" })).toBeNull();
    expect(anniversaryReminderFromBroadcast(null)).toBeNull();
    expect(anniversaryReminderFromBroadcast("chuỗi")).toBeNull();
    expect(anniversaryReminderFromBroadcast(undefined)).toBeNull();
  });

  it("chấp nhận cả hai dạng key event_id và eventId", () => {
    expect(anniversaryReminderFromBroadcast({ eventId: 7 })?.eventId).toBe("7");
    expect(anniversaryReminderFromBroadcast({ event_id: 8 })?.eventId).toBe("8");
  });
});