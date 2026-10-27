export type AlbumCategory = "anniversary" | "reunion" | "tet" | "general";
export type AlbumVisibility = "public" | "family";

export interface AlbumPhoto {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  /** Backend cho phép null; ảnh cũ có thể không nhập ngày chụp. */
  eventDate: string | null;
  category: AlbumCategory;
  uploadedBy: string;
  createdAt: string;
  tags: string[];
  visibility: AlbumVisibility;
}

export interface UploadAlbumPhotoInput {
  title: string;
  description: string;
  /** Gửi multipart nên frontend truyền File thay vì chuỗi base64. */
  image: File;
  eventDate: string;
  category: AlbumCategory;
  tags: string[];
  visibility: AlbumVisibility;
}

