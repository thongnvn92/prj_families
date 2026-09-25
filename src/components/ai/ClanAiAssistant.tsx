import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { useSendAiPromptMutation } from "../../app/aiApi";
import { AccessDenied } from "../common/AccessDenied";
import type { ChatMessage } from "../../types/ai";
import { useAuth } from "../../context/AuthContext";
import { AiAssistantView, welcomeText } from "./AiAssistantView";

const welcomeMessage = (): ChatMessage => ({ id: "welcome", sender: "assistant", text: welcomeText, timestamp: new Date().toISOString() });
interface Props { onSelectMember: (memberId: string) => void; }

export function ClanAiAssistant({ onSelectMember }: Props) {
  const { currentRole, permissions } = useAuth();
  const [sendAiPromptMutation] = useSendAiPromptMutation();
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage()]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [notice, setNotice] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamingText]);
  useEffect(() => { const node = textareaRef.current; if (!node) return; node.style.height = "auto"; node.style.height = `${Math.min(node.scrollHeight, 140)}px`; }, [input]);
  useEffect(() => () => { if (timerRef.current !== null) window.clearInterval(timerRef.current); }, []);
  if (!permissions.canUsePrivateSections) return <AccessDenied title="Trợ lý AI Gia Tộc dành cho thành viên" description="Bạn cần tài khoản Thành viên dòng họ để sử dụng trợ lý tra cứu nội bộ và RAG của gia tộc." />;
  const clearHistory = () => { if (timerRef.current !== null) window.clearInterval(timerRef.current); setMessages([]); setStreamingText(""); setStreamingId(null); setIsSending(false); setInput(""); setNotice("Đã xóa lịch sử trò chuyện."); window.setTimeout(() => setNotice(""), 2800); };
  const handlePrompt = async (prompt: string) => { const trimmed = prompt.trim(); if (!trimmed || isSending) return; setMessages((current) => [...current, { id: `user-${Date.now()}`, sender: "user", text: trimmed, timestamp: new Date().toISOString() }]); setInput(""); setShowSuggestions(false); setIsSending(true); try { const response = await sendAiPromptMutation({ role: currentRole, prompt: trimmed }).unwrap(); setStreamingId(response.id); let index = 0; timerRef.current = window.setInterval(() => { index += Math.max(3, Math.ceil(response.text.length / 45)); setStreamingText(response.text.slice(0, index)); if (index >= response.text.length && timerRef.current !== null) { window.clearInterval(timerRef.current); timerRef.current = null; setMessages((current) => [...current, response]); setStreamingText(""); setStreamingId(null); setIsSending(false); } }, 24); } catch { setIsSending(false); setNotice("Cháu chưa tra cứu được dữ liệu lúc này. Ông/bà vui lòng thử lại ạ."); } };
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void handlePrompt(input); };
  const keyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void handlePrompt(input); } };
  return <AiAssistantView messages={messages} input={input} setInput={setInput} isSending={isSending} streamingText={streamingText} streamingId={streamingId} showSuggestions={showSuggestions} notice={notice} onPrompt={handlePrompt} onClear={clearHistory} onSubmit={submit} onKeyDown={keyDown} textareaRef={textareaRef} endRef={endRef} onSelectMember={onSelectMember} />;
}
