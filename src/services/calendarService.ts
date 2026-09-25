import type { EventDutyRegistration, EventDutyRegistrationInput, LunarEvent, LunarEventStatus } from "../types/calendar";
import { hasRolePermission, type AppRole } from "../context/AuthContext";

const MOCK_LATENCY = 200;
const registrations: EventDutyRegistration[] = [];

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY));
}

function dateKey(date: Date): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

function dateFromToday(days: number): Date {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

function eventStatus(eventId: string): LunarEventStatus {
  return registrations.some((registration) => registration.eventId === eventId) ? "registered" : "upcoming";
}

const eventSeeds: Array<Omit<LunarEvent, "solarDate" | "daysRemaining" | "status"> & { offset: number }> = [
  { id: "gioi-thuy-tot", memberId: "minh", memberName: "Nguyễn Văn Minh", generation: 1, eventType: "death_anniversary", lunarDay: 19, lunarMonth: 8, burialPlace: "Khu di tích gia tộc, Bắc Ninh", organizer: "Ban Trưởng tộc · Chi 3", offset: 3 },
  { id: "gioi-ba-ngoai", memberId: "sau", memberName: "Nguyễn Thị Sáu", generation: 1, eventType: "death_anniversary", lunarDay: 7, lunarMonth: 10, burialPlace: "Khu di tích gia tộc, Bắc Ninh", organizer: "Ban Trưởng tộc · Chi 3", offset: 7 },
  { id: "gioi-cu-thanh", memberId: "van-thanh", memberName: "Nguyễn Văn Thành", generation: 2, eventType: "death_anniversary", lunarDay: 23, lunarMonth: 12, burialPlace: "Nghĩa trang làng Trung, Bắc Ninh", organizer: "Trưởng chi Nguyễn Văn Hiền", offset: 12 },
  { id: "gioi-ba-nga", memberId: "nga", memberName: "Nguyễn Thị Nga", generation: 2, eventType: "death_anniversary", lunarDay: 5, lunarMonth: 11, burialPlace: "Nghĩa trang làng Trung, Bắc Ninh", organizer: "Trưởng chi Nguyễn Văn Hiền", offset: 18 },
  { id: "gioi-cu-dung", memberId: "dung", memberName: "Nguyễn Văn Dũng", generation: 2, eventType: "death_anniversary", lunarDay: 29, lunarMonth: 3, burialPlace: "Khu di tích gia tộc, Bắc Ninh", organizer: "Trưởng chi Nguyễn Văn Tuấn", offset: 26 },
  { id: "sinh-duc", memberId: "duc", memberName: "Nguyễn Văn Đức", generation: 2, eventType: "birth_anniversary", lunarDay: 8, lunarMonth: 2, burialPlace: "Ghi nhận sinh nhật thành viên", organizer: "Gia đình Họ Nguyễn", offset: 34 },
];

function buildEvent(seed: (typeof eventSeeds)[number]): LunarEvent {
  const date = dateFromToday(seed.offset);
  return { ...seed, solarDate: dateKey(date), daysRemaining: seed.offset, status: eventStatus(seed.id) };
}

export async function getUpcomingEvents(role: AppRole): Promise<LunarEvent[]> {
  if (!hasRolePermission(role, "canUsePrivateSections")) throw new Error("Bạn không có quyền xem lịch giỗ nội bộ.");
  return delay(eventSeeds.map(buildEvent).filter((event) => event.daysRemaining >= 0).sort((a, b) => a.daysRemaining - b.daysRemaining));
}

export async function getEventsByMonth(year: number, month: number, role: AppRole): Promise<LunarEvent[]> {
  if (!hasRolePermission(role, "canUsePrivateSections")) throw new Error("Bạn không có quyền xem lịch giỗ nội bộ.");
  return delay(eventSeeds.map(buildEvent).filter((event) => {
    const [eventYear, eventMonth] = event.solarDate.split("-").map(Number);
    return eventYear === year && eventMonth === month;
  }).sort((a, b) => a.solarDate.localeCompare(b.solarDate)));
}

export async function registerEventDuty(eventId: string, dutyData: EventDutyRegistrationInput, role: AppRole): Promise<EventDutyRegistration> {
  if (!hasRolePermission(role, "canUsePrivateSections")) throw new Error("Bạn không có quyền đăng ký nhiệm vụ.");
  const registration: EventDutyRegistration = {
    ...dutyData,
    id: `duty-${Date.now()}`,
    eventId,
    status: "confirmed",
    registeredAt: new Date().toISOString(),
  };
  registrations.push(registration);
  return delay({ ...registration });
}
