import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, Eye, FileCheck2, FileX2, LoaderCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { useApproveEditMutation, useGetPendingEditsQuery, useRejectEditMutation } from "../../app/pendingEditApi";
import { getApiErrorMessage } from "../../app/apiSlice";
import type { PendingEdit, PendingEditStatus } from "../../types/pendingEdit";
import { cn } from "../../lib/utils";
import { ApproveEditDialog, CompareEditDialog } from "./PendingEditDialogs";
import { useAuth } from "../../context/AuthContext";
import { RejectReasonDialog } from "./RejectReasonDialog";

const typeLabels: Record<PendingEdit["editType"], string> = { add_child: "Thêm con", add_spouse: "Thêm vợ / chồng", update_info: "Cập nhật thông tin" };
const statusLabels: Record<PendingEditStatus, string> = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Đã từ chối" };

interface Props { onMembersChanged: () => Promise<void> | void }

export function PendingEditsManager({ onMembersChanged }: Props) {
  const { currentRole, permissions, isInitializing } = useAuth();
  const [tab, setTab] = useState("all");
  const [compareEdit, setCompareEdit] = useState<PendingEdit | null>(null);
  const [approveTarget, setApproveTarget] = useState<PendingEdit | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingEdit | null>(null);
  const [toast, setToast] = useState("");
  const { data: edits = [], isLoading: loading, isFetching, isError, error, refetch } = useGetPendingEditsQuery({ authKey: currentRole }, { skip: !permissions.canManagePendingEdits || isInitializing });
  const [approveEditMutation] = useApproveEditMutation();
  const [rejectEditMutation] = useRejectEditMutation();
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 3500); };
  const filteredEdits = useMemo(() => tab === "all" ? edits : tab === "pending" ? edits.filter((edit) => edit.status === "pending") : edits.filter((edit) => edit.status !== "pending"), [edits, tab]);
  const counts = useMemo(() => ({ pending: edits.filter((edit) => edit.status === "pending").length, approved: edits.filter((edit) => edit.status === "approved").length, rejected: edits.filter((edit) => edit.status === "rejected").length }), [edits]);
  const handleApprove = async () => { if (!approveTarget) return; await approveEditMutation({ id: approveTarget.id }).unwrap(); setApproveTarget(null); await onMembersChanged(); showToast("Đã cập nhật Cây gia phả và thông báo người gửi."); };
  const handleReject = async (reason: string) => { if (!rejectTarget) return; await rejectEditMutation({ id: rejectTarget.id, reason }).unwrap(); setRejectTarget(null); showToast("Đã lưu lý do từ chối và cập nhật trạng thái."); };
  if (!permissions.canManagePendingEdits) return <Card className="mx-auto mt-10 max-w-2xl border-0"><CardContent className="p-10 text-center"><ShieldCheck className="mx-auto size-12 text-red-500" /><h2 className="mt-4 font-display text-2xl font-semibold text-stone-900">Không có quyền truy cập</h2><p className="mt-2 text-sm text-stone-500">Chỉ Admin hoặc Mod được xem và duyệt đề xuất cập nhật.</p></CardContent></Card>;

  return <div className="mx-auto max-w-7xl space-y-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-deep">Ban Trưởng tộc · Phân quyền</p><h2 className="mt-2 font-display text-3xl font-semibold text-stone-900 sm:text-4xl">Quản lý đề xuất</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">Kiểm tra và duyệt các thay đổi do thành viên gửi trước khi cập nhật vào Cây gia phả.</p></div><Button variant="outline" onClick={() => void refetch()}><RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />Tải lại</Button></div>
    <div className="grid gap-4 sm:grid-cols-3"><SummaryCard label="Chờ duyệt" value={counts.pending} note="Cần Admin / Mod xem xét" tone="pending" onClick={() => setTab("pending")} /><SummaryCard label="Đã duyệt" value={counts.approved} note="Đã cập nhật vào cây" tone="approved" onClick={() => setTab("processed")} /><SummaryCard label="Đã từ chối" value={counts.rejected} note="Đã lưu lý do" tone="rejected" onClick={() => setTab("processed")} /></div>
    <Card className="overflow-hidden border-0 shadow-[0_12px_40px_rgba(28,25,23,0.06)]"><CardHeader className="gap-4 border-b bg-white px-5 py-4 sm:px-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-display text-lg font-semibold text-stone-900">Danh sách đề xuất cập nhật</p><p className="mt-1 text-xs text-stone-400">{filteredEdits.length} đề xuất trong danh sách</p></div><Tabs value={tab} onValueChange={setTab}><TabsList><TabsTrigger value="all">Tất cả</TabsTrigger><TabsTrigger value="pending">Chờ duyệt</TabsTrigger><TabsTrigger value="processed">Đã xử lý</TabsTrigger></TabsList></Tabs></div></CardHeader><CardContent className="p-0"><EditTable edits={filteredEdits} loading={loading} error={isError ? getApiErrorMessage(error, "Không tải được danh sách đề xuất.") : ""} onCompare={setCompareEdit} onApprove={setApproveTarget} onReject={setRejectTarget} /></CardContent></Card>
    <CompareEditDialog edit={compareEdit} open={Boolean(compareEdit)} onOpenChange={(open) => !open && setCompareEdit(null)} /><ApproveEditDialog edit={approveTarget} open={Boolean(approveTarget)} onOpenChange={(open) => !open && setApproveTarget(null)} onConfirm={handleApprove} /><RejectReasonDialog edit={rejectTarget} open={Boolean(rejectTarget)} onOpenChange={(open) => !open && setRejectTarget(null)} onSubmit={handleReject} />{toast && <div role="status" className="fixed bottom-5 right-5 z-[70] flex max-w-sm items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" /><p className="text-sm font-semibold leading-5 text-stone-700">{toast}</p></div>}</div>;

}

function SummaryCard({ label, value, note, tone, onClick }: { label: string; value: number; note: string; tone: "pending" | "approved" | "rejected"; onClick: () => void }) { const style = { pending: "bg-gold-soft text-gold-deep", approved: "bg-emerald-50 text-emerald-700", rejected: "bg-red-50 text-red-700" }[tone]; const Icon = tone === "pending" ? Clock3 : tone === "approved" ? FileCheck2 : FileX2; return <button onClick={onClick} className="group flex items-center gap-3.5 rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", style)}><Icon className="size-5" /></span><span><span className="block text-xl font-bold text-stone-900">{value} <span className="text-sm font-semibold text-stone-500">{label}</span></span><span className="mt-0.5 block text-[11px] text-stone-400">{note}</span></span></button>; }

function EditTable({ edits, loading, error, onCompare, onApprove, onReject }: { edits: PendingEdit[]; loading: boolean; error: string; onCompare: (edit: PendingEdit) => void; onApprove: (edit: PendingEdit) => void; onReject: (edit: PendingEdit) => void }) { if (loading) return <div className="flex min-h-72 items-center justify-center"><LoaderCircle className="size-7 animate-spin text-wine" /></div>; if (error) return <div className="p-8 text-center text-sm text-stone-500">{error}</div>; if (!edits.length) return <div className="p-12 text-center"><ShieldCheck className="mx-auto size-10 text-stone-300" /><p className="mt-3 font-semibold text-stone-700">Không có đề xuất trong nhóm này</p><p className="mt-1 text-sm text-stone-400">Các đề xuất mới sẽ xuất hiện tại đây.</p></div>; return <Table><TableHeader><TableRow><TableHead>Người gửi</TableHead><TableHead>Loại đề xuất</TableHead><TableHead>Thành viên tác động</TableHead><TableHead>Ngày gửi</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader><TableBody>{edits.map((edit) => <TableRow key={edit.id}><TableCell><div className="flex items-center gap-3"><Avatar className="size-9"><AvatarFallback className="bg-wine/8 text-[10px] text-wine">{initials(edit.requesterName)}</AvatarFallback></Avatar><div><p className="whitespace-nowrap text-sm font-semibold text-stone-800">{edit.requesterName}</p><p className="mt-0.5 text-[11px] text-stone-400">{edit.requesterRole} · {edit.id}</p></div></div></TableCell><TableCell><span className="whitespace-nowrap text-xs font-medium text-stone-600">{typeLabels[edit.editType]}</span></TableCell><TableCell><p className="whitespace-nowrap text-sm font-medium text-stone-700">{edit.targetMemberName}</p><p className="mt-0.5 text-[11px] text-stone-400">{edit.targetMemberId}</p></TableCell><TableCell><span className="whitespace-nowrap text-xs text-stone-500">{formatDate(edit.createdAt)}</span></TableCell><TableCell><StatusBadge status={edit.status} /></TableCell><TableCell><div className="flex justify-end gap-1.5"><Button variant="outline" size="sm" onClick={() => onCompare(edit)}><Eye className="size-3.5" />Xem chi tiết</Button>{edit.status === "pending" && <><Button variant="gold" size="sm" onClick={() => onApprove(edit)}>Duyệt</Button><Button variant="destructive" size="sm" onClick={() => onReject(edit)}>Từ chối</Button></>}</div></TableCell></TableRow>)}</TableBody></Table>; }

function StatusBadge({ status }: { status: PendingEditStatus }) { return <Badge variant={status === "pending" ? "gold" : status === "approved" ? "success" : "outline"} className={status === "rejected" ? "border-red-200 bg-red-50 text-red-700" : undefined}>{statusLabels[status]}</Badge>; }
function initials(name: string) { return name.split(" ").filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase(); }
function formatDate(value: string) { return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value)); }
