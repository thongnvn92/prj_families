import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Grid2X2, LayoutList, LoaderCircle, Pencil, Plus, Search, ShieldAlert, Trash2, UserRound, UsersRound, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { useAuth } from "../../context/AuthContext";
import { filterMemberForRole, isPublicMember } from "../../lib/rbacFilter";
import { useCreateMemberMutation, useDeleteMemberMutation, useGetMembersListQuery, useGetMembersQuery, useUpdateMemberMutation } from "../../app/memberApi";
import { useCreatePendingEditMutation } from "../../app/pendingEditApi";
import { getApiErrorMessage } from "../../app/apiSlice";
import type { FamilyMember, Gender } from "../../lib/mock-data";
import type { MemberFormData, MemberStatusFilter } from "../../types/memberCrud";
import { MemberFormModal } from "./MemberFormModal";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface Props { onOpenMember: (member: FamilyMember) => void; onMembersChanged: () => Promise<void> | void; }
type ViewMode = "table" | "grid";

export function MemberDirectoryView({ onOpenMember, onMembersChanged }: Props) {
  const { currentRole, permissions, user, isInitializing } = useAuth();
  const [query, setQuery] = useState("");
  const [generation, setGeneration] = useState<number | "all">("all");
  const [gender, setGender] = useState<Gender | "all">("all");
  const [status, setStatus] = useState<MemberStatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FamilyMember | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const notify = (message: string, tone: "success" | "error" = "success") => { setToast({ message, tone }); window.setTimeout(() => setToast(null), 3600); };
  const safeGender = currentRole === "guest" ? "all" as const : gender;
  const safeStatus = currentRole === "guest" ? "all" as const : status;
  const filters = useMemo(() => ({ query, generation, gender: safeGender, status: safeStatus }), [query, generation, safeGender, safeStatus]);
  const { data: items = [], isLoading: loading, isFetching, isError, refetch: refetchList } = useGetMembersListQuery({ authKey: currentRole, filters }, { skip: isInitializing });
  const { data: allMembers = [], refetch: refetchAll } = useGetMembersQuery({ authKey: currentRole }, { skip: isInitializing });
  const [createMemberMutation] = useCreateMemberMutation();
  const [updateMemberMutation] = useUpdateMemberMutation();
  const [deleteMemberMutation] = useDeleteMemberMutation();
  const [createPendingEditMutation] = useCreatePendingEditMutation();

  const visibleItems = useMemo(() => items.map((item) => filterMemberForRole(item, currentRole)), [items, currentRole]);
  const visibleAllMembers = useMemo(() => allMembers.map((item) => filterMemberForRole(item, currentRole)), [allMembers, currentRole]);
  const canAdd = permissions.canDirectlyEdit;
  const canDelete = permissions.canDeleteMembers;
  const canPropose = currentRole === "member";
  useEffect(() => {
    setFormOpen(false);
    setEditingMember(null);
    setDeleteTarget(null);
  }, [currentRole]);
  const openCreate = () => { setEditingMember(null); setFormOpen(true); };
  const openEdit = (member: FamilyMember) => { setEditingMember(member); setFormOpen(true); };
  const refresh = async () => { await Promise.all([refetchList(), refetchAll(), onMembersChanged()]); };
  const submitMember = async (data: MemberFormData) => {
    try {
      if (!canPropose && !canAdd) throw new Error("Bạn không có quyền cập nhật thành viên.");
      if (canPropose) {
        await createPendingEditMutation({ role: currentRole, data: { requesterName: user?.name ?? "Người dùng", requesterRole: "Member", targetMemberId: "new-member", targetMemberName: data.full_name.trim(), editType: "add_child", proposedData: data as unknown as Record<string, unknown> } }).unwrap();
        setFormOpen(false); notify("Đã gửi đề xuất thành viên đến Ban quản trị để xem xét."); return;
      }
      if (editingMember) await updateMemberMutation({ id: editingMember.id, data }).unwrap(); else await createMemberMutation({ data, familyId: currentRole === "admin" ? user?.family_id : undefined }).unwrap();
      setFormOpen(false); await refresh(); notify(editingMember ? "Đã cập nhật thành viên và cây gia phả." : "Đã thêm thành viên mới vào gia phả.");
    } catch (error) {
      const message = getApiErrorMessage(error, "Không thể lưu thông tin thành viên.");
      notify(message, "error");
      throw new Error(message);
    }
  };
  const confirmDelete = async () => {
    if (!deleteTarget || !canDelete) return;
    try {
      await deleteMemberMutation(deleteTarget.id).unwrap();
      setDeleteTarget(null); await refresh(); notify("Đã xóa thành viên và đồng bộ cây gia phả.");
    } catch (error) {
      const message = getApiErrorMessage(error, "Không thể xóa thành viên.");
      notify(message, "error");
      throw new Error(message);
    }
  };
  const hasChildren = (id: string) => allMembers.some((member) => member.fatherId === id || member.motherId === id);

  return <div className="space-y-6">
    <section className="paper-grid relative overflow-hidden rounded-3xl border border-wine/15 bg-[#fffaf0] p-6 shadow-sm sm:p-8"><div className="absolute -right-16 -top-20 size-64 rounded-full border border-gold/20" /><div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><Badge variant="gold" className="mb-3"><UsersRound className="mr-1 size-3" />Dữ liệu gia tộc</Badge><h1 className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">Danh sách thành viên</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">Tra cứu, cập nhật và quản lý hồ sơ các thành viên trong dòng họ Nguyễn.</p></div>{(canAdd || canPropose) && <Button onClick={openCreate}><Plus className="size-4" />{canPropose ? "Đề xuất thêm thành viên" : "Thêm thành viên mới"}</Button>}</div></section>
    {currentRole === "guest" && <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><ShieldAlert className="mt-0.5 size-5 shrink-0" /><div><p className="font-semibold">Chế độ khách đang hoạt động</p><p className="mt-1 text-xs leading-5">Số điện thoại, địa chỉ và các trường riêng tư đã được che mờ.</p></div></div>}
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex flex-col gap-4 xl:flex-row xl:items-center"><div className="relative min-w-0 flex-1 xl:max-w-md"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-10" placeholder={currentRole === "guest" ? "Tìm tên thành viên..." : "Tìm tên, biệt danh hoặc số điện thoại..."} />{query && <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-stone-400 hover:bg-stone-100" aria-label="Xóa tìm kiếm"><X className="size-4" /></button>}</div><div className="grid gap-2 sm:grid-cols-3 xl:flex"><Select value={String(generation)} onValueChange={(value) => setGeneration(value === "all" ? "all" : Number(value))}><SelectTrigger className="min-w-36"><SelectValue placeholder="Đời thứ" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả đời</SelectItem>{Array.from(new Set(allMembers.map((item) => item.generation))).sort((a, b) => a - b).map((value) => <SelectItem key={value} value={String(value)}>Đời {value}</SelectItem>)}</SelectContent></Select>      {currentRole !== "guest" && <><Select value={gender} onValueChange={(value) => setGender(value as Gender | "all")}><SelectTrigger className="min-w-32"><SelectValue placeholder="Giới tính" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả giới tính</SelectItem><SelectItem value="male">Nam</SelectItem><SelectItem value="female">Nữ</SelectItem></SelectContent></Select><Select value={status} onValueChange={(value) => setStatus(value as MemberStatusFilter)}><SelectTrigger className="min-w-36"><SelectValue placeholder="Trạng thái" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả trạng thái</SelectItem><SelectItem value="alive">Còn sống</SelectItem><SelectItem value="deceased">Đã mất</SelectItem></SelectContent></Select></>}</div><div className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 xl:ml-auto"><div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600"><LayoutList className="size-4" />Chế độ hiển thị</div><div className="flex items-center gap-2"><button type="button" onClick={() => setViewMode("table")} className={`rounded-lg p-1.5 ${viewMode === "table" ? "bg-white text-wine shadow-sm" : "text-stone-400"}`} aria-label="Dạng bảng"><LayoutList className="size-4" /></button><Switch checked={viewMode === "grid"} onCheckedChange={(checked) => setViewMode(checked ? "grid" : "table")} aria-label="Chuyển đổi bảng và thẻ" /><button type="button" onClick={() => setViewMode("grid")} className={`rounded-lg p-1.5 ${viewMode === "grid" ? "bg-white text-wine shadow-sm" : "text-stone-400"}`} aria-label="Dạng thẻ"><Grid2X2 className="size-4" /></button></div></div></div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-4 text-xs text-stone-500"><span>Hiển thị <strong className="text-wine">{visibleItems.length}</strong> / {allMembers.length} thành viên</span><span className="flex items-center gap-1.5"><ShieldAlert className="size-3.5 text-gold" />Dữ liệu được lọc theo quyền hiện tại</span></div></section>
    <div className={`grid gap-4 sm:grid-cols-2 ${currentRole === "guest" ? "xl:grid-cols-2" : "xl:grid-cols-4"}`}>
      <StatCard label="Tổng thành viên" value={visibleAllMembers.length} icon={<UsersRound className="size-4" />} tone="wine" />
      {currentRole !== "guest" && <StatCard label="Còn sống" value={visibleAllMembers.filter((item) => item.isAlive).length} icon={<CheckCircle2 className="size-4" />} tone="sage" />}
      {currentRole !== "guest" && <StatCard label="Đã mất" value={visibleAllMembers.filter((item) => !item.isAlive).length} icon={<UserRound className="size-4" />} tone="gold" />}
      <StatCard label="Số đời" value={new Set(visibleAllMembers.map((item) => item.generation)).size} icon={<LayoutList className="size-4" />} tone="slate" />
    </div>
    {loading || isInitializing ? <div className="flex min-h-64 items-center justify-center"><LoaderCircle className={`size-7 animate-spin text-wine ${isFetching ? "opacity-60" : ""}`} /></div> : isError ? <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">Không tải được danh sách thành viên.<Button variant="outline" size="sm" className="ml-3" onClick={() => void refetchList()}>Thử lại</Button></div> : !visibleItems.length ? <EmptyState onReset={() => { setQuery(""); setGeneration("all"); setGender("all"); setStatus("all"); }} /> : viewMode === "table" ? <DirectoryTable items={visibleItems} allMembers={visibleAllMembers} publicOnly={currentRole === "guest"} canEdit={canAdd} canDelete={canDelete} onView={onOpenMember} onEdit={openEdit} onDelete={setDeleteTarget} /> : <DirectoryGrid items={visibleItems} allMembers={visibleAllMembers} publicOnly={currentRole === "guest"} canEdit={canAdd} canDelete={canDelete} onView={onOpenMember} onEdit={openEdit} onDelete={setDeleteTarget} />}
    <MemberFormModal open={formOpen} onOpenChange={setFormOpen} member={editingMember} members={visibleAllMembers} onSubmit={submitMember} proposalMode={canPropose} submitLabel={canPropose ? "Gửi đề xuất" : undefined} />
    <DeleteConfirmDialog member={deleteTarget} open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }} onConfirm={confirmDelete} hasChildren={deleteTarget ? hasChildren(deleteTarget.id) : false} />
    {toast && <div role={toast.tone === "error" ? "alert" : "status"} className={`fixed bottom-5 right-5 z-[100] flex max-w-sm items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-sm font-medium shadow-2xl ${toast.tone === "error" ? "border-red-200 text-red-700" : "border-gold/30 text-stone-800"}`}>{toast.tone === "error" ? <ShieldAlert className="size-5 shrink-0 text-red-600" /> : <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />}{toast.message}</div>}
  </div>;
}
type DirectoryActionProps = { items: FamilyMember[]; allMembers: FamilyMember[]; publicOnly: boolean; canEdit: boolean; canDelete: boolean; onView: (member: FamilyMember) => void; onEdit: (member: FamilyMember) => void; onDelete: (member: FamilyMember) => void };
function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: ReactNode; tone: "wine" | "sage" | "gold" | "slate" }) { return <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"><div className={`mb-3 flex size-9 items-center justify-center rounded-xl ${tone === "wine" ? "bg-wine/8 text-wine" : tone === "sage" ? "bg-sage-soft text-sage" : tone === "gold" ? "bg-gold-soft text-gold-deep" : "bg-stone-100 text-stone-600"}`}>{icon}</div><p className="text-xs font-medium text-stone-500">{label}</p><p className="mt-1 font-display text-3xl font-semibold text-stone-900">{value}</p></div>; }
function EmptyState({ onReset }: { onReset: () => void }) { return <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center"><UsersRound className="mx-auto size-10 text-stone-300" /><h2 className="mt-4 font-display text-2xl text-stone-800">Không có thành viên phù hợp</h2><p className="mt-2 text-sm text-stone-500">Thử xóa bộ lọc hoặc tìm kiếm với từ khóa khác.</p><Button variant="outline" className="mt-5" onClick={onReset}>Xóa bộ lọc</Button></div>; }
function DirectoryTable(props: DirectoryActionProps) {
  return <div className="rounded-2xl border border-stone-200 bg-white shadow-sm"><Table><TableHeader><TableRow><TableHead>Thành viên</TableHead><TableHead>{props.publicOnly ? "Đời thứ" : "Đời / Giới tính"}</TableHead><TableHead>Năm sinh / mất</TableHead><TableHead>Cha / Mẹ</TableHead>{!props.publicOnly && <TableHead>Liên hệ</TableHead>}<TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader><TableBody>{props.items.map((member) => <TableRow key={member.id}><TableCell><MemberIdentity member={member} onClick={() => props.onView(member)} /></TableCell><TableCell><Badge variant="softWine">Đời {member.generation}</Badge>{!props.publicOnly && <p className="mt-1 text-xs text-stone-500">{genderLabel(member.gender)}</p>}</TableCell><TableCell><DateSummary member={member} publicOnly={props.publicOnly} /></TableCell><TableCell><ParentSummary member={member} allMembers={props.allMembers} /></TableCell>{!props.publicOnly && <TableCell><ContactSummary member={member} publicOnly={false} /></TableCell>}<TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon-sm" onClick={() => props.onView(member)} aria-label={`Xem ${member.name}`}><UserRound className="size-4" /></Button>{props.canEdit && <Button variant="ghost" size="icon-sm" onClick={() => props.onEdit(member)} aria-label={`Sửa ${member.name}`}><Pencil className="size-4" /></Button>}{props.canDelete && <Button variant="ghost" size="icon-sm" className="text-red-600 hover:bg-red-50" onClick={() => props.onDelete(member)} aria-label={`Xóa ${member.name}`}><Trash2 className="size-4" /></Button>}</div></TableCell></TableRow>)}</TableBody></Table></div>;
}
function DirectoryGrid(props: DirectoryActionProps) { return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{props.items.map((member) => <MemberCard key={member.id} member={member} allMembers={props.allMembers} publicOnly={props.publicOnly} canEdit={props.canEdit} canDelete={props.canDelete} onView={props.onView} onEdit={props.onEdit} onDelete={props.onDelete} />)}</div>; }
function MemberCard({ member, allMembers, publicOnly, canEdit, canDelete, onView, onEdit, onDelete }: { member: FamilyMember; allMembers: FamilyMember[]; publicOnly: boolean; canEdit: boolean; canDelete: boolean; onView: (member: FamilyMember) => void; onEdit: (member: FamilyMember) => void; onDelete: (member: FamilyMember) => void }) {
  return <article className="flex flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-wine/25 hover:shadow-md"><div className="flex items-start gap-3"><MemberIdentity member={member} onClick={() => onView(member)} />{!publicOnly && <div className="ml-auto"><Badge variant={member.isAlive ? "success" : "secondary"}>{member.isAlive ? "Còn sống" : "Đã mất"}</Badge></div>}</div><div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><p className="text-stone-400">Đời thứ</p><p className="mt-1 font-semibold text-stone-700">{member.generation}</p></div>{!publicOnly && <div><p className="text-stone-400">Giới tính</p><p className="mt-1 font-semibold text-stone-700">{genderLabel(member.gender)}</p></div>}<div><p className="text-stone-400">Sinh</p><p className="mt-1 font-semibold text-stone-700">{member.birthYear}</p></div><div><p className="text-stone-400">Mất</p><p className="mt-1 font-semibold text-stone-700">{member.deathYear ?? "—"}</p></div></div><div className="mt-4 border-t border-stone-100 pt-3"><ParentSummary member={member} allMembers={allMembers} />{!publicOnly && <ContactSummary member={member} publicOnly={false} />}</div><div className="mt-4 flex gap-2 border-t border-stone-100 pt-4"><Button variant="outline" size="sm" className="flex-1" onClick={() => onView(member)}>Xem hồ sơ</Button>{canEdit && <Button variant="ghost" size="icon-sm" onClick={() => onEdit(member)} aria-label={`Sửa ${member.name}`}><Pencil className="size-4" /></Button>}{canDelete && <Button variant="ghost" size="icon-sm" className="text-red-600 hover:bg-red-50" onClick={() => onDelete(member)} aria-label={`Xóa ${member.name}`}><Trash2 className="size-4" /></Button>}</div></article>;
}
function MemberIdentity({ member, onClick }: { member: FamilyMember; onClick: () => void }) { const publicOnly = isPublicMember(member); return <button type="button" onClick={onClick} className="flex min-w-0 items-center gap-3 text-left"><Avatar className="size-10">{member.avatarUrl && member.avatarUrl !== "***" && <AvatarImage src={member.avatarUrl} alt={member.name} />}<AvatarFallback className={avatarClass(member.avatarTone)}>{member.initials}</AvatarFallback></Avatar><span className="min-w-0"><span className="block truncate font-semibold text-stone-800">{member.name}</span>{!publicOnly && <span className="mt-0.5 block truncate text-[11px] text-stone-400">{member.nickname || member.role}</span>}</span></button>; }
function DateSummary({ member, publicOnly }: { member: FamilyMember; publicOnly: boolean }) { if (publicOnly) return <div className="text-xs leading-5 text-stone-500"><p>Sinh: <b className="font-medium text-stone-700">{member.birthYear}</b></p>{member.deathYear && <p className="mt-1 text-wine">Mất: <b className="font-medium">{member.deathYear}</b></p>}</div>; return <div className="text-xs leading-5 text-stone-500"><p>Sinh: <b className="font-medium text-stone-700">{member.birthDateSolar && member.birthDateSolar !== "***" ? member.birthDateSolar : member.birthYear}</b></p><p>{member.birthLunar}</p>{!member.isAlive && <p className="mt-1 text-wine">Mất: <b>{member.deathDateSolar && member.deathDateSolar !== "***" ? member.deathDateSolar : member.deathYear}</b></p>}</div>; }
function ParentSummary({ member, allMembers }: { member: FamilyMember; allMembers: FamilyMember[] }) { const father = allMembers.find((item) => item.id === member.fatherId); const mother = allMembers.find((item) => item.id === member.motherId); return <div className="text-xs text-stone-500"><p className="truncate">Cha: <b className="font-medium text-stone-700">{father?.name ?? "—"}</b></p><p className="truncate">Mẹ: <b className="font-medium text-stone-700">{mother?.name ?? "—"}</b></p></div>; }
function ContactSummary({ member, publicOnly }: { member: FamilyMember; publicOnly: boolean }) { if (publicOnly) return <p className="mt-2 text-[11px] text-stone-400">Thông tin liên hệ được bảo vệ</p>; return <div className="mt-2 text-xs text-stone-500"><p className="truncate">SĐT: <b className="font-medium text-stone-700">{member.phone}</b></p><p className="truncate">Địa chỉ: <b className="font-medium text-stone-700">{member.address}</b></p></div>; }
function genderLabel(gender: Gender) { return gender === "male" ? "Nam" : gender === "female" ? "Nữ" : "Khác"; }
function avatarClass(tone: FamilyMember["avatarTone"]) { return tone === "wine" ? "bg-wine text-white" : tone === "amber" ? "bg-gold-soft text-gold-deep" : tone === "sage" ? "bg-sage-soft text-sage" : "bg-stone-200 text-stone-600"; }

