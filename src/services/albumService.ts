import type { UploadAlbumPhotoInput, AlbumPhoto } from "../types/album";
import { hasRolePermission, type AppRole } from "../context/AuthContext";
import { getBase64ByteLength, MAX_IMAGE_BASE64_BYTES } from "../lib/imageCompression";

const MOCK_LATENCY = 200;
const photos: AlbumPhoto[] = [
  {
    id: "photo-tet-2025", title: "Gia đình quây quần ngày Tết", description: "Cả dòng họ Họ Nguyễn Chi 3 quây quần chụp ảnh khai xuân tại nhà Thủy Tổ.", imageUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1400&q=86", eventDate: "2025-01-29", category: "tet", uploadedBy: "Nguyễn Thị Lan", createdAt: "2025-02-02T03:20:00.000Z", tags: ["Tết Nguyên Đán", "Chi 3", "Gia đình"], visibility: "public",
  },
  {
    id: "photo-reunion-2024", title: "Họp mặt dòng họ tại Bắc Ninh", description: "Ảnh lưu niệm hội nghị dòng họ, các chi tụ họp tại khu di tích gia tộc.", imageUrl: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1400&q=86", eventDate: "2024-10-12", category: "reunion", uploadedBy: "Ban Thương binh gia đình", createdAt: "2024-10-14T08:00:00.000Z", tags: ["Họp mặt", "Bắc Ninh", "Dòng họ"], visibility: "public",
  },
  {
    id: "photo-ancestral-2023", title: "Giỗ cụ Nguyễn Văn Minh", description: "Những khoảnh khắc các thế hệ hướng về bàn thờ tổ, cụ, cố và ông bà đã khuất.", imageUrl: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=1400&q=86", eventDate: "2023-09-23", category: "anniversary", uploadedBy: "Nguyễn Văn Tuấn", createdAt: "2023-09-24T01:10:00.000Z", tags: ["Giỗ tổ", "Nguyễn Văn Minh", "Nghi lễ"], visibility: "public",
  },
  {
    id: "photo-home-1998", title: "Ngôi nhà cũ của dòng họ", description: "Ảnh lịch sử chụp trước mái nhà cổ, lưu giữ ký ức của những năm tháng xưa.", imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=86", eventDate: "1998-06-15", category: "general", uploadedBy: "Cụ Nguyễn Văn Hiền", createdAt: "2020-05-21T04:00:00.000Z", tags: ["Nhà cổ", "Ký ức", "Gia đình"], visibility: "family",
  },
  {
    id: "photo-spring-2022", title: "Xuân về trên phố cổ", description: "Các bậc trẻ trong dòng họ dạo phố cổ Hội An trong chuyến công tác về Nam sau dịch Tết.", imageUrl: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1400&q=86", eventDate: "2022-02-12", category: "general", uploadedBy: "Nguyễn Thị Huyền", createdAt: "2022-02-20T09:30:00.000Z", tags: ["Phố cổ", "Thế hệ trẻ"], visibility: "family",
  },
  {
    id: "photo-tet-2021", title: "Mâm cúng đầu xuân", description: "Hình ảnh lưu niệm mâm cúng ngày Tết và lời chúc của các bậc trưởng thượng.", imageUrl: "https://images.unsplash.com/photo-1577083753693-e0101814dc05?auto=format&fit=crop&w=1400&q=86", eventDate: "2021-02-12", category: "tet", uploadedBy: "Nguyễn Thị Nga", createdAt: "2021-02-13T07:45:00.000Z", tags: ["Mâm cúng", "Tết", "Truyền thống"], visibility: "public",
  },
  {
    id: "photo-elders-2019", title: "Tiệc mừng bà lão thọ 90", description: "Cả nhà thu gom những tấm ảnh quý trong chương trình họp mặt chúc mừng bà Nguyễn Thị Nga.", imageUrl: "https://images.unsplash.com/photo-1544725121-be3bf52e2dc8?auto=format&fit=crop&w=1400&q=86", eventDate: "2019-09-10", category: "reunion", uploadedBy: "Nguyễn Thị Lan", createdAt: "2019-09-11T02:15:00.000Z", tags: ["Chúc mừng", "Trưởng bậc"], visibility: "public",
  },
  {
    id: "photo-tomb-2020", title: "Về nguồn thăm đền tổ", description: "Phái đoàn thế hệ trẻ về thăm đền thờ và tìm hiểu cội nguồn dòng họ.", imageUrl: "https://images.unsplash.com/photo-1562557305-35fd46a4dd52?auto=format&fit=crop&w=1400&q=86", eventDate: "2020-03-21", category: "general", uploadedBy: "Nguyễn Gia Long", createdAt: "2020-03-25T06:40:00.000Z", tags: ["Nguồn gốc", "Đền tổ"], visibility: "family",
  },
];

function delay<T>(operation: () => T): Promise<T> { return new Promise((resolve, reject) => setTimeout(() => { try { resolve(operation()); } catch (error) { reject(error); } }, MOCK_LATENCY)); }
function clone(photo: AlbumPhoto): AlbumPhoto { return { ...photo, tags: [...photo.tags] }; }
function publicProjection(photo: AlbumPhoto): AlbumPhoto { return { ...clone(photo), uploadedBy: "Ban quản trị dòng họ" }; }

export async function getPhotos(role: AppRole): Promise<AlbumPhoto[]> {
  return delay(() => photos.filter((photo) => role !== "guest" || photo.visibility === "public").sort((a, b) => b.eventDate.localeCompare(a.eventDate)).map((photo) => role === "guest" ? publicProjection(photo) : clone(photo)));
}

export async function uploadPhoto(data: UploadAlbumPhotoInput, role: AppRole): Promise<AlbumPhoto> {
  if (!hasRolePermission(role, "canUploadPhotos")) throw new Error("Bạn không có quyền tải ảnh lên Album gia đình.");
  return delay(() => {
    if (!data.title.trim() || !data.description.trim() || !data.eventDate) throw new Error("Vui lòng nhập tên ảnh, ngày chụp và mô tả.");
    if (!data.imageUrl.startsWith("data:image/")) throw new Error("Ảnh tải lên phải là chuỗi Base64 hợp lệ.");
    if (getBase64ByteLength(data.imageUrl) >= MAX_IMAGE_BASE64_BYTES) throw new Error("Ảnh sau khi nén phải nhỏ hơn 10MB.");
    const photo: AlbumPhoto = { id: `photo-${Date.now()}`, title: data.title.trim(), description: data.description.trim(), imageUrl: data.imageUrl, eventDate: data.eventDate, category: data.category, uploadedBy: "Nguyễn Văn An", createdAt: new Date().toISOString(), tags: data.tags.map((tag) => tag.trim()).filter(Boolean), visibility: data.visibility };
    photos.unshift(photo);
    return clone(photo);
  });
}
