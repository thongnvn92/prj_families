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
  solarDate: string;
  daysRemaining: number;
  burialPlace: string;
  organizer: string;
  status: LunarEventStatus;
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

export type EventDutyRegistrationInput = Omit<
  EventDutyRegistration,
  "id" | "eventId" | "registeredAt" | "status"
>;
