import { apiSlice, runMockQuery } from "./apiSlice";
import type { AppRole } from "../context/AuthContext";
import { sendAiPrompt } from "../services/aiService";
import type { ChatMessage } from "../types/ai";

interface SendPromptArgs { role: AppRole; prompt: string }

export const aiApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    sendAiPrompt: builder.mutation<ChatMessage, SendPromptArgs>({
      queryFn: ({ role, prompt }) => runMockQuery(() => sendAiPrompt(prompt, role)),
    }),
  }),
});

export const { useSendAiPromptMutation } = aiApiSlice;
