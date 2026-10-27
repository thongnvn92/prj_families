import type { AlbumCategory, AlbumPhoto, AlbumVisibility, UploadAlbumPhotoInput } from "../types/album";

export interface AlbumPhotoApiRecord {
  id: number;
  family_id: number;
  title: string;
  description?: string | null;
  image_url: string;
  event_date?: string | null;
  category: AlbumCategory;
  visibility: AlbumVisibility;
  tags?: string[] | null;
  uploaded_by?: number | null;
  /** Bị bỏ trống khi request của khách nên frontend che thành nhãn chung. */
  uploader_name?: string | null;
  created_at?: string | null;
}

export interface AlbumPhotoListResponse { data?: AlbumPhotoApiRecord[]; meta?: { current_page?: number; last_page?: number | null; total?: number } }
export interface AlbumPhotoResponse { data?: AlbumPhotoApiRecord }

const categories: AlbumCategory[] = ["anniversary", "reunion", "tet", "general"];
const visibilities: AlbumVisibility[] = ["public", "family"];

function toCategory(value: unknown): AlbumCategory {
  return typeof value === "string" && (categories as string[]).includes(value) ? (value as AlbumCategory) : "general";
}

function toVisibility(value: unknown): AlbumVisibility {
  return typeof value === "string" && (visibilities as string[]).includes(value) ? (value as AlbumVisibility) : "family";
}

export function albumPhotoFromApi(record: AlbumPhotoApiRecord): AlbumPhoto {
  return {
    id: String(record.id),
    title: record.title?.trim() || "Kỷ niệm gia đình",
    description: record.description?.trim() ?? "",
    imageUrl: record.image_url ?? "",
    eventDate: record.event_date ?? null,
    category: toCategory(record.category),
    uploadedBy: record.uploader_name?.trim() || "Ban quản trị dòng họ",
    createdAt: record.created_at ?? new Date(0).toISOString(),
    tags: (record.tags ?? []).map((tag) => String(tag).trim()).filter(Boolean),
    visibility: toVisibility(record.visibility),
  };
}

// Backend phân trang nên response có { data, meta, links }.
export function albumPhotoListFromApi(response: AlbumPhotoListResponse): AlbumPhoto[] {
  return (response.data ?? []).map(albumPhotoFromApi);
}

export function albumPhotoFormData(input: UploadAlbumPhotoInput): FormData {
  const form = new FormData();
  form.append("title", input.title.trim());
  form.append("description", input.description.trim());
  form.append("event_date", input.eventDate);
  form.append("category", input.category);
  form.append("visibility", input.visibility);
  form.append("image", input.image);
  input.tags.map((tag) => tag.trim()).filter(Boolean).forEach((tag) => form.append("tags[]", tag));
  return form;
}
