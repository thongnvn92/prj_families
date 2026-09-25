export type PrayerCategory = "tet" | "gio_to" | "gio_thuong" | "nhap_trach" | "khac";

export interface Prayer {
  id: string;
  familyId: string;
  title: string;
  category: PrayerCategory;
  content: string;
  authorName: string;
  createdAt: string;
}

export type CreatePrayerInput = Pick<Prayer, "familyId" | "title" | "category" | "content" | "authorName">;
