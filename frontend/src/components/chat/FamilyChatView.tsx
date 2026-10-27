import { useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, Lock, MessageCircle, Pencil, ShieldAlert, UsersRound } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { useAuth } from "../../context/AuthContext";
import { filterChatHistoryForRole } from "../../lib/rbacFilter";
import { useFamilySettings } from "../../lib/useFamilySettings";
import type { FamilyMember } from "../../lib/mock-data";
import type { CreateChatGroupInput } from "../../types/chat";
import { useCreateChatGroupMutation, useGetChatGroupsQuery, useGetGroupMessagesQuery, useSendMessageMutation } from "../../app/chatApi";
import { getApiErrorMessage } from "../../app/apiSlice";
import { ChatComposer } from "./ChatComposer";
import { ChatGroupList, MaskedChatGroups } from "./ChatGroupList";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { CreateChatGroupDialog } from "./CreateChatGroupDialog";
import { RealtimeStatusBadge } from "./RealtimeStatusBadge";
import { useChatRealtime } from "./useChatRealtime";
import { useTypingIndicator } from "./useTypingIndicator";

interface FamilyChatViewProps { members: FamilyMember[]; }

/** Ghép danh sách người đang soạn tin thành câu tiếng Việt tự nhiên. */
function formatTypingNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} và ${names[names.length - 1]}`;
}

export function FamilyChatView({ members }: FamilyChatViewProps) {
  const { currentRole, isInitializing, permissions, token, user } = useAuth();
  const { chatEnabled, canUploadImages } = useFamilySettings();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const canAccess = permissions.canViewGroupChat && chatEnabled;
  const canCreate = permissions.canCreateChatGroup;
  const { data: groups = [], isLoading: loadingGroups, isError: groupsError, refetch: refetchGroups } = useGetChatGroupsQuery({ authKey: currentRole }, { skip: !canAccess || isInitializing });
  const { data: queriedMessages = [], isLoading: loadingMessages, isFetching: fetchingMessages, isError: messagesError, refetch: refetchMessages } = useGetGroupMessagesQuery(
    { authKey: currentRole, groupId: selectedGroupId ?? "" },
    { skip: !canAccess || isInitializing || !selectedGroupId },
  );
  const [sendMessageMutation] = useSendMessageMutation();
  const [createChatGroupMutation] = useCreateChatGroupMutation();
  const messages = useMemo(() => filterChatHistoryForRole(queriedMessages, currentRole), [queriedMessages, currentRole]);
  const realtimeEnabled = canAccess && !isInitializing;
  const currentUserId = user ? String(user.id) : null;
  const realtimeStatus = useChatRealtime({ groupId: selectedGroupId, authKey: currentRole, enabled: realtimeEnabled, token, userId: currentUserId });
  const { typingNames, notifyTyping } = useTypingIndicator({ groupId: selectedGroupId, enabled: realtimeEnabled, userId: currentUserId, userName: user?.name ?? "Thành viên" });
  useEffect(() => { if (!canCreate) setCreateOpen(false); }, [canCreate]);
  const selectedGroup = useMemo(() => groups.find((group) => group.id === selectedGroupId) ?? null, [groups, selectedGroupId]);
  useEffect(() => { if (groups.length && (!selectedGroupId || !groups.some((group) => group.id === selectedGroupId))) setSelectedGroupId(groups[0].id); if (!canAccess) setSelectedGroupId(null); }, [groups, selectedGroupId, canAccess]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  const handleSend = async (text: string, image: File | null) => {
    if (!selectedGroupId || !canAccess) return;
    try {
      await sendMessageMutation({ authKey: currentRole, groupId: selectedGroupId, text, image }).unwrap();
    } catch (error) {
      // unwrap() ném FetchBaseQueryError nên phải chuyển sang Error để composer hiện đúng thông báo API.
      throw new Error(getApiErrorMessage(error, "Không thể gửi tin nhắn."));
    }
  };
  const handleCreate = async (input: CreateChatGroupInput) => {
    if (!canCreate) throw new Error("Bạn không có quyền tạo nhóm chat.");
    try {
      const group = await createChatGroupMutation({ authKey: currentRole, group: input }).unwrap();
      setSelectedGroupId(group.id);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Không thể tạo nhóm chat."));
    }
  };
  if (!canAccess) return <div className="mx-auto max-w-6xl"><GuestChatGate /></div>;
  return <div className="mx-auto max-w-7xl space-y-5"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-deep">Kết nối dòng họ</p><h2 className="mt-2 font-display text-3xl font-semibold text-stone-900 sm:text-4xl">Trò chuyện nội bộ</h2><p className="mt-2 text-sm text-stone-500">Trao đổi thông tin gia đình trong từng nhánh và nhóm riêng.</p></div><Card className="grid min-h-[680px] overflow-hidden border-0 p-0 shadow-[0_12px_40px_rgba(28,25,23,0.07)] lg:grid-cols-[300px_minmax(0,1fr)]"><ChatGroupList groups={groups} selectedGroupId={selectedGroupId} searchQuery={searchQuery} onSearchChange={setSearchQuery} onSelect={(group) => setSelectedGroupId(group.id)} canCreate={canCreate} onCreate={() => setCreateOpen(true)} /><section className="flex min-h-[680px] min-w-0 flex-col bg-[#fcfbf9]">{selectedGroup ? <><div className="flex items-center justify-between border-b bg-white px-5 py-4"><div className="min-w-0"><div className="flex items-center gap-2"><h3 className="truncate font-display text-lg font-semibold text-stone-900">{selectedGroup.name}</h3><Badge variant={selectedGroup.creatorRole === "Trưởng Tộc" ? "softWine" : "gold"}>{selectedGroup.creatorRole ?? "Thành Viên"}</Badge></div><p className="mt-1 flex items-center gap-1 text-xs text-stone-400"><UsersRound className="size-3.5" />{selectedGroup.memberCount} thành viên</p></div><div className="flex items-center gap-2"><RealtimeStatusBadge status={realtimeStatus} /><MessageCircle className="size-5 text-wine" /></div></div><div className="thin-scrollbar flex-1 space-y-5 overflow-y-auto p-5">{loadingMessages ? <div className="flex h-full items-center justify-center"><LoaderCircle className={`size-6 animate-spin text-wine ${fetchingMessages ? "opacity-60" : ""}`} /></div> : messagesError ? <div className="flex h-full flex-col items-center justify-center text-center"><p className="text-sm text-red-600">Không tải được tin nhắn.</p><Button variant="outline" size="sm" className="mt-3" onClick={() => void refetchMessages()}>Thử lại</Button></div> : messages.map((message) => <ChatMessageBubble key={message.id} message={message} isOwn={Boolean(user) && message.senderId === String(user?.id)} />)}{!loadingMessages && !messagesError && messages.length === 0 && <p className="text-center text-sm text-stone-400">Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện ạ.</p>}{typingNames.length > 0 && <p className="flex items-center gap-1.5 text-xs text-stone-400" role="status" aria-live="polite"><Pencil className="size-3 animate-pulse" />{formatTypingNames(typingNames)} đang soạn tin</p>}<div ref={endRef} /></div><ChatComposer onSend={handleSend} canAttachImage={canUploadImages} onTyping={(isTyping) => { if (isTyping) notifyTyping(); }} /></> : <div className="flex flex-1 flex-col items-center justify-center text-center"><MessageCircle className="size-10 text-stone-300" /><p className="mt-3 font-semibold text-stone-700">{loadingGroups ? "Đang tải nhóm chat..." : groupsError ? "Không tải được nhóm chat" : "Chọn một nhóm để bắt đầu"}</p>{groupsError && <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetchGroups()}>Thử lại</Button>}</div>}</section></Card><CreateChatGroupDialog open={createOpen} onOpenChange={setCreateOpen} members={members} onCreate={handleCreate} /></div>;
}

function GuestChatGate() { return <div className="grid overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-[0_12px_40px_rgba(28,25,23,0.05)] lg:grid-cols-[300px_minmax(0,1fr)]"><MaskedChatGroups /><div className="flex min-h-[520px] flex-col items-center justify-center bg-[#fcfbf9] p-8 text-center"><span className="flex size-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-700"><Lock className="size-8" /></span><h3 className="mt-5 font-display text-2xl font-semibold text-stone-900">Khu vực dành cho thành viên</h3><p className="mt-3 max-w-lg text-sm leading-6 text-stone-500">Bạn cần đăng nhập tài khoản Thành viên dòng họ để tham gia Trò chuyện nội bộ.</p><div className="mt-5 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800"><ShieldAlert className="size-4" />Danh sách nhóm và nội dung tin nhắn đã được che mờ.</div></div></div>; }

