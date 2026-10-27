import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ImagePlus, LoaderCircle, Send, X } from "lucide-react";
import { Button } from "../ui/button";

// Backend giới hạn ảnh 10MB (mimes jpeg/jpg/png/webp) và tự nén sang webp.
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ChatComposerProps { onSend: (text: string, image: File | null) => Promise<void>; onTyping?: (isTyping: boolean) => void; disabled?: boolean; /** Admin có thể thu quyền đính kèm ảnh cho từng vai trò trong family_settings. */ canAttachImage?: boolean; }

function formatBytes(bytes: number) { return `${(bytes / 1024 / 1024).toFixed(2)} MB`; }

export function ChatComposer({ onSend, onTyping, disabled = false, canAttachImage = true }: ChatComposerProps) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { const node = textareaRef.current; if (!node) return; node.style.height = "auto"; node.style.height = `${Math.min(node.scrollHeight, 140)}px`; }, [text]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
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
  const clearImage = () => { setImage(null); setPreviewUrl(""); };
  // Báo nhóm biết người dùng đang gõ; hook realtime tự giới hạn tần suất gửi.
  const handleTextChange = (next: string) => { setText(next); onTyping?.(next.trim().length > 0); };
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if ((!text.trim() && !image) || sending) return; setSending(true); setError(""); try { await onSend(text, image); setText(""); onTyping?.(false); clearImage(); } catch (sendError) { setError(sendError instanceof Error ? sendError.message : "Không thể gửi tin nhắn."); } finally { setSending(false); } };
  return <form onSubmit={submit} className="border-t border-stone-200 bg-white p-3 sm:p-4"><div className="flex items-end gap-2 rounded-2xl border border-stone-200 bg-[#fcfbf9] p-2 focus-within:border-wine/35 focus-within:ring-4 focus-within:ring-wine/5"><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={chooseImage} />{canAttachImage && <Button type="button" variant="ghost" size="icon" onClick={() => fileRef.current?.click()} disabled={disabled || sending} aria-label="Đính kèm ảnh"><ImagePlus className="size-5" /></Button>}<textarea ref={textareaRef} value={text} onChange={(event) => handleTextChange(event.target.value)} rows={1} disabled={disabled || sending} placeholder="Nhập lời nhắn cho dòng họ..." className="max-h-36 min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-6 outline-none placeholder:text-stone-400 disabled:opacity-50" aria-label="Nội dung tin nhắn" /><Button type="submit" size="icon" disabled={disabled || sending || (!text.trim() && !image)} aria-label="Gửi tin nhắn">{sending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}</Button></div>{previewUrl && <div className="relative mt-2 inline-block"><img src={previewUrl} alt="Xem trước ảnh đính kèm" className="h-20 w-24 rounded-xl object-cover" /><button type="button" onClick={clearImage} className="absolute -right-2 -top-2 rounded-full bg-stone-800 p-1 text-white" aria-label="Xóa ảnh đính kèm"><X className="size-3" /></button><span className="mt-1 block text-[10px] text-stone-400">Dung lượng: {formatBytes(image?.size ?? 0)}</span></div>}{error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}</form>;
}
