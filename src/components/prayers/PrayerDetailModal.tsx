import { useEffect, useState } from "react";
import { CheckCircle2, Copy, Minus, Plus, Printer } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Badge } from "../ui/badge";
import type { Prayer } from "../../types/prayer";
import { categoryLabel } from "./PrayerCard";

interface PrayerDetailModalProps { prayer: Prayer | null; open: boolean; onOpenChange: (open: boolean) => void; onNotify: (message: string) => void; }

export function PrayerDetailModal({ prayer, open, onOpenChange, onNotify }: PrayerDetailModalProps) {
  const [fontSize, setFontSize] = useState(20);
  useEffect(() => { if (prayer) setFontSize(20); }, [prayer?.id]);
  if (!prayer) return null;
  const copy = async () => { try { await navigator.clipboard.writeText(prayer.content); onNotify("Đã sao chép nội dung bài văn vào clipboard."); } catch { onNotify("Không thể sao chép nội dung. Ông/bà có thể chọn và sao chép thủ công."); } };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="flex max-h-[92vh] max-w-4xl flex-col p-0"><DialogHeader className="border-b bg-[#fffaf0] px-5 py-5 pr-12 sm:px-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><Badge variant="gold">{categoryLabel(prayer.category)}</Badge><DialogTitle className="mt-3 text-2xl sm:text-3xl">{prayer.title}</DialogTitle><DialogDescription className="mt-1">Tác giả: {prayer.authorName} · {new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(prayer.createdAt))}</DialogDescription></div><div className="flex items-center gap-1 rounded-xl border border-stone-200 bg-white p-1"><Button variant="ghost" size="icon-sm" onClick={() => setFontSize((value) => Math.max(16, value - 2))} aria-label="Giảm cỡ chữ"><Minus className="size-4" /></Button><span className="min-w-8 text-center text-xs font-semibold text-stone-500">A{fontSize - 18}</span><Button variant="ghost" size="icon-sm" onClick={() => setFontSize((value) => Math.min(32, value + 2))} aria-label="Tăng cỡ chữ"><Plus className="size-4" /></Button></div></div><div className="mt-5 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => void copy()}><Copy className="size-3.5" />Sao chép nội dung</Button><Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="size-3.5" />In / Xuất PDF</Button></div></DialogHeader><div id="prayer-print-area" className="thin-scrollbar min-h-0 flex-1 overflow-y-auto bg-[#fffdf8] px-5 py-6 sm:px-10 sm:py-8"><div className="mx-auto max-w-2xl whitespace-pre-wrap font-display leading-[1.9] text-stone-800" style={{ fontSize: `${fontSize}px` }}>{prayer.content}</div><div className="mx-auto mt-10 flex max-w-2xl items-center gap-2 border-t border-gold/25 pt-4 text-xs text-stone-400"><CheckCircle2 className="size-4 text-gold" />Kính mong bài văn được đọc với tâm hướng và sự trang trọng.</div></div><DialogFooter className="border-t bg-white px-5 py-3 sm:px-7"><Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button></DialogFooter></DialogContent></Dialog>;
}
