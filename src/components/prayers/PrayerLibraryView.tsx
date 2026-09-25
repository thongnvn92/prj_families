import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, LoaderCircle, Plus, Search, Sparkles, X } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { useAuth } from "../../context/AuthContext";
import { AccessDenied } from "../common/AccessDenied";
import { useCreatePrayerMutation, useGetPrayersQuery } from "../../app/prayerApi";
import { getApiErrorMessage } from "../../app/apiSlice";
import type { CreatePrayerInput, Prayer, PrayerCategory } from "../../types/prayer";
import { PrayerCard } from "./PrayerCard";
import { PrayerDetailModal } from "./PrayerDetailModal";
import { PrayerFormDialog } from "./PrayerFormDialog";

const filters: { value: PrayerCategory | "all"; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "tet", label: "Ngày Tết & Lễ Lớn" },
  { value: "gio_to", label: "Giỗ Tổ / Giỗ Họ" },
  { value: "gio_thuong", label: "Giỗ Thường (Tạ Mộ)" },
  { value: "nhap_trach", label: "Lễ Nhập Trạch" },
  { value: "khac", label: "Khác" },
];

export function PrayerLibraryView() {
  const { currentRole, permissions } = useAuth();
  const [category, setCategory] = useState<PrayerCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toast, setToast] = useState("");
  const { data: visiblePrayers = [], isLoading: loading, isFetching, isError, error, refetch } = useGetPrayersQuery(
    { role: currentRole, category, query },
    { skip: !permissions.canUsePrivateSections },
  );
  const [createPrayerMutation] = useCreatePrayerMutation();

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3600);
  };

  useEffect(() => { if (!permissions.canCreatePrayer) setFormOpen(false); }, [permissions.canCreatePrayer]);
  if (!permissions.canUsePrivateSections) return <AccessDenied title="Thư viện Văn Cúng dành cho thành viên" description="Bạn cần tài khoản Thành viên dòng họ để xem thư viện văn cúng và nghi lễ nội bộ." />;
  const create = async (data: CreatePrayerInput) => {
    if (!permissions.canCreatePrayer) throw new Error("Bạn không có quyền soạn bài văn mới.");
    const created = await createPrayerMutation({ role: currentRole, data }).unwrap();
    setFormOpen(false);
    setCategory("all");
    setQuery("");
    notify(`Đã lưu “${created.title}” vào thư viện gia tộc.`);
  };

  return (
    <div className="space-y-6">
      <section className="paper-grid relative overflow-hidden rounded-3xl border border-wine/15 bg-[#fffaf0] p-6 shadow-sm sm:p-8">
        <div className="absolute -right-16 -top-20 size-64 rounded-full border border-gold/20" />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <Badge variant="gold" className="mb-3"><Sparkles className="mr-1 size-3" />Thư viện nghi lễ</Badge>
            <h1 className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">Văn Cúng & Nghi Lễ</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-stone-600">Nơi lưu giữ những bài khấn tổ tiên, nghi thức trang nghiêm và nét đẹp văn hóa của dòng họ Nguyễn.</p>
          </div>
          {permissions.canCreatePrayer && <Button onClick={() => setFormOpen(true)}><Plus className="size-4" />Soạn Bài Văn Cúng Mới</Button>}
        </div>
      </section>
      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 lg:max-w-lg">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-10"
              placeholder="Tìm “Mùng 1”, “Tết Nguyên Đán”, “Giỗ cụ”..."
              aria-label="Tìm kiếm bài văn khấn"
            />
            {query && <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700" aria-label="Xóa tìm kiếm"><X className="size-4" /></button>}
          </div>
          <Tabs value={category} onValueChange={(value) => setCategory(value as PrayerCategory | "all")}>
            <TabsList className="h-auto w-full flex-wrap justify-start bg-stone-100 p-1 lg:w-auto">
              {filters.map((filter) => <TabsTrigger key={filter.value} value={filter.value}>{filter.label}</TabsTrigger>)}
            </TabsList>
          </Tabs>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4 text-xs text-stone-500">
          <span>Tìm thấy <strong className="text-wine">{visiblePrayers.length}</strong> bài văn</span>
          <span className="hidden items-center gap-1.5 sm:flex"><BookOpen className="size-3.5 text-gold" />Đã duyệt cho gia tộc</span>
        </div>
      </section>
      {loading ? <div className="flex min-h-64 items-center justify-center"><LoaderCircle className={`size-7 animate-spin text-wine ${isFetching ? "opacity-60" : ""}`} /></div> : isError ? <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">{getApiErrorMessage(error, "Không tải được thư viện văn cúng.")}<Button variant="outline" size="sm" className="ml-3" onClick={() => void refetch()}>Thử lại</Button></div> : visiblePrayers.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{visiblePrayers.map((prayer) => <PrayerCard key={prayer.id} prayer={prayer} onOpen={setSelectedPrayer} />)}</div> : <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center"><BookOpen className="mx-auto size-10 text-stone-300" /><h2 className="mt-4 font-display text-2xl text-stone-800">Chưa tìm thấy bài văn phù hợp</h2><p className="mt-2 text-sm text-stone-500">Ông/bà có thể thử từ khóa khác hoặc xem tất cả danh mục.</p></div>}
      <PrayerDetailModal prayer={selectedPrayer} open={Boolean(selectedPrayer)} onOpenChange={(open) => !open && setSelectedPrayer(null)} onNotify={notify} />
      <PrayerFormDialog open={formOpen} onOpenChange={setFormOpen} onCreate={create} />
      {toast && <div role="status" className="fixed bottom-5 right-5 z-[100] flex max-w-sm items-center gap-3 rounded-2xl border border-gold/30 bg-white px-4 py-3 text-sm font-medium text-stone-800 shadow-2xl"><CheckCircle2 className="size-5 shrink-0 text-emerald-600" />{toast}</div>}
    </div>
  );
}
/* VIEW_CONTENT */
