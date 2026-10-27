import type { AiContext, AiContextEvent, AiContextFamily, AiContextMember, AiDriver, AiStatus, ChatMessage, ChatReference } from "../types/ai";

interface AiReferenceApiRecord {
  memberId?: string | null;
  name?: string | null;
}

export interface AiChatApiRecord {
  id?: string | null;
  prompt?: string | null;
  text?: string | null;
  references?: AiReferenceApiRecord[] | null;
  driver?: string | null;
  created_at?: string | null;
}

export interface AiContextApiRecord {
  family?: {
    id?: number | string | null;
    name?: string | null;
    root_ancestor_name?: string | null;
    origin_place?: string | null;
    total_members?: number | null;
  } | null;
  key_members?: { member_id?: number | string | null; name?: string | null; generation?: number | null; is_alive?: boolean | null }[] | null;
  upcoming_events?: {
    event_id?: number | string | null;
    member_id?: number | string | null;
    member_name?: string | null;
    event_type?: string | null;
    lunar_day?: number | null;
    lunar_month?: number | null;
    solar_date?: string | null;
  }[] | null;
}

export interface AiChatResponse {
  data?: AiChatApiRecord;
  context?: AiContextApiRecord;
}

export interface AiSuggestionsResponse {
  data?: string[] | null;
  context?: AiContextApiRecord;
  driver?: string | null;
}

export interface AiStatusResponse {
  data?: {
    driver?: string | null;
    model?: string | null;
    family_name?: string | null;
    total_members?: number | null;
    upcoming_events?: number | null;
  } | null;
}

const asString = (value: number | string | null | undefined): string | null => (value === null || value === undefined ? null : String(value));

/** Backend trả "openai" | "fallback"; giá trị lạ coi như fallback để không làm hỏng UI. */
export function aiDriverFromApi(value: string | null | undefined): AiDriver {
  return value === "openai" ? "openai" : "fallback";
}

function referenceFromApi(record: AiReferenceApiRecord): ChatReference | null {
  const memberId = asString(record.memberId);
  if (!memberId) return null;
  return { memberId, name: record.name?.trim() || "Thành viên" };
}

/** Chuẩn hoá bản ghi trả lời của AI về đúng shape ChatMessage mà UI dùng. */
export function aiMessageFromApi(response: AiChatResponse): ChatMessage {
  const record = response.data;
  const references = (record?.references ?? []).map(referenceFromApi).filter((item): item is ChatReference => item !== null);

  return {
    id: record?.id?.trim() || `ai-${Date.now()}`,
    sender: "assistant",
    text: record?.text?.trim() || "Cháu chưa tìm thấy dữ liệu phù hợp trong kho gia phả. Ông/bà vui lòng thử câu hỏi khác ạ.",
    timestamp: record?.created_at || new Date().toISOString(),
    references: references.length > 0 ? references : undefined,
  };
}

function familyFromApi(record: AiContextApiRecord["family"]): AiContextFamily {
  return {
    id: asString(record?.id) ?? "",
    name: record?.name?.trim() || "Dòng họ",
    rootAncestorName: record?.root_ancestor_name?.trim() || null,
    originPlace: record?.origin_place?.trim() || null,
    totalMembers: record?.total_members ?? 0,
  };
}

export function aiContextFromApi(record: AiContextApiRecord | undefined): AiContext {
  const keyMembers: AiContextMember[] = (record?.key_members ?? []).map((item) => ({
    memberId: asString(item.member_id) ?? "",
    name: item.name?.trim() || "Thành viên",
    generation: item.generation ?? 0,
    isAlive: Boolean(item.is_alive),
  }));
  const upcomingEvents: AiContextEvent[] = (record?.upcoming_events ?? []).map((item) => ({
    eventId: asString(item.event_id) ?? "",
    memberId: asString(item.member_id),
    memberName: item.member_name?.trim() || null,
    eventType: item.event_type === "birth_anniversary" ? "birth_anniversary" : "death_anniversary",
    lunarDay: item.lunar_day ?? 0,
    lunarMonth: item.lunar_month ?? 0,
    solarDate: item.solar_date || null,
  }));

  return { family: familyFromApi(record?.family), keyMembers, upcomingEvents };
}

export function aiSuggestionsFromApi(response: AiSuggestionsResponse): string[] {
  return (response.data ?? []).map((item) => item.trim()).filter((item) => item.length > 0);
}

export function aiStatusFromApi(response: AiStatusResponse): AiStatus {
  return {
    driver: aiDriverFromApi(response.data?.driver),
    model: response.data?.model?.trim() || "chưa cấu hình",
    familyName: response.data?.family_name?.trim() || "Dòng họ",
    totalMembers: response.data?.total_members ?? 0,
    upcomingEvents: response.data?.upcoming_events ?? 0,
  };
}

/** Câu hỏi dự phòng khi endpoint gợi ý lỗi để màn hình vẫn dùng được. */
export const FALLBACK_SUGGESTIONS = [
  "Gia tộc ta có nguồn gốc từ đâu?",
  "Xem danh sách các ngày giỗ trong tháng này",
  "Ai là Thủy tổ của dòng họ?",
  "Cho tôi xin bài văn cúng giỗ thường",
];

