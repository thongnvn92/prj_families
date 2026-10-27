import type { AnniversaryReminder, EventDutyRegistration, EventDutyRegistrationInput, EventDutyType, LunarEvent, LunarEventStatus, LunarEventType, LunarMonth } from "../types/calendar";

export interface LunarEventApiRecord {
  id: number;
  member_id: number;
  member_name?: string | null;
  generation?: number | null;
  event_type: LunarEventType;
  lunar_day: number;
  lunar_month: number;
  lunar_year?: number | null;
  lunar_label?: string | null;
  lunar_day_label?: string | null;
  lunar_month_name?: string | null;
  solar_date: string | null;
  days_remaining?: number | null;
  burial_place?: string | null;
  organizer?: string | null;
  status: LunarEventStatus;
}

export interface EventDutyRegistrationApiRecord {
  id: number;
  event_id: number;
  user_id: number;
  member_id?: number | null;
  volunteer_name?: string | null;
  duty_type: EventDutyType;
  phone?: string | null;
  note?: string | null;
  status: "pending" | "confirmed";
  registered_at?: string | null;
}

export interface LunarEventListResponse {
  data: LunarEventApiRecord[];
}

export interface EventDutyRegistrationResponse {
  data?: EventDutyRegistrationApiRecord;
  message?: string;
}

const eventTypes: LunarEventType[] = ["death_anniversary", "birth_anniversary"];
const dutyTypes: EventDutyType[] = ["mam_cung", "hau_can", "both"];
const eventStatuses: LunarEventStatus[] = ["upcoming", "registered", "completed"];

function toEventType(value: unknown): LunarEventType {
  return typeof value === "string" && (eventTypes as string[]).includes(value) ? (value as LunarEventType) : "death_anniversary";
}

function toDutyType(value: unknown): EventDutyType {
  return typeof value === "string" && (dutyTypes as string[]).includes(value) ? (value as EventDutyType) : "both";
}

function toEventStatus(value: unknown): LunarEventStatus {
  return typeof value === "string" && (eventStatuses as string[]).includes(value) ? (value as LunarEventStatus) : "upcoming";
}

export function lunarEventFromApi(record: LunarEventApiRecord): LunarEvent {
  return {
    id: String(record.id),
    memberId: String(record.member_id),
    memberName: record.member_name?.trim() || "Thành viên dòng họ",
    generation: record.generation ?? 0,
    eventType: toEventType(record.event_type),
    lunarDay: record.lunar_day,
    lunarMonth: record.lunar_month,
    // Nhãn âm lịch do backend tính; chỉ dựng phụ fallback khi API cũ chưa trả về.
    lunarLabel: record.lunar_label?.trim() || `${record.lunar_day}/${record.lunar_month}`,
    lunarDayLabel: record.lunar_day_label?.trim() || `Mùng ${record.lunar_day}`,
    lunarMonthName: record.lunar_month_name?.trim() || `Tháng ${record.lunar_month}`,
    solarDate: record.solar_date ?? new Date().toISOString().slice(0, 10),
    daysRemaining: record.days_remaining ?? 0,
    burialPlace: record.burial_place?.trim() || "Chưa cập nhật",
    organizer: record.organizer?.trim() || "Ban tổ chức dòng họ",
    status: toEventStatus(record.status),
  };
}

export interface LunarMonthApiRecord {
  year: number;
  month: number;
  is_leap_month: boolean;
  days: { date: string; day_label: string; month_name: string; lunar_month: number; is_leap_month: boolean }[];
}

export interface LunarMonthResponse {
  data: LunarMonthApiRecord;
}

export function lunarMonthFromApi(response: LunarMonthResponse): LunarMonth {
  return {
    year: response.data?.year ?? 0,
    month: response.data?.month ?? 0,
    isLeapMonth: response.data?.is_leap_month ?? false,
    days: (response.data?.days ?? []).map((day) => ({
      date: day.date,
      dayLabel: day.day_label,
      monthName: day.month_name,
      lunarMonth: day.lunar_month,
      isLeapMonth: day.is_leap_month,
    })),
  };
}

/**
 * Ánh xạ payload broadcast của AnniversaryReminderSent (nhãn đã ở dạng camelCase
 * vì controller trả sẵn trong broadcastWith()).
 */
export function anniversaryReminderFromBroadcast(payload: unknown): AnniversaryReminder | null {
  if (typeof payload !== "object" || payload === null) return null;
  const record = payload as Record<string, unknown>;
  const eventId = record.event_id ?? record.eventId;
  if (eventId === undefined || eventId === null) return null;

  return {
    eventId: String(eventId),
    memberName: typeof record.member_name === "string" ? record.member_name : "Thành viên dòng họ",
    eventType: toEventType(record.event_type),
    solarDate: typeof record.solar_date === "string" ? record.solar_date : "",
    lunarLabel: typeof record.lunar_label === "string" ? record.lunar_label : "",
    daysRemaining: typeof record.days_remaining === "number" ? record.days_remaining : 0,
    burialPlace: typeof record.burial_place === "string" ? record.burial_place : "",
    organizer: typeof record.organizer === "string" ? record.organizer : "",
  };
}

export function lunarEventListFromApi(response: LunarEventListResponse): LunarEvent[] {
  return (response.data ?? []).map(lunarEventFromApi);
}

export function dutyRegistrationFromApi(record: EventDutyRegistrationApiRecord): EventDutyRegistration {
  return {
    id: String(record.id),
    eventId: String(record.event_id),
    // Backend gắn user đăng ký vào duty, nên memberId lấy từ user_id khi resource không trả member_id.
    memberId: String(record.member_id ?? record.user_id),
    volunteerName: record.volunteer_name?.trim() || "Thành viên dòng họ",
    dutyType: toDutyType(record.duty_type),
    phone: record.phone ?? "",
    note: record.note ?? "",
    status: record.status,
    registeredAt: record.registered_at ?? new Date(0).toISOString(),
  };
}

export function dutyRegistrationPayload(dutyData: EventDutyRegistrationInput): Record<string, unknown> {
  return {
    duty_type: dutyData.dutyType,
    phone: dutyData.phone.trim() || null,
    note: dutyData.note.trim() || null,
  };
}