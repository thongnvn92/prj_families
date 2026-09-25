import { BookOpenText, Flame, ScrollText } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import type { Prayer, PrayerCategory } from "../../types/prayer";

const categoryLabels: Record<PrayerCategory, string> = { tet: "Tết & Lễ lớn", gio_to: "Giỗ tổ / Giỗ họ", gio_thuong: "Giỗ thường", nhap_trach: "Nhập trạch", khac: "Nghi lễ khác" };

export function categoryLabel(category: PrayerCategory) { return categoryLabels[category]; }
export function excerpt(content: string) { return content.replace(/\s+/g, " ").trim(); }
export function PrayerCard({ prayer, onOpen }: { prayer: Prayer; onOpen: (prayer: Prayer) => void }) { return <article className="group relative flex min-h-[290px] flex-col overflow-hidden rounded-2xl border border-gold/35 bg-[#fffaf0] p-5 shadow-[0_5px_18px_rgba(78,16,21,0.06)] transition duration-200 hover:-translate-y-1 hover:border-gold/70 hover:shadow-[0_12px_28px_rgba(78,16,21,0.12)]"><div className="absolute -right-10 -top-10 size-32 rounded-full border border-gold/15" /><div className="relative flex items-start justify-between gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-wine/8 text-wine">{prayer.category === "gio_thuong" ? <Flame className="size-5" /> : <ScrollText className="size-5" />}</span><Badge variant="gold" className="shrink-0">{categoryLabels[prayer.category]}</Badge></div><h3 className="relative mt-5 font-display text-xl font-semibold leading-7 text-stone-900">{prayer.title}</h3><p className="relative mt-3 line-clamp-3 text-sm leading-6 text-stone-600">{excerpt(prayer.content).slice(0, 155)}{prayer.content.length > 155 ? "…" : ""}</p><div className="relative mt-auto flex items-end justify-between gap-3 pt-5"><span className="flex items-center gap-1.5 text-[11px] text-stone-400"><BookOpenText className="size-3.5" />{prayer.authorName}</span><Button size="sm" variant="outline" onClick={() => onOpen(prayer)}>Xem toàn văn</Button></div></article>; }
