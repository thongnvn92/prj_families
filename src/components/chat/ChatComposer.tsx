import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ImagePlus, LoaderCircle, Send, X } from "lucide-react";
import { Button } from "../ui/button";
import { compressImageFile, getBase64ByteLength } from "../../lib/imageCompression";

interface ChatComposerProps { onSend: (text: string, imageBase64?: string) => Promise<void>; disabled?: boolean; }

function formatBytes(bytes: number) { return `${(bytes / 1024 / 1024).toFixed(2)} MB`; }

export function ChatComposer({ onSend, disabled = false }: ChatComposerProps) {
  const [text, setText] = useState("");
  const [imageBase64, setImageBase64] = useState<string>();
  const [processingImage, setProcessingImage] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { const node = textareaRef.current; if (!node) return; node.style.height = "auto"; node.style.height = `${Math.min(node.scrollHeight, 140)}px`; }, [text]);
  const chooseImage = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; setProcessingImage(true); setError(""); try { setImageBase64(await compressImageFile(file)); } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : "Không thể nén ảnh."); } finally { setProcessingImage(false); event.target.value = ""; } };
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if ((!text.trim() && !imageBase64) || sending || processingImage) return; setSending(true); setError(""); try { await onSend(text, imageBase64); setText(""); setImageBase64(undefined); } catch (sendError) { setError(sendError instanceof Error ? sendError.message : "Không thể gửi tin nhắn."); } finally { setSending(false); } };
  const busy = sending || processingImage;
  return <form onSubmit={submit} className="border-t border-stone-200 bg-white p-3 sm:p-4"><div className="flex items-end gap-2 rounded-2xl border border-stone-200 bg-[#fcfbf9] p-2 focus-within:border-wine/35 focus-within:ring-4 focus-within:ring-wine/5"><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => void chooseImage(event)} /><Button type="button" variant="ghost" size="icon" onClick={() => fileRef.current?.click()} disabled={disabled || busy} aria-label="Đính kèm ảnh"><ImagePlus className="size-5" /></Button><textarea ref={textareaRef} value={text} onChange={(event) => setText(event.target.value)} rows={1} disabled={disabled || busy} placeholder="Nhập lời nhắn cho dòng họ..." className="max-h-36 min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-6 outline-none placeholder:text-stone-400 disabled:opacity-50" aria-label="Nội dung tin nhắn" /><Button type="submit" size="icon" disabled={disabled || busy || (!text.trim() && !imageBase64)} aria-label="Gửi tin nhắn">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}</Button></div>{imageBase64 && <div className="relative mt-2 inline-block"><img src={imageBase64} alt="Xem trước ảnh đính kèm" className="h-20 w-24 rounded-xl object-cover" /><button type="button" onClick={() => setImageBase64(undefined)} className="absolute -right-2 -top-2 rounded-full bg-stone-800 p-1 text-white" aria-label="Xóa ảnh đính kèm"><X className="size-3" /></button><span className="mt-1 block text-[10px] text-stone-400">Đã nén: {formatBytes(getBase64ByteLength(imageBase64))}</span></div>}{error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}</form>;
}
