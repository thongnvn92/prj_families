import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Eye, Image as ImageIcon, LockKeyhole, Plus, RefreshCw, Sparkles } from "lucide-react";
import { getApiErrorMessage } from "../../app/apiSlice";
import { useGetPhotosQuery, useUploadPhotoMutation } from "../../app/albumApi";
import { useAuth } from "../../context/AuthContext";
import { useFamilySettings } from "../../lib/useFamilySettings";
import type { AlbumCategory, AlbumPhoto, UploadAlbumPhotoInput } from "../../types/album";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { PhotoLightboxModal } from "./PhotoLightboxModal";
import { PhotoUploadDialog } from "./PhotoUploadDialog";

const filters: { value: AlbumCategory | "all"; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "anniversary", label: "Lễ Giỗ" },
  { value: "reunion", label: "Họp Mặt" },
  { value: "tet", label: "Ngày Tết" },
  { value: "general", label: "Gia đình" },
];
const labels: Record<AlbumCategory, string> = { anniversary: "Lễ Giỗ", reunion: "Họp Mặt", tet: "Ngày Tết", general: "Gia đình" };
const ratios = ["aspect-[4/3]", "aspect-[3/4]", "aspect-[16/10]"] as const;
const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T00:00:00`)) : "Chưa rõ ngày";

export function FamilyAlbumView() {
  const { currentRole, isInitializing } = useAuth();
  // Quyền tải ảnh do Admin cấu hình trong family_settings, không hard-code theo role.
  const { canUploadImages } = useFamilySettings();
  const [category, setCategory] = useState<AlbumCategory | "all">("all");
  const [selectedPhoto, setSelectedPhoto] = useState<AlbumPhoto | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [toast, setToast] = useState("");
  const { data: photos = [], isLoading, isFetching, isError, error, refetch } = useGetPhotosQuery({ authKey: currentRole }, { skip: isInitializing });
  const [uploadPhotoMutation] = useUploadPhotoMutation();
  const visiblePhotos = useMemo(() => category === "all" ? photos : photos.filter((photo) => photo.category === category), [category, photos]);
  const selectedIndex = selectedPhoto ? visiblePhotos.findIndex((photo) => photo.id === selectedPhoto.id) : -1;
  const showPrevious = () => { if (selectedIndex > 0) setSelectedPhoto(visiblePhotos[selectedIndex - 1]); };
  const showNext = () => { if (selectedIndex >= 0 && selectedIndex < visiblePhotos.length - 1) setSelectedPhoto(visiblePhotos[selectedIndex + 1]); };
  const upload = async (data: UploadAlbumPhotoInput) => {
    let created: AlbumPhoto;
    try {
      created = await uploadPhotoMutation({ authKey: currentRole, data }).unwrap();
    } catch (uploadError) {
      // unwrap() ném FetchBaseQueryError nên phải chuyển sang Error để dialog hiện đúng thông báo API.
      throw new Error(getApiErrorMessage(uploadError, "Không thể tải ảnh lên Album gia đình."));
    }
    setCategory("all");
    setToast(`Đã thêm “${created.title}” vào Album gia đình.`);
    window.setTimeout(() => setToast(""), 3800);
  };

  return (
    <div className="space-y-6">
      <section className="paper-grid relative overflow-hidden rounded-3xl border border-wine/15 bg-[#fffaf0] p-6 shadow-sm sm:p-8">
        <div className="absolute -right-16 -top-20 size-64 rounded-full border border-gold/25" />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <Badge variant="gold" className="mb-3"><Sparkles className="mr-1 size-3" />Kho ảnh gia tộc</Badge>
            <h1 className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">Album Gia Đình</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">Lưu giữ khoảnh khắc Tết, ngày giỗ và họp mặt của dòng Nguyễn qua từng thế hệ.</p>
            <p className="mt-3 text-xs font-semibold text-gold-deep">{photos.length} kỷ niệm đang hiển thị</p>
          </div>
          {canUploadImages ? <Button onClick={() => setUploadOpen(true)}><Plus className="size-4" />Tải Ảnh Gia Đình</Button> : (
            <div className="rounded-2xl border border-gold/25 bg-white/75 p-4 text-xs leading-5 text-stone-500"><p className="flex items-center gap-2 font-semibold text-wine"><Eye className="size-4" />Chế độ xem công khai</p>Chỉ hiển thị ảnh được chia sẻ công khai.</div>
          )}
        </div>
      </section>

      <GalleryFilters category={category} setCategory={setCategory} photos={photos} onRefresh={() => void refetch()} isFetching={isFetching} />

      {isLoading ? <GallerySkeleton /> : isError ? <GalleryError message={getApiErrorMessage(error, "Không tải được Album gia đình.")} onRetry={() => void refetch()} /> : visiblePhotos.length === 0 ? <GalleryEmpty /> : (
        <div className={`columns-1 gap-5 sm:columns-2 xl:columns-3 2xl:columns-4 ${isFetching ? "opacity-70" : ""}`}>
          {visiblePhotos.map((photo, index) => <PhotoCard key={photo.id} photo={photo} ratio={ratios[index % ratios.length]} onOpen={() => setSelectedPhoto(photo)} />)}
        </div>
      )}

      <PhotoLightboxModal photo={selectedPhoto} open={Boolean(selectedPhoto)} onOpenChange={(open) => !open && setSelectedPhoto(null)} onPrevious={visiblePhotos.length > 1 ? showPrevious : undefined} onNext={visiblePhotos.length > 1 ? showNext : undefined} />
      <PhotoUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} onSubmit={upload} />
      {toast && <div role="status" className="fixed bottom-5 right-5 z-[100] flex max-w-sm items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold shadow-2xl"><CheckCircle2 className="size-5 text-emerald-600" />{toast}</div>}
    </div>
  );
}


function GalleryFilters({ category, setCategory, photos, onRefresh, isFetching }: { category: AlbumCategory | "all"; setCategory: (value: AlbumCategory | "all") => void; photos: AlbumPhoto[]; onRefresh: () => void; isFetching: boolean }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="thin-scrollbar flex gap-2 overflow-x-auto" role="tablist" aria-label="Lọc ảnh theo danh mục">
        {filters.map((filter) => (
          <button key={filter.value} type="button" aria-selected={category === filter.value} onClick={() => setCategory(filter.value)} className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${category === filter.value ? "bg-wine text-white" : "text-stone-500 hover:bg-wine/5 hover:text-wine"}`}>
            {filter.label} <span className="text-[10px] opacity-70">{filter.value === "all" ? photos.length : photos.filter((photo) => photo.category === filter.value).length}</span>
          </button>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={onRefresh} disabled={isFetching}><RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />Làm mới</Button>
    </section>
  );
}

function PhotoCard({ photo, ratio, onOpen }: { photo: AlbumPhoto; ratio: string; onOpen: () => void }) {
  return (
    <article className="mb-5 break-inside-avoid overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-gold/45 hover:shadow-lg">
      <button type="button" onClick={onOpen} className="group block w-full text-left" aria-label={`Xem ảnh ${photo.title}`}>
        <div className={`relative overflow-hidden bg-stone-100 ${ratio}`}>
          <img src={photo.imageUrl} alt={photo.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-80" />
          <div className="absolute left-3 top-3 flex gap-2"><Badge className="border-0 bg-[#fffaf0]/95 text-wine">{labels[photo.category]}</Badge>{photo.visibility === "family" && <Badge className="border-0 bg-[#211719]/80 text-white"><LockKeyhole className="mr-1 size-3" />Nội bộ</Badge>}</div>
          <span className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-full bg-white/90 text-wine opacity-0 shadow transition group-hover:opacity-100"><Eye className="size-4" /></span>
        </div>
        <div className="p-4"><h2 className="font-display text-lg font-semibold leading-6 text-stone-900">{photo.title}</h2><p className="mt-2 line-clamp-2 text-xs leading-5 text-stone-500">{photo.description}</p><p className="mt-3 flex items-center gap-1.5 text-[11px] text-stone-400"><CalendarDays className="size-3.5" />{formatDate(photo.eventDate)}</p></div>
      </button>
    </article>
  );
}
function GallerySkeleton() {
  return <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="overflow-hidden rounded-2xl border border-stone-200 bg-white"><div className={`${ratios[item % ratios.length]} animate-pulse bg-stone-200/70`} /><div className="space-y-3 p-4"><div className="h-4 w-3/4 animate-pulse rounded bg-stone-200" /><div className="h-3 w-full animate-pulse rounded bg-stone-100" /></div></div>)}</div>;
}

function GalleryEmpty() {
  return <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center"><ImageIcon className="mx-auto size-12 text-stone-300" /><h2 className="mt-4 font-display text-2xl text-stone-800">Chưa có ảnh trong danh mục</h2><p className="mt-2 text-sm text-stone-500">Hãy chọn danh mục khác hoặc thêm kỷ niệm mới cho dòng họ.</p></div>;
}

function GalleryError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center"><ImageIcon className="mx-auto size-10 text-red-300" /><p className="mt-3 text-sm font-semibold text-red-700">{message}</p><Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>Thử lại</Button></div>;
}
