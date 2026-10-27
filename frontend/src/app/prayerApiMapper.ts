import type { Prayer, PrayerCategory, CreatePrayerInput } from "../types/prayer";

export interface PrayerApiRecord {
  id: number;
  family_id: number;
  title: string;
  category: PrayerCategory;
  content: string;
  author_id: number | null;
  author_name?: string | null;
  created_at: string | null;
  updated_at?: string | null;
}

export interface PrayerListResponse {
  data: PrayerApiRecord[];
}

export interface PrayerResponse {
  data?: PrayerApiRecord;
  message?: string;
}

const prayerCategories: PrayerCategory[] = ["tet", "gio_to", "gio_thuong", "nhap_trach", "khac"];

function toCategory(value: unknown): PrayerCategory {
  return typeof value === "string" && (prayerCategories as string[]).includes(value) ? (value as PrayerCategory) : "khac";
}

export function prayerFromApi(record: PrayerApiRecord): Prayer {
  return {
    id: String(record.id),
    familyId: String(record.family_id),
    title: record.title,
    category: toCategory(record.category),
    content: record.content,
    authorName: record.author_name?.trim() || "Ban Trưởng tộc",
    createdAt: record.created_at ?? new Date(0).toISOString(),
  };
}

export function prayerListFromApi(response: PrayerListResponse): Prayer[] {
  return (response.data ?? []).map(prayerFromApi);
}

export function prayerPayload(data: Pick<CreatePrayerInput, "title" | "category" | "content">, familyId?: number | null): Record<string, unknown> {
  return {
    title: data.title.trim(),
    category: data.category,
    content: data.content.trim(),
    // family_id chỉ được gửi khi admin chọn dòng họ khác; null để backend suy ra từ user.
    ...(familyId ? { family_id: familyId } : {}),
  };
}