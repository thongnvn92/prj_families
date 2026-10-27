import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { ImagePlus, LoaderCircle, LockKeyhole, UploadCloud, X } from "lucide-react";
import { AccessDenied } from "../common/AccessDenied";
import { useAuth } from "../../context/AuthContext";
import { useFamilySettings } from "../../lib/useFamilySettings";
import type { AlbumCategory, AlbumVisibility, UploadAlbumPhotoInput } from "../../types/album";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface Props { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: UploadAlbumPhotoInput) => Promise<void>; }
const today = () => { const date = new Date(); return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10); };

// Backend giới hạn 10MB, chỉ nhận jpeg/png/webp và yêu cầu kích thước tối thiểu 100x100.
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function PhotoUploadDialog({ open, onOpenChange, onSubmit }: Props) {
  // Quyền tải ảnh do Admin cấu hình trong family_settings (server vẫn là chốt chặn cuối).
  const { canUploadImages } = useFamilySettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(today());
  const [category, setCategory] = useState<AlbumCategory>("general");
  const [visibility, setVisibility] = useState<AlbumVisibility>("public");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  useEffect(() => {
    if (open) return;
    setImage(null); setPreviewUrl(""); setTitle(""); setDescription(""); setEventDate(today()); setCategory("general"); setVisibility("public"); setTags(""); setSubmitting(false); setError("");
  }, [open]);

  const clearImage = () => { setImage(null); setPreviewUrl(""); };
  const chooseImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) { setError("Vui lòng chọn ảnh định dạng JPG, PNG hoặc WebP."); return; }
    if (file.size > MAX_IMAGE_BYTES) { setError("Ảnh vượt quá 10MB. Vui lòng chọn ảnh nhỏ hơn."); return; }
    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!image || !title.trim() || !description.trim() || !eventDate) { setError("Vui lòng chọn ảnh và nhập đầy đủ thông tin."); return; }
    setSubmitting(true); setError("");
    try {
      await onSubmit({ title, description, image, eventDate, category, visibility, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean) });
      onOpenChange(false);
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Không thể tải ảnh lên album."); }
    finally { setSubmitting(false); }
  };

  if (!canUploadImages) return <AccessDenied title="Không có quyền tải ảnh" description="Ban quản trị dòng họ chưa cho phép vai trò của bạn đưa hình ảnh lên hệ thống." />;

  return <Dialog open={open} onOpenChange={(value) => { if (!submitting) onOpenChange(value); }}><DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-0"><DialogHeader className="border-b bg-[#fffaf0] px-5 py-5 pr-12 sm:px-7"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-wine/8 text-wine"><ImagePlus className="size-5" /></span><div><DialogTitle>Tải Ảnh Gia Đình Mới</DialogTitle><DialogDescription className="mt-1">Lưu kỷ niệm bằng ảnh đã nén an toàn dưới 10MB.</DialogDescription></div></div></DialogHeader><UploadForm state={{ title, setTitle, description, setDescription, eventDate, setEventDate, category, setCategory, visibility, setVisibility, tags, setTags, image, previewUrl, error, setError, submitting, setSubmitting }} fileRef={fileRef} onChooseImage={chooseImage} onClearImage={clearImage} onSubmit={submit} onCancel={() => onOpenChange(false)} open={open} /></DialogContent></Dialog>;
}

interface FormState { title: string; setTitle: (value: string) => void; description: string; setDescription: (value: string) => void; eventDate: string; setEventDate: (value: string) => void; category: AlbumCategory; setCategory: (value: AlbumCategory) => void; visibility: AlbumVisibility; setVisibility: (value: AlbumVisibility) => void; tags: string; setTags: (value: string) => void; image: File | null; previewUrl: string; error: string; setError: (value: string) => void; submitting: boolean; setSubmitting: (value: boolean) => void; }


function UploadForm({ state, fileRef, onChooseImage, onClearImage, onSubmit, onCancel, open }: { state: FormState; fileRef: React.RefObject<HTMLInputElement | null>; onChooseImage: (event: ChangeEvent<HTMLInputElement>) => void; onClearImage: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void; open: boolean }) {
  const s = state;
  return <form onSubmit={onSubmit} className="space-y-5 px-5 py-5 sm:px-7">
    <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
      <div><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onChooseImage} /><button type="button" onClick={() => fileRef.current?.click()} disabled={s.submitting} className="flex aspect-[4/5] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gold/40 bg-gold-soft/40 text-center transition hover:border-wine/40 hover:bg-gold-soft/70 disabled:opacity-60">{s.previewUrl ? <img src={s.previewUrl} alt="Xem trước ảnh" className="h-full w-full object-cover" /> : <><span className="flex size-12 items-center justify-center rounded-2xl bg-white text-gold shadow-sm"><UploadCloud className="size-6" /></span><span className="mt-3 text-sm font-semibold text-stone-700">Chọn ảnh từ máy</span><span className="mt-1 text-[11px] text-stone-400">JPG, PNG, WebP · tối đa 10MB</span></>}</button>{s.image && <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500"><span>{(s.image.size / 1024 / 1024).toFixed(2)}MB</span><button type="button" onClick={onClearImage} className="flex items-center gap-1 font-semibold text-wine"><X className="size-3" />Xóa</button></div>}</div>
      <div className="space-y-4"><Field label="Tên bức ảnh *"><Input value={s.title} onChange={(event) => s.setTitle(event.target.value)} placeholder="Ví dụ: Họp mặt dòng họ mùa xuân" /></Field><Field label="Ngày chụp *"><Input type="date" value={s.eventDate} onChange={(event) => s.setEventDate(event.target.value)} disabled={!open} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Danh mục"><Select value={s.category} onValueChange={(value) => s.setCategory(value as AlbumCategory)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="general">Gia đình chung</SelectItem><SelectItem value="anniversary">Lễ Giỗ</SelectItem><SelectItem value="reunion">Họp Mặt</SelectItem><SelectItem value="tet">Ngày Tết</SelectItem></SelectContent></Select></Field><Field label="Quyền xem"><Select value={s.visibility} onValueChange={(value) => s.setVisibility(value as AlbumVisibility)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="public">Công khai</SelectItem><SelectItem value="family">Thành viên dòng họ</SelectItem></SelectContent></Select></Field></div><Field label="Thẻ"><Input value={s.tags} onChange={(event) => s.setTags(event.target.value)} placeholder="Tết Nguyên Đán, Chi 3, Bắc Ninh" /></Field></div>
    </div>
    <Field label="Mô tả kỷ niệm *"><textarea value={s.description} onChange={(event) => s.setDescription(event.target.value)} rows={4} placeholder="Kể lại khoảnh khắc, địa điểm và những người có mặt..." className="w-full resize-y rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-sm leading-6 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-wine/50 focus:ring-4 focus:ring-wine/10" /></Field>
    <div className="flex items-start gap-2 rounded-xl bg-gold-soft/60 px-3.5 py-3 text-xs leading-5 text-stone-600"><LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-gold" />Ảnh “Công khai” có thể xuất hiện với khách; ảnh “Thành viên” chỉ tải cho tài khoản nội bộ.</div>
    {s.submitting && <p className="flex items-center gap-2 text-xs font-medium text-wine"><LoaderCircle className="size-4 animate-spin" />Đang tải ảnh lên album.</p>}{s.error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{s.error}</p>}
    <DialogFooter className="border-t pt-5"><Button type="button" variant="outline" onClick={onCancel} disabled={s.submitting}>Hủy</Button><Button type="submit" disabled={s.submitting}>{s.submitting && <LoaderCircle className="size-4 animate-spin" />}{s.submitting ? "Đang lưu..." : "Tải lên Album"}</Button></DialogFooter>
  </form>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block space-y-1.5"><span className="text-xs font-semibold text-stone-600">{label}</span>{children}</label>; }
