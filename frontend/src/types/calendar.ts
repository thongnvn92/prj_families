export type LunarEventType = "death_anniversary" | "birth_anniversary";
export type LunarEventStatus = "upcoming" | "registered" | "completed";
export type EventDutyType = "mam_cung" | "hau_can" | "both";

export interface LunarEvent {
  id: string;
  memberId: string;
  memberName: string;
  generation: number;
  eventType: LunarEventType;
  lunarDay: number;
  lunarMonth: number;
  /** Nhãn ngày âm do backend tính sẵn, ví dụ "Rằm tháng Giêng". */
  lunarLabel: string;
  lunarDayLabel: string;
  lunarMonthName: string;
  solarDate: string;
  daysRemaining: number;
  burialPlace: string;
  organizer: string;
  status: LunarEventStatus;
}

/** Một ngày trong lịch âm do backend tính sẵn. */
export interface LunarMonthDay {
  date: string;
  dayLabel: string;
  monthName: string;
  lunarMonth: number;
  isLeapMonth: boolean;
}

/** Lịch âm của một tháng dương, dùng để vẽ nhãn ngày âm lên lịch. */
export interface LunarMonth {
  year: number;
  month: number;
  isLeapMonth: boolean;
  days: LunarMonthDay[];
}

/** Thông báo nhắc giỗ đẩy từ job qua Reverb trên channel nền của tài khoản. */
export interface AnniversaryReminder {
  eventId: string;
  memberName: string;
  eventType: LunarEventType;
  solarDate: string;
  lunarLabel: string;
  daysRemaining: number;
  burialPlace: string;
  organizer: string;
}

export interface EventDutyRegistration {
  id: string;
  eventId: string;
  memberId: string;
  volunteerName: string;
  dutyType: EventDutyType;
  phone: string;
  note: string;
  status: "pending" | "confirmed";
  registeredAt: string;
}

/**
 * Input gửi lên API: backend tự lấy user đăng ký từ Bearer token nên
 * không cần (và không được phép) gửi memberId/volunteerName từ client.
 */
export type EventDutyRegistrationInput = Pick<EventDutyRegistration, "dutyType" | "phone" | "note">;
