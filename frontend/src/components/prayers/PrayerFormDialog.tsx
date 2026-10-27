import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { AccessDenied } from "../common/AccessDenied";
import { Bold, Italic, LoaderCircle, Plus, TextQuote } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { CreatePrayerInput, PrayerCategory } from "../../types/prayer";

interface PrayerFormDialogProps { open: boolean; onOpenChange: (open: boolean) => void; onCreate: (data: CreatePrayerInput) => Promise<void>; }

export function PrayerFormDialog({ open, onOpenChange, onCreate }: PrayerFormDialogProps) {
  const { permissions } = useAuth();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<PrayerCategory>("tet");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("Nguyễn Văn An");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const contentRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (!open) { setTitle(""); setCategory("tet"); setContent(""); setAuthorName("Nguyễn Văn An"); setError(""); setSubmitting(false); } }, [open]);
  if (!open) return null;
  if (!permissions.canCreatePrayer) return <AccessDenied title="Không có quyền soạn bài văn" description="Chỉ Admin mới có quyền tạo bài văn khấn mới trong thư viện gia tộc." />;
  const format = (prefix: string, suffix = prefix) => { const node = contentRef.current; if (!node) return; const start = node.selectionStart; const end = node.selectionEnd; const selected = content.slice(start, end) || "nội dung"; const next = `${content.slice(0, start)}${prefix}${selected}${suffix}${content.slice(end)}`; setContent(next); requestAnimationFrame(() => { node.focus(); node.setSelectionRange(start + prefix.length, start + prefix.length + selected.length); }); };
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!title.trim() || !content.trim() || !authorName.trim()) { setError("Vui lòng nhập tên bài, người soạn và nội dung."); return; } setSubmitting(true); setError(""); try { await onCreate({ familyId: "nguyen-chi-3", title, category, content, authorName }); onOpenChange(false); } catch (createError) { setError(createError instanceof Error ? createError.message : "Không thể lưu bài văn."); } finally { setSubmitting(false); } };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-3xl"><DialogHeader><span className="flex size-11 items-center justify-center rounded-2xl bg-wine/8 text-wine"><Plus className="size-5" /></span><DialogTitle>Soạn Bài Văn Cúng Mới</DialogTitle><DialogDescription>Lưu bài văn vào thư viện nội bộ của Gia phả Họ Nguyễn.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_190px]"><label className="space-y-1.5"><span className="text-xs font-semibold text-stone-600">Tên bài văn *</span><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Văn khấn mùng 1 Tết" /></label><label className="space-y-1.5"><span className="text-xs font-semibold text-stone-600">Danh mục</span><Select value={category} onValueChange={(value) => setCategory(value as PrayerCategory)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="tet">Tết & Lễ lớn</SelectItem><SelectItem value="gio_to">Giỗ tổ / Giỗ họ</SelectItem><SelectItem value="gio_thuong">Giỗ thường (Tạ Mộ)</SelectItem><SelectItem value="nhap_trach">Lễ Nhập Trạch</SelectItem><SelectItem value="khac">Khác</SelectItem></SelectContent></Select></label></div><label className="block space-y-1.5"><span className="text-xs font-semibold text-stone-600">Người soạn *</span><Input value={authorName} onChange={(event) => setAuthorName(event.target.value)} /></label><div><div className="mb-1.5 flex items-center justify-between"><span className="text-xs font-semibold text-stone-600">Nội dung bài khấn *</span><div className="flex gap-1"><Button type="button" variant="ghost" size="icon-sm" onClick={() => format("**")} aria-label="In đậm"><Bold className="size-3.5" /></Button><Button type="button" variant="ghost" size="icon-sm" onClick={() => format("_")} aria-label="In nghiêng"><Italic className="size-3.5" /></Button><Button type="button" variant="ghost" size="icon-sm" onClick={() => format("“", "”")} aria-label="Trích dẫn"><TextQuote className="size-3.5" /></Button></div></div><textarea ref={contentRef} value={content} onChange={(event) => setContent(event.target.value)} rows={12} placeholder="Nhập nội dung bài văn khấn theo văn phong trang trọng..." className="w-full resize-y rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-sm leading-6 outline-none transition placeholder:text-stone-400 focus:border-wine/50 focus:ring-4 focus:ring-wine/10" /></div>{error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}<DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button><Button type="submit" disabled={submitting}>{submitting && <LoaderCircle className="size-4 animate-spin" />}{submitting ? "Đang lưu..." : "Lưu bài văn"}</Button></DialogFooter></form></DialogContent></Dialog>;
}
