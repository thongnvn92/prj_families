import { apiSlice } from "./apiSlice";
import { chatGroupFromApi, chatGroupListFromApi, chatGroupPayload, chatMessageFormData, chatMessageFromApi, chatMessageListFromApi, type ChatGroupResponse, type ChatMessageResponse } from "./chatApiMapper";
import type { AppRole } from "../context/AuthContext";
import type { ChatGroup, ChatMessage, CreateChatGroupInput } from "../types/chat";

export interface GetChatGroupsArgs { authKey: AppRole }
export interface GetGroupMessagesArgs { authKey: AppRole; groupId: string }
interface SendMessageArgs { authKey: AppRole; groupId: string; text: string; image: File | null }
interface CreateGroupArgs { authKey: AppRole; group: CreateChatGroupInput }

export const chatApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getChatGroups: builder.query<ChatGroup[], GetChatGroupsArgs>({
      query: () => ({ url: "/chat/groups" }),
      transformResponse: chatGroupListFromApi,
      providesTags: ["ChatGroups"],
    }),
    getGroupMessages: builder.query<ChatMessage[], GetGroupMessagesArgs>({
      query: ({ groupId }) => ({ url: `/chat/groups/${groupId}/messages` }),
      transformResponse: chatMessageListFromApi,
      providesTags: (_result, _error, { groupId }) => [{ type: "ChatMessages", id: groupId }, "ChatMessages"],
    }),
    sendMessage: builder.mutation<ChatMessage, SendMessageArgs>({
      query: ({ groupId, text, image }) => ({
        url: `/chat/groups/${groupId}/messages`,
        method: "POST",
        body: chatMessageFormData(text, image),
      }),
      transformResponse: (response: ChatMessageResponse) => chatMessageFromApi(response.data!),
      invalidatesTags: (_result, _error, { groupId }) => [{ type: "ChatMessages", id: groupId }, "ChatGroups"],
    }),
    createChatGroup: builder.mutation<ChatGroup, CreateGroupArgs>({
      query: ({ group }) => ({ url: "/chat/groups", method: "POST", body: chatGroupPayload(group) }),
      transformResponse: (response: ChatGroupResponse) => chatGroupFromApi(response.data!),
      invalidatesTags: ["ChatGroups"],
    }),
  }),
});

export const { useGetChatGroupsQuery, useGetGroupMessagesQuery, useSendMessageMutation, useCreateChatGroupMutation } = chatApiSlice;

