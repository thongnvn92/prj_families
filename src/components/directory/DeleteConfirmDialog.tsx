import * as React from "react";
import { LoaderCircle, ShieldAlert, Trash2, UserRound } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import type { FamilyMember } from "../../lib/mock-data";

interface DeleteConfirmDialogProps {
  member: FamilyMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  hasChildren: boolean;
}

export function DeleteConfirmDialog({ member, open, onOpenChange, onConfirm, hasChildren }: DeleteConfirmDialogProps) {
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState("");

  if (!member) return null;

  const handleDelete = async () => {
    if (hasChildren) return;
    setDeleting(true);
    setError("");
    try {
      await onConfirm();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Không thể xóa thành viên.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!deleting) { setError(""); onOpenChange(nextOpen); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <span className="flex size-11 items-center justify-center rounded-2xl bg-red-50 text-red-600"><Trash2 className="size-5" /></span>
          <DialogTitle>Xóa thành viên khỏi gia phả?</DialogTitle>
          <DialogDescription>Thao tác này chỉ tác động đến dữ liệu prototype hiện tại và không thể hoàn tác.</DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <span className="flex size-10 items-center justify-center rounded-full bg-wine/10 text-wine"><UserRound className="size-5" /></span>
          <div className="min-w-0"><p className="font-semibold text-stone-800">{member.name}</p><p className="text-xs text-stone-500">Đời thứ {member.generation} · {member.role}</p></div>
        </div>
        {hasChildren ? <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><ShieldAlert className="mt-0.5 size-5 shrink-0" /><div><p className="font-semibold">Không thể xóa thành viên đã có nhánh con.</p><p className="mt-1 text-xs leading-5">Vui lòng cập nhật lại mối quan hệ của các con trước.</p></div></div> : <p className="text-sm leading-6 text-stone-600">Sau khi xóa, thông tin này sẽ không còn xuất hiện trong danh sách và cây gia phả.</p>}
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>Giữ lại</Button>
          <Button variant="destructive" onClick={() => void handleDelete()} disabled={deleting || hasChildren}>
            {deleting ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}{deleting ? "Đang xóa..." : "Xóa thành viên"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

