import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, MessageSquareWarning } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import type { PendingEdit } from "../../types/pendingEdit";

interface RejectReasonDialogProps {
  edit: PendingEdit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string) => Promise<void>;
}

export function RejectReasonDialog({ edit, open, onOpenChange, onSubmit }: RejectReasonDialogProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (!open) { setReason(""); setError(""); setSubmitting(false); } }, [open, edit?.id]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (reason.trim().length < 8) { setError("Vui lòng nhập lý do từ chối ít nhất 8 ký tự."); return; }
    setSubmitting(true); setError("");
    try { await onSubmit(reason.trim()); onOpenChange(false); } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Không thể lưu lý do từ chối."); } finally { setSubmitting(false); }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-lg"><DialogHeader><span className="flex size-11 items-center justify-center rounded-2xl bg-red-50 text-red-600"><MessageSquareWarning className="size-5" /></span><DialogTitle>Từ chối đề xuất</DialogTitle><DialogDescription>{edit ? `Đề xuất của ${edit.requesterName} về ${edit.targetMemberName}. Lý do sẽ được ghi nhận để người gửi có thể điều chỉnh.` : "Nhập lý do từ chối đề xuất."}</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><label className="block space-y-1.5"><span className="text-sm font-semibold text-stone-700">Lý do từ chối <span className="text-wine">*</span></span><textarea autoFocus value={reason} onChange={(event) => { setReason(event.target.value); setError(""); }} rows={5} placeholder="Ví dụ: Thiếu tài liệu chứng minh hoặc thông tin chưa khớp với dữ liệu hiện tại..." className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-sm leading-6 outline-none transition placeholder:text-stone-400 focus:border-wine/50 focus:ring-4 focus:ring-wine/10" /></label>{error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}<div className="rounded-xl bg-stone-50 p-3 text-xs leading-5 text-stone-500">Lý do này chỉ hiển thị trong phạm vi Ban Trưởng tộc và người gửi đề xuất.</div><DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button><Button type="submit" variant="destructive" disabled={submitting}>{submitting && <LoaderCircle className="size-4 animate-spin" />}{submitting ? "Đang lưu..." : "Xác nhận từ chối"}</Button></DialogFooter></form></DialogContent></Dialog>;
}
