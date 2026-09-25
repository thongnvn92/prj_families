import { getUpcomingEvents } from "./calendarService";
import { familyMembers, type FamilyMember } from "../lib/mock-data";
import { hasRolePermission, type AppRole } from "../context/AuthContext";
import type { ChatMessage, ChatReference } from "../types/ai";

const AI_LATENCY = 200;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), AI_LATENCY));
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("vi").trim();
}

function reference(member: FamilyMember): ChatReference {
  return { memberId: member.id, name: member.name };
}

function uniqueReferences(members: FamilyMember[]): ChatReference[] {
  return members.filter((member, index, list) => list.findIndex((item) => item.id === member.id) === index).map(reference);
}

function message(text: string, references: ChatReference[] = []): ChatMessage {
  return { id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, sender: "assistant", text, timestamp: new Date().toISOString(), references };
}

function findMember(prompt: string): FamilyMember | undefined {
  const query = normalize(prompt);
  if (!query) return undefined;
  return [...familyMembers].sort((a, b) => normalize(b.name).length - normalize(a.name).length).find((member) => query.includes(normalize(member.name)) || normalize(member.name).includes(query));
}

export async function sendAiPrompt(prompt: string, role: AppRole): Promise<ChatMessage> {
  if (!hasRolePermission(role, "canUsePrivateSections")) throw new Error("Bạn không có quyền sử dụng trợ lý AI nội bộ.");
  const query = normalize(prompt);
  const root = familyMembers.find((member) => member.id === "minh")!;
  const founder = familyMembers.find((member) => member.id === "duc")!;
  const cụThanh = familyMembers.find((member) => member.id === "van-thanh")!;
  const mentionedMember = findMember(prompt);

  if (/(nguon goc|origin|que hanh|thuỷ tổ|thuy to|tổ tiên|to tien)/.test(query)) {
    return delay(message(`Kính thưa ông/bà, theo dữ liệu gia phả hiện có, dòng Họ Nguyễn Chi 3 ghi nhận cội nguồn tại Bắc Ninh. Cụ Nguyễn Văn Minh được ghi là Thủy Tổ, sinh năm ${root.birthYear}; hiện dữ liệu mới ghi nhận các thế hệ từ đời thứ nhất đến thế hệ thứ năm. Ông/bà có thể mở các thẻ tham chiếu bên dưới để xem hồ sơ chi tiết ạ.`, [reference(root)]));
  }

  if (/(ngay gio|ngày giỗ|gio|lich|lịch|thang|tháng)/.test(query)) {
    const events = await getUpcomingEvents(role);
    const listed = events.slice(0, 4);
    const lines = listed.map((event) => `• ${event.memberName}: âm ${event.lunarDay}/${event.lunarMonth}, còn ${event.daysRemaining} ngày`).join("\n");
    return delay(message(`Kính thưa ông/bà, đây là các ngày giỗ sắp tới mà Trợ lý Gia Tộc đang ghi nhận:\n${lines}\n\nĐể xem ngày dương tương ứng hoặc đăng ký mâm cúng, ông/bà có thể mở mục Lịch Âm & Nhắc giỗ ạ.`, uniqueReferences(listed.map((event) => familyMembers.find((member) => member.id === event.memberId)).filter((member): member is FamilyMember => Boolean(member)))));
  }

  if (/(cung|cúng|van|nghi le|nghi lễ)/.test(query)) {
    return delay(message(`Kính thưa ông/bà, cháu xin gợi ý bài văn cúng giỗ thường như sau: “Kính lễ tưởng niệm cụ cố, xin cụ từ thiên thượng đội vòng sáng suốt, phù trì con cháu, gia đạo an khang…” Khi cúng, ông/bà nên chuẩn bị lư hương, hoa quả, rượu, trà, bát cơm, đèn và hướng về bàn thờu. Trước khi dùng, xin ông/bà đối chiếu văn quy trong dòng họ và hỏi trưởng chi nếu có nghi lễ riêng ạ.`, [reference(cụThanh), reference(founder)]));
  }

  if (mentionedMember) {
    return delay(message(`Kính thưa ông/bà, theo dữ liệu gia phả, ${mentionedMember.name} là ${mentionedMember.role.toLocaleLowerCase("vi")} thuộc đời thứ ${mentionedMember.generation}, sinh năm ${mentionedMember.birthYear}${mentionedMember.deathYear ? `, mất năm ${mentionedMember.deathYear}` : ""}. ${mentionedMember.bio}`, [reference(mentionedMember)]));
  }

  return delay(message(`Kính thưa ông/bà, cháu đã nhận câu hỏi: “${prompt.trim()}”. Cháu chưa tìm thấy dữ liệu phù hợp trong kho gia phả hiện tại. Ông/bà có thể thử hỏi về Thủy tổ, ngày giỗ, thành viên cụ thể hoặc bài văn cúng; cháu sẽ tiếp tục tra cứu dữ liệu nội bộ ạ.`));
}
