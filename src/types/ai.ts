export interface ChatReference {
  memberId: string;
  name: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  references?: ChatReference[];
}
