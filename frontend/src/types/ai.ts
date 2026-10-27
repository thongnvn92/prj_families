export interface ChatReference {
  memberId: string;
  name: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  references?: ChatReference[];
}

/** Driver đang trả lời: LLM thật hay fallback nội bộ dựa trên dữ liệu gia phả. */
export type AiDriver = "openai" | "fallback";

export interface AiContextFamily {
  id: string;
  name: string;
  rootAncestorName: string | null;
  originPlace: string | null;
  totalMembers: number;
}

export interface AiContextMember {
  memberId: string;
  name: string;
  generation: number;
  isAlive: boolean;
}

export interface AiContextEvent {
  eventId: string;
  memberId: string | null;
  memberName: string | null;
  eventType: "death_anniversary" | "birth_anniversary";
  lunarDay: number;
  lunarMonth: number;
  solarDate: string | null;
}

/** Ngữ cảnh gia tộc backend truy xuất từ DB, dùng hiển thị "nguồn tri thức". */
export interface AiContext {
  family: AiContextFamily;
  keyMembers: AiContextMember[];
  upcomingEvents: AiContextEvent[];
}

export interface AiStatus {
  driver: AiDriver;
  model: string;
  familyName: string;
  totalMembers: number;
  upcomingEvents: number;
}

