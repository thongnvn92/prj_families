export type AlbumCategory = "anniversary" | "reunion" | "tet" | "general";
export type AlbumVisibility = "public" | "family";

export interface AlbumPhoto {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  eventDate: string;
  category: AlbumCategory;
  uploadedBy: string;
  createdAt: string;
  tags: string[];
  visibility: AlbumVisibility;
}

export type UploadAlbumPhotoInput = Pick<
  AlbumPhoto,
  "title" | "description" | "imageUrl" | "eventDate" | "category" | "tags" | "visibility"
>;
