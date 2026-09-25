import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { AccessDenied } from "../common/AccessDenied";
import { LoaderCircle, Plus, UsersRound } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { ChatGroupType } from "../../types/chat";
import type { FamilyMember } from "../../lib/mock-data";

interface CreateChatGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: FamilyMember[];
  onCreate: (data: { name: string; type: ChatGroupType; memberCount: number }) => Promise<void>;
}

export function CreateChatGroupDialog({ open, onOpenChange, members, onCreate }: CreateChatGroupDialogProps) {
  const { permissions } = useAuth();
  const [name, setName] = useState("");
  const [type, setType] = useState<ChatGroupType>("branch");
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (!open) { setName(""); setType("branch"); setSelected([]); setError(""); setSubmitting(false); } }, [open]);
  if (!open) return null;
  if (!permissions.canCreateChatGroup) return <AccessDenied title="Không có quyền tạo nhóm chat" description="Chỉ Admin hoặc Mod được tạo nhóm trò chuyện nội bộ." />;
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!name.trim()) { setError("Vui lòng nhập tên nhóm."); return; } if (selected.length < 2) { setError("Vui lòng chọn ít nhất 2 thành viên."); return; } setSubmitting(true); setError(""); try { await onCreate({ name: name.trim(), type, memberCount: selected.length }); onOpenChange(false); } catch (createError) { setError(createError instanceof Error ? createError.message : "Không thể tạo nhóm."); } finally { setSubmitting(false); } };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-2xl"><DialogHeader><span className="flex size-11 items-center justify-center rounded-2xl bg-wine/8 text-wine"><Plus className="size-5" /></span><DialogTitle>Tạo Nhóm Chat Mới</DialogTitle><DialogDescription>Chỉ Admin hoặc Mod có thể tạo nhóm trò chuyện nội bộ.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5"><span className="text-xs font-semibold text-stone-600">Tên nhóm *</span><Input value={name} onChange={(event) => { setName(event.target.value); setError(""); }} placeholder="Ví dụ: Nhóm Công Tác Chi 3" /></label><label className="space-y-1.5"><span className="text-xs font-semibold text-stone-600">Loại nhóm</span><Select value={type} onValueChange={(value) => setType(value as ChatGroupType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Toàn dòng họ</SelectItem><SelectItem value="branch">Nhánh họ</SelectItem><SelectItem value="custom">Nhóm tùy chỉnh</SelectItem></SelectContent></Select></label></div><div><p className="flex items-center gap-2 text-sm font-semibold text-stone-700"><UsersRound className="size-4 text-wine" />Chọn thành viên <span className="text-wine">*</span></p><p className="mt-1 text-xs text-stone-400">Đã chọn {selected.length} thành viên</p><div className="thin-scrollbar mt-3 grid max-h-64 grid-cols-1 gap-2 overflow-y-auto rounded-2xl border border-stone-200 bg-stone-50 p-2 sm:grid-cols-2">{members.map((member) => { const checked = selected.includes(member.id); return <button type="button" key={member.id} onClick={() => toggle(member.id)} className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition ${checked ? "border-wine/30 bg-wine/8" : "border-transparent bg-white hover:border-stone-200"}`}><Avatar className="size-8"><AvatarFallback className="bg-stone-200 text-[10px] text-stone-600">{member.initials}</AvatarFallback></Avatar><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-stone-700">{member.name}</span><span className="block text-[10px] text-stone-400">{member.role}</span></span><span className={`flex size-5 items-center justify-center rounded-md border ${checked ? "border-wine bg-wine text-white" : "border-stone-300 bg-white"}`}>{checked && "✓"}</span></button>; })}</div></div>{error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}<DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button><Button type="submit" disabled={submitting}>{submitting && <LoaderCircle className="size-4 animate-spin" />}{submitting ? "Đang tạo..." : "Tạo nhóm chat"}</Button></DialogFooter></form></DialogContent></Dialog>;
}
