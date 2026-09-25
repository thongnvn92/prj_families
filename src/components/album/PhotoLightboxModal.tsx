import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, LockKeyhole, UserRound, ZoomIn, ZoomOut } from "lucide-react";
import type { AlbumPhoto } from "../../types/album";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";

interface PhotoLightboxModalProps {
  photo: AlbumPhoto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

const formatDate = (value: string) => new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T00:00:00`));

export function PhotoLightboxModal({ photo, open, onOpenChange, onPrevious, onNext }: PhotoLightboxModalProps) {
  const [zoom, setZoom] = useState(1);
  useEffect(() => { setZoom(1); }, [photo?.id]);
  useEffect(() => {
    if (!open || (!onPrevious && !onNext)) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "ArrowLeft") onPrevious?.(); if (event.key === "ArrowRight") onNext?.(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onPrevious, onNext]);
  if (!photo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] w-[calc(100%-1rem)] max-w-6xl overflow-hidden border-white/10 bg-[#211719]/[0.98] p-0 text-white shadow-2xl [&>button]:text-white [&>button:hover]:bg-white/10">
        <DialogHeader className="border-b border-white/10 px-5 py-4 pr-12 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0"><DialogTitle className="pr-4 text-2xl text-white sm:text-3xl">{photo.title}</DialogTitle><DialogDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-stone-300"><span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />{formatDate(photo.eventDate)}</span><span className="inline-flex items-center gap-1.5"><UserRound className="size-3.5" />{photo.uploadedBy}</span></DialogDescription></div>
            <div className="flex items-center gap-1 self-start rounded-xl border border-white/10 bg-white/5 p-1">
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => setZoom((value) => Math.max(1, Number((value - 0.25).toFixed(2))))} disabled={zoom <= 1} className="text-stone-200 hover:bg-white/10 hover:text-white" aria-label="Thu nhỏ ảnh"><ZoomOut className="size-4" /></Button>
              <span className="min-w-12 text-center text-xs font-semibold text-stone-300">{Math.round(zoom * 100)}%</span>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => setZoom((value) => Math.min(2.5, Number((value + 0.25).toFixed(2))))} disabled={zoom >= 2.5} className="text-stone-200 hover:bg-white/10 hover:text-white" aria-label="Phóng to ảnh"><ZoomIn className="size-4" /></Button>
            </div>
          </div>
        </DialogHeader>
        <div className="relative flex min-h-[320px] items-center justify-center overflow-auto bg-black/25 px-3 py-4 sm:min-h-[520px] sm:px-16 sm:py-6">
          {onPrevious && <Button type="button" variant="ghost" size="icon" onClick={onPrevious} className="absolute left-2 z-10 rounded-full bg-black/35 text-white hover:bg-black/55 hover:text-white sm:left-4" aria-label="Ảnh trước"><ChevronLeft className="size-6" /></Button>}
          <img src={photo.imageUrl} alt={photo.title} className="max-h-[64vh] max-w-full rounded-xl object-contain shadow-2xl transition-transform duration-200" style={{ transform: `scale(${zoom})` }} />
          {onNext && <Button type="button" variant="ghost" size="icon" onClick={onNext} className="absolute right-2 z-10 rounded-full bg-black/35 text-white hover:bg-black/55 hover:text-white sm:right-4" aria-label="Ảnh tiếp theo"><ChevronRight className="size-6" /></Button>}
        </div>
        <div className="border-t border-white/10 px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl"><p className="text-sm leading-7 text-stone-200">{photo.description}</p>{photo.tags.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{photo.tags.map((tag) => <Badge key={tag} className="border-white/10 bg-white/10 text-[#f0d794] hover:bg-white/10">{tag}</Badge>)}</div>}</div>
            <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-stone-300">{photo.visibility === "public" ? <><Badge className="bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/20">Công khai</Badge>Khách có thể xem</> : <><LockKeyhole className="size-3.5 text-[#e4c77e]" />Chỉ thành viên nội bộ</>}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
