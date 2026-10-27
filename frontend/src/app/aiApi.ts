import { apiSlice } from "./apiSlice";
import { aiContextFromApi, aiMessageFromApi, aiStatusFromApi, aiSuggestionsFromApi, type AiChatResponse, type AiStatusResponse, type AiSuggestionsResponse } from "./aiApiMapper";
import type { AppRole } from "../context/AuthContext";
import type { AiContext, AiStatus, ChatMessage } from "../types/ai";

interface SendPromptArgs { authKey: AppRole; prompt: string }
interface AiQueryArgs { authKey: AppRole }

/** Kèm ngữ cảnh gia tộc backend trả về để UI hiển thị "nguồn tri thức". */
export interface AiChatResult { message: ChatMessage; context: AiContext }

const aiContextOf = (response: { context?: AiChatResponse["context"] }): AiContext => aiContextFromApi(response.context);

export const aiApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Gợi ý câu hỏi được sinh từ ngữ cảnh gia tộc nên query lại khi đổi role.
    getAiSuggestions: builder.query<{ suggestions: string[]; context: AiContext }, AiQueryArgs>({
      query: () => ({ url: "/ai/suggestions" }),
      transformResponse: (response: AiSuggestionsResponse) => ({ suggestions: aiSuggestionsFromApi(response), context: aiContextOf(response) }),
      providesTags: ["AiContext"],
    }),
    getAiStatus: builder.query<AiStatus, AiQueryArgs>({
      query: () => ({ url: "/ai/status" }),
      transformResponse: (response: AiStatusResponse) => aiStatusFromApi(response),
      providesTags: ["AiContext"],
    }),
    sendAiPrompt: builder.mutation<AiChatResult, SendPromptArgs>({
      query: ({ prompt }) => ({ url: "/ai/chat", method: "POST", body: { prompt } }),
      transformResponse: (response: AiChatResponse) => ({ message: aiMessageFromApi(response), context: aiContextOf(response) }),
      invalidatesTags: ["AiContext"],
    }),
  }),
});

export const { useGetAiSuggestionsQuery, useGetAiStatusQuery, useSendAiPromptMutation } = aiApiSlice;

