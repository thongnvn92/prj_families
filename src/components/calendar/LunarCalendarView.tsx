import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { AccessDenied } from "../common/AccessDenied";
import type { FormEvent, ReactNode } from "react";
import { vi } from "date-fns/locale/vi";
import type { DayButtonProps } from "react-day-picker";
import { BellRing, CalendarDays, CheckCircle2, ClipboardCheck, LoaderCircle, MapPin, Send, X } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Calendar } from "../ui/calendar";
import { useGetEventsByMonthQuery, useGetUpcomingEventsQuery, useRegisterEventDutyMutation } from "../../app/calendarApi";
import { getApiErrorMessage } from "../../app/apiSlice";
import type { EventDutyType, LunarEvent } from "../../types/calendar";
import { cn } from "../../lib/utils";

const lunarDayLabels = ["Mùng 1", "Mùng 2", "Mùng 3", "Mùng 4", "Mùng 5", "Mùng 6", "Mùng 7", "Mùng 8", "Mùng 9", "Mùng 10", "Mùng 11", "Mùng 12", "Mùng 13", "Mùng 14", "Mùng 15", "Mùng 16", "Mùng 17", "Mùng 18", "Mùng 19", "Mùng 20", "Mùng 21", "Mùng 22", "Mùng 23", "Mùng 24", "Mùng 25", "Mùng 26", "Mùng 27", "Mùng 28", "Mùng 29", "Mùng 30"];
const toDateKey = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
const lunarLabel = (date: Date) => lunarDayLabels[(date.getDate() - 1) % lunarDayLabels.length];
const parseDateKey = (value: string) => { const [year, month, day] = value.split("-").map(Number); return new Date(year, month - 1, day, 12); };
const formatSolarDate = (value: string) => new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }).format(parseDateKey(value));
const eventLabel = (event: LunarEvent) => event.eventType === "death_anniversary" ? "Ngày giỗ" : "Sinh nhật";

function LunarDayButton({ day, modifiers, eventDates, ...props }: DayButtonProps & { eventDates: Set<string> }) {
  const hasEvent = eventDates.has(toDateKey(day.date));
  return <button {...props} className={cn("group relative flex size-11 flex-col items-center justify-center rounded-xl text-sm transition hover:bg-wine/8 hover:text-wine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine/30", modifiers.today && "font-bold text-wine", modifiers.selected && "bg-wine text-white shadow-sm hover:bg-wine hover:text-white", modifiers.outside && "text-stone-300", hasEvent && !modifiers.selected && "ring-1 ring-gold/50")}><span>{day.date.getDate()}</span><span className={cn("mt-0.5 text-[9px] font-normal leading-none", modifiers.selected ? "text-white/75" : "text-stone-400")}>{lunarLabel(day.date)}</span>{hasEvent && <span className={cn("absolute bottom-1 size-1 rounded-full", modifiers.selected ? "bg-gold" : "bg-gold-deep")} />}</button>;
}

export function LunarCalendarView() {
  const { currentRole, permissions } = useAuth();
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [registerEvent, setRegisterEvent] = useState<LunarEvent | null>(null);
  const [toast, setToast] = useState("");
  const canAccess = permissions.canUsePrivateSections;
  const { data: upcomingEvents = [], isLoading: loadingUpcoming, isError: upcomingError, refetch: refetchUpcoming } = useGetUpcomingEventsQuery(currentRole, { skip: !canAccess });
  const { data: monthEvents = [], isLoading: loadingMonth, isError: monthError, refetch: refetchMonth } = useGetEventsByMonthQuery(
    { role: currentRole, year: month.getFullYear(), month: month.getMonth() + 1 },
    { skip: !canAccess },
  );
  const [registerDutyMutation] = useRegisterEventDutyMutation();
  const loading = canAccess && (loadingUpcoming || loadingMonth);
  const error = upcomingError || monthError ? getApiErrorMessage(upcomingError ?? monthError, "Không tải được dữ liệu lịch. Vui lòng thử lại.") : "";
  const refetchEvents = () => { void refetchUpcoming(); void refetchMonth(); };
  const notify = useCallback((message: string) => { setToast(message); window.setTimeout(() => setToast(""), 3600); }, []);
  const eventDates = useMemo(() => new Set(monthEvents.map((event) => event.solarDate)), [monthEvents]);
  if (!permissions.canUsePrivateSections) return <AccessDenied title="Lịch Âm & Nhắc giỗ dành cho thành viên" description="Bạn cần tài khoản Thành viên dòng họ để xem lịch giỗ, địa điểm an táng và đăng ký nhiệm vụ." />;
  const selectedEvent = selectedDate ? monthEvents.find((event) => event.solarDate === toDateKey(selectedDate)) : undefined;
  const featuredEvent = upcomingEvents[0];
  const handleNotify = (event: LunarEvent) => notify(`Đã gửi lời nhắc ${eventLabel(event).toLocaleLowerCase("vi")} của ${event.memberName} qua Zalo/Telegram.`);
  const handleRegistered = () => { setRegisterEvent(null); refetchEvents(); notify("Đã đăng ký nhiệm vụ thành công. Ban tổ chức sẽ liên hệ bạn."); };
  return <div className="space-y-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-deep">Gìn giữ truyền thống</p><h2 className="mt-2 font-display text-3xl font-semibold text-stone-900 sm:text-4xl">Lịch Âm & Nhắc giỗ</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">Theo dõi ngày giỗ theo âm lịch, chuẩn bị mâm cúng và phối hợp nhiệm vụ trong dòng họ.</p></div><Badge variant="gold" className="w-fit">Đồng bộ nhắc giỗ · 7 ngày trước</Badge></div>
    {featuredEvent && <FeaturedEvent event={featuredEvent} onRegister={() => setRegisterEvent(featuredEvent)} onNotify={() => handleNotify(featuredEvent)} />}
    <div className="grid gap-5 lg:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.6fr)]"><Card className="h-fit border-0 bg-white shadow-[0_10px_32px_rgba(28,25,23,0.05)]"><CardHeader className="border-b bg-[#fcfbf9] px-5 py-4"><div className="flex items-center justify-between"><div><p className="font-display text-lg font-semibold text-stone-900">Tháng {month.getMonth() + 1}/{month.getFullYear()}</p><p className="mt-1 text-xs text-stone-400">Ngày dương & ngày âm Việt Nam</p></div><CalendarDays className="size-5 text-wine" /></div></CardHeader><CardContent className="p-3"><Calendar mode="single" locale={vi} month={month} onMonthChange={setMonth} selected={selectedDate} onSelect={setSelectedDate} showOutsideDays components={{ DayButton: (props) => <LunarDayButton {...props} eventDates={eventDates} /> }} /></CardContent><div className="border-t bg-[#fcfbf9] px-5 py-3"><div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-stone-500"><span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-gold-deep" />Có ngày giỗ</span><span>Ngày âm hiển thị theo lịch mẫu</span></div>{selectedEvent && <div className="mt-3 rounded-xl border border-wine/15 bg-wine/5 p-3"><p className="text-xs font-semibold text-wine">{selectedEvent.memberName} · {eventLabel(selectedEvent)}</p><p className="mt-1 text-[11px] text-stone-500">{formatSolarDate(selectedEvent.solarDate)} · Âm {selectedEvent.lunarDay}/{selectedEvent.lunarMonth}</p></div>}</div></Card><EventList events={monthEvents} loading={loading} error={error} onRetry={refetchEvents} onNotify={handleNotify} onRegister={setRegisterEvent} /></div>
    <DutyDialog event={registerEvent} onOpenChange={(open) => !open && setRegisterEvent(null)} onRegistered={handleRegistered} onSubmit={async (eventId, dutyData) => { await registerDutyMutation({ role: currentRole, eventId, dutyData }).unwrap(); }} />
    {toast && <div role="status" className="fixed bottom-5 right-5 z-[70] flex max-w-sm items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" /><div><p className="text-sm font-semibold text-stone-800">Thành công</p><p className="mt-1 text-xs leading-5 text-stone-500">{toast}</p></div><button onClick={() => setToast("")} className="ml-2 text-stone-300 hover:text-stone-600" aria-label="Đóng thông báo"><X className="size-4" /></button></div>}
  </div>;
}

function FeaturedEvent({ event, onRegister, onNotify }: { event: LunarEvent; onRegister: () => void; onNotify: () => void }) {
  return <Card className="overflow-hidden border-0 text-white shadow-[0_14px_40px_rgba(78,16,21,0.18)]"><div className="relative flex flex-col gap-5 px-5 py-5 sm:px-7"><div className="absolute -right-10 -top-24 size-64 rounded-full border border-gold/20" /><div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-4"><span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#f3d98e]"><BellRing className="size-6" /></span><div><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-[#f3d98e] text-[#701a1e]">{event.daysRemaining === 0 ? "Hôm nay" : `Còn ${event.daysRemaining} ngày`}</Badge><span className="text-xs text-stone-300">{eventLabel(event)}</span></div><h3 className="mt-2 font-display text-2xl font-semibold">{event.memberName}</h3><p className="mt-1 text-sm text-stone-300">Âm {event.lunarDay}/{event.lunarMonth} · Dương {formatSolarDate(event.solarDate)}</p><p className="mt-2 inline-flex items-center gap-1.5 text-xs text-stone-300"><MapPin className="size-3.5" />{event.burialPlace}</p></div></div><div className="flex flex-col gap-2 sm:flex-row lg:shrink-0"><Button variant="gold" onClick={onRegister}><ClipboardCheck className="size-4" />Đăng ký mâm cúng / hậu cần</Button><Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white" onClick={onNotify}><Send className="size-4" />Gửi Zalo / Telegram</Button></div></div></div></Card>;
}

function DutyDialog({ event, onOpenChange, onRegistered, onSubmit }: { event: LunarEvent | null; onOpenChange: (open: boolean) => void; onRegistered: () => void; onSubmit: (eventId: string, dutyData: { memberId: string; volunteerName: string; phone: string; dutyType: EventDutyType; note: string }) => Promise<void> }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dutyType, setDutyType] = useState<EventDutyType>("mam_cung");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault(); if (!event) return; setSubmitting(true);
    await onSubmit(event.id, { memberId: event.memberId, volunteerName: name, phone, dutyType, note });
    setSubmitting(false); setName(""); setPhone(""); setNote(""); onRegistered();
  };
  return <Dialog open={Boolean(event)} onOpenChange={onOpenChange}><DialogContent className="max-w-xl"><DialogHeader><div className="flex size-11 items-center justify-center rounded-2xl bg-wine/8 text-wine"><ClipboardCheck className="size-5" /></div><DialogTitle>Đăng ký nhiệm vụ</DialogTitle><DialogDescription>{event ? `Đăng ký chuẩn bị cho ${eventLabel(event).toLocaleLowerCase("vi")} của ${event.memberName}.` : "Đăng ký chuẩn bị mâm cúng hoặc hậu cần."}</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Họ tên người đăng ký"><Input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Nguyễn Văn An" /></Field><Field label="Số điện thoại"><Input required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="090 000 0000" /></Field></div><Field label="Nhiệm vụ"><Select value={dutyType} onValueChange={(value) => setDutyType(value as EventDutyType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mam_cung">Chuẩn bị mâm cúng</SelectItem><SelectItem value="hau_can">Hậu cần / nhà bếp</SelectItem><SelectItem value="both">Có thể hỗ trợ cả hai</SelectItem></SelectContent></Select></Field><Field label="Ghi chú thêm"><textarea className="min-h-24 w-full resize-none rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-wine/50 focus:ring-4 focus:ring-wine/10" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ví dụ: có thể chuẩn bị từ 7 giờ sáng..." /></Field><div className="rounded-xl bg-gold-soft/60 p-3 text-xs leading-5 text-stone-600">Ban tổ chức sẽ liên hệ để xác nhận đầy đủ thời gian, địa điểm và phân công nhiệm vụ.</div><DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button><Button type="submit" disabled={submitting}>{submitting && <LoaderCircle className="size-4 animate-spin" />}{submitting ? "Đang gửi..." : "Xác nhận đăng ký"}</Button></DialogFooter></form></DialogContent></Dialog>;
}
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="space-y-1.5"><span className="text-xs font-semibold text-stone-600">{label}</span>{children}</label>; }

function EventList({ events, loading, error, onRetry, onNotify, onRegister }: { events: LunarEvent[]; loading: boolean; error: string; onRetry: () => void; onNotify: (event: LunarEvent) => void; onRegister: (event: LunarEvent) => void }) {
  return <Card className="min-h-[500px] border-0 bg-white shadow-[0_10px_32px_rgba(28,25,23,0.05)]"><CardHeader className="border-b bg-white px-5 py-4 sm:px-6"><div className="flex items-center justify-between"><div><p className="font-display text-lg font-semibold text-stone-900">Các sự kiện trong tháng</p><p className="mt-1 text-xs text-stone-400">Sắp xếp theo ngày dương · {events.length} sự kiện</p></div><CalendarDays className="size-5 text-wine" /></div></CardHeader><CardContent className="space-y-3 p-5 sm:p-6">{loading ? <div className="flex min-h-[350px] items-center justify-center"><LoaderCircle className="size-7 animate-spin text-wine" /><span className="ml-2 text-sm text-stone-500">Đang tải lịch...</span></div> : error ? <div className="flex min-h-[350px] flex-col items-center justify-center text-center"><p className="text-sm text-stone-500">{error}</p><Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>Thử lại</Button></div> : events.length === 0 ? <div className="flex min-h-[350px] flex-col items-center justify-center text-center"><CalendarDays className="size-10 text-stone-300" /><p className="mt-4 font-semibold text-stone-700">Chưa có sự kiện trong tháng này</p><p className="mt-1 max-w-xs text-sm text-stone-400">Hãy chuyển tháng khác hoặc tiếp tục theo dõi lịch của dòng họ.</p></div> : events.map((event) => <EventRow key={event.id} event={event} onNotify={onNotify} onRegister={onRegister} />)}</CardContent></Card>;
}
function EventRow({ event, onNotify, onRegister }: { event: LunarEvent; onNotify: (event: LunarEvent) => void; onRegister: (event: LunarEvent) => void }) {
  return <div className="group flex flex-col gap-4 rounded-2xl border border-stone-200/80 p-4 transition hover:border-wine/25 hover:bg-wine/[0.025] sm:flex-row sm:items-center"><div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-wine/8 text-wine"><span className="text-lg font-bold leading-5">{parseDateKey(event.solarDate).getDate()}</span><span className="text-[9px] font-medium uppercase">{new Intl.DateTimeFormat("vi-VN", { month: "short" }).format(parseDateKey(event.solarDate)).replace(".", "")}</span></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-bold text-stone-800">{event.memberName}</p><Badge variant={event.status === "registered" ? "success" : "gold"}>{event.status === "registered" ? "Đã đăng ký" : eventLabel(event)}</Badge></div><p className="mt-1 text-xs text-stone-500">Âm {event.lunarDay}/{event.lunarMonth} · {formatSolarDate(event.solarDate)}</p><p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-stone-400"><MapPin className="size-3.5" />{event.burialPlace}</p></div><div className="flex shrink-0 gap-2 sm:flex-col"><Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => onRegister(event)}><ClipboardCheck className="size-3.5" />Đăng ký</Button><Button variant="ghost" size="sm" className="flex-1 text-xs text-wine" onClick={() => onNotify(event)}><Send className="size-3.5" />Nhắc dòng họ</Button></div></div>;
}


