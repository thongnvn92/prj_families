import { apiSlice, runMockQuery } from "./apiSlice";
import type { AppRole } from "../context/AuthContext";
import { createChatGroup, getChatGroups, getGroupMessages, sendMessage } from "../services/chatService";
import type { ChatGroup, ChatGroupType, ChatMessage } from "../types/chat";

interface GroupMessagesArgs { role: AppRole; groupId: string }
interface SendMessageArgs { role: AppRole; groupId: string; text: string; imageBase64?: string | null }
interface CreateGroupArgs { role: AppRole; name: string; type: ChatGroupType; memberCount: number }

export const chatApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getChatGroups: builder.query<ChatGroup[], AppRole>({
      queryFn: (role) => runMockQuery(() => getChatGroups(role)),
      providesTags: ["ChatGroups"],
    }),
    getGroupMessages: builder.query<ChatMessage[], GroupMessagesArgs>({
      queryFn: ({ role, groupId }) => runMockQuery(() => getGroupMessages(groupId, role)),
      providesTags: (_result, _error, { groupId }) => [{ type: "ChatMessages", id: groupId }, "ChatMessages"],
    }),
    sendMessage: builder.mutation<ChatMessage, SendMessageArgs>({
      queryFn: ({ role, groupId, text, imageBase64 }) => runMockQuery(() => sendMessage(groupId, text, imageBase64, role)),
      invalidatesTags: (_result, _error, { groupId }) => [{ type: "ChatMessages", id: groupId }, "ChatGroups"],
    }),
    createChatGroup: builder.mutation<ChatGroup, CreateGroupArgs>({
      queryFn: ({ role, name, type, memberCount }) => runMockQuery(() => createChatGroup(name, type, memberCount, role)),
      invalidatesTags: ["ChatGroups"],
    }),
  }),
});

export const { useGetChatGroupsQuery, useGetGroupMessagesQuery, useSendMessageMutation, useCreateChatGroupMutation } = chatApiSlice;
