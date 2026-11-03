export type Gender = "male" | "female" | "other";
export type AvatarTone = "wine" | "amber" | "sage" | "slate";

export interface FamilyMember {
  id: string;
  name: string;
  nickname?: string;
  initials: string;
  gender: Gender;
  generation: number;
  orderInFamily?: number;
  role: string;
  birthYear: number;
  birthDateSolar?: string;
  /** Nhãn can - chi do backend tính, ví dụ "Mậu Thân" (năm âm). */
  birthZodiac?: string;
  deathYear?: number;
  deathDateSolar?: string;
  deathZodiac?: string;
  isAlive: boolean;
  birthLunar: string;
  deathLunar?: string;
  birthDayLunar?: number;
  birthMonthLunar?: number;
  birthYearLunar?: number;
  deathDayLunar?: number;
  deathMonthLunar?: number;
  deathYearLunar?: number;
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  spouseIds?: string[];
  phone: string;
  birthplace: string;
  address: string;
  bio: string;
  burialPlace?: string;
  burialMapUrl: string;
  homeMapUrl?: string;
  avatarUrl?: string;
  avatarTone: AvatarTone;
  email?: string;
}

const northVietnamMap =
  "https://www.google.com/maps/search/?api=1&query=B%E1%BA%AFc+Ninh";
const hanoiMap =
  "https://www.google.com/maps/search/?api=1&query=Ho%C3%A0ng+Ki%E1%BB%93m+H%C3%A0+N%E1%BB%99i";

function makeMember(member: Partial<FamilyMember> & Pick<FamilyMember, "id" | "name" | "initials" | "generation" | "birthYear">): FamilyMember {
  return {
    gender: "male",
    role: "Thành viên",
    birthDateSolar: "",
    deathDateSolar: "",
    isAlive: true,
    birthLunar: "Không ghi nhận",
    deathLunar: "Không ghi nhận",
    phone: "090 000 0000",
    birthplace: "Bắc Ninh",
    address: "Dòng họ Họ Nguyễn, Chi 3",
    bio: "Thành viên trong gia phả Họ Nguyễn — Chi 3.",
    burialPlace: "Khu di tích gia tộc, Bắc Ninh",
    burialMapUrl: northVietnamMap,
    homeMapUrl: hanoiMap,
    avatarUrl: "",
    avatarTone: "wine",
    ...member,
  };
}

export const familyMembers: FamilyMember[] = [


  makeMember({
    id: "van-thanh", name: "Nguyễn Văn Thành", initials: "NT", generation: 2, birthYear: 1925, deathYear: 2001,
    isAlive: false, birthLunar: "11 / 01 / 1925 âm lịch", deathLunar: "23 / 12 / 2001 âm lịch", fatherId: "r-rinh", motherId: "r-quet", spouseId: "r-xuan-lieu",
    role: "Cụ", phone: "Liên hệ qua Trưởng tộc", avatarTone: "amber", bio: "Cụ Thành gắn bó với ruộng đồng và là người ghi nhớ nhiều thế hệ trong nhánh Chi 3.",
    email: "thanhnv@nguyenvan.naol.cloud",
  }),



















  makeMember({
    id: "an", name: "Nguyễn Gia An", initials: "GA", gender: "female", generation: 5, birthYear: 2021, birthLunar: "21 / 09 / 2021 âm lịch",
    fatherId: "anh", role: "Cháu kế tục", phone: "Chưa cập nhật", address: "Hà Nội", avatarTone: "slate",
    bio: "An thuộc thế hệ thứ năm, được gia đình yêu thương và ghi nhận trong từng mốc trưởng thành.",
    email: "anng@nguyenvan.naol.cloud",
  }),

  makeMember({
    id: "r-rinh", name: "Nguyễn Văn Rinh", initials: "NR", generation: 1, birthYear: 1890, deathYear: 1965,
    isAlive: false, role: "Thủy Tổ", avatarTone: "wine", email: "rinhnv@nguyenvan.naol.cloud",
    bio: "Tổ đầu tiên hệ Nguyễn Văn Rinh — Bà Trần Thị Quệt.",
  }),
  makeMember({
    id: "r-quet", name: "Trần Thị Quệt", initials: "TQ", gender: "female", generation: 1, birthYear: 1895, deathYear: 1970,
    isAlive: false, role: "Bà nội", avatarTone: "slate", email: "quettt@nguyenvan.naol.cloud",
    bio: "Vợ của tổ Nguyễn Văn Rinh.",
  }),
  makeMember({
    id: "r-dung", name: "Nguyễn Thị Dung", initials: "ND", gender: "female", generation: 2, birthYear: 1915,
    fatherId: "r-rinh", motherId: "r-quet", spouseId: "r-hoang", role: "Con", avatarTone: "sage", email: "dungnt@nguyenvan.naol.cloud",
    bio: "Con của tổ Rinh — Quệt, vợ của ông Hoàng.",
  }),
  makeMember({
    id: "r-hoang", name: "Ông Hoàng", initials: "HO", generation: 2, birthYear: 1912,
    spouseId: "r-dung", role: "Con rể", avatarTone: "amber", email: "hoangh@nguyenvan.naol.cloud",
    bio: "Con rể của bà Dung.",
  }),
  makeMember({
    id: "r-huy", name: "Ông Huy", initials: "HU", generation: 3, birthYear: 1940,
    fatherId: "r-dung", motherId: "r-hoang", role: "Cháu", avatarTone: "amber", email: "huyh@nguyenvan.naol.cloud",
    bio: "Cháu của bà Dung — ông Hoàng.",
  }),
  makeMember({
    id: "r-han", name: "Bà Hân", initials: "HA", gender: "female", generation: 3, birthYear: 1942,
    fatherId: "r-dung", motherId: "r-hoang", role: "Cháu", avatarTone: "sage", email: "hanh@nguyenvan.naol.cloud",
    bio: "Cháu của bà Dung — ông Hoàng.",
  }),
  makeMember({
    id: "r-sinh", name: "Nguyễn Văn Sinh", initials: "SV", generation: 2, birthYear: 1918,
    fatherId: "r-rinh", motherId: "r-quet", spouseId: "r-cam", role: "Con", avatarTone: "amber", email: "sinhnv@nguyenvan.naol.cloud",
    bio: "Con của tổ Rinh — Quệt, chồng bà Cầm.",
  }),
  makeMember({
    id: "r-cam", name: "Bà Cầm", initials: "CM", gender: "female", generation: 2, birthYear: 1920,
    spouseId: "r-sinh", role: "Con dâu", avatarTone: "slate", email: "camc@nguyenvan.naol.cloud",
    bio: "Con dâu của ông Sinh.",
  }),
  makeMember({
    id: "r-dongni", name: "Ông Đông ni", initials: "DN", generation: 3, birthYear: 1945,
    fatherId: "r-sinh", motherId: "r-cam", role: "Cháu", avatarTone: "amber", email: "nid@nguyenvan.naol.cloud",
    bio: "Cháu của ông Sinh — bà Cầm.",
  }),
  makeMember({
    id: "r-yienni", name: "Ông Yien ni", initials: "YN", generation: 3, birthYear: 1947,
    fatherId: "r-sinh", motherId: "r-cam", role: "Cháu", avatarTone: "amber", email: "niy@nguyenvan.naol.cloud",
    bio: "Cháu của ông Sinh — bà Cầm.",
  }),
  makeMember({
    id: "r-toan", name: "Nguyễn Văn Toàn", initials: "TT", generation: 2, birthYear: 1922,
    fatherId: "r-rinh", motherId: "r-quet", spouseId: "r-kimyen", role: "Con", avatarTone: "amber", email: "toannv@nguyenvan.naol.cloud",
    bio: "Con của tổ Rinh — Quệt, chồng bà Kim Yến.",
  }),
  makeMember({
    id: "r-kimyen", name: "Bà Nguyễn Thị Kim Yến", initials: "KY", gender: "female", generation: 2, birthYear: 1925,
    spouseId: "r-toan", role: "Con dâu", avatarTone: "wine", email: "yennt@nguyenvan.naol.cloud",
    bio: "Con dâu của ông Toàn.",
  }),
  makeMember({
    id: "r-an-thu", name: "Bà Nguyễn Anh Thư", initials: "AT", gender: "female", generation: 3, birthYear: 1948,
    fatherId: "r-toan", motherId: "r-kimyen", spouseId: "r-thien", role: "Cháu", avatarTone: "sage", email: "thuna@nguyenvan.naol.cloud",
    bio: "Cháu của ông Toàn — bà Kim Yến, vợ Nguyễn Hữu Thiên.",
  }),
  makeMember({
    id: "r-thien", name: "Nguyễn Hữu Thiên", initials: "TH", generation: 3, birthYear: 1945,
    spouseId: "r-an-thu", role: "Con rể", avatarTone: "wine", email: "thiennh@nguyenvan.naol.cloud",
    bio: "Con rể của bà Anh Thư.",
  }),
  makeMember({
    id: "r-tinh-giang", name: "Bà Nguyễn Tịnh Giang", initials: "TG", gender: "female", generation: 3, birthYear: 1950,
    fatherId: "r-toan", motherId: "r-kimyen", spouseId: "r-thuc", role: "Cháu", avatarTone: "sage", email: "giangnt@nguyenvan.naol.cloud",
    bio: "Cháu của ông Toàn — bà Kim Yến, vợ Nguyễn Thục.",
  }),
  makeMember({
    id: "r-thuc", name: "Nguyễn Thục", initials: "TC", generation: 3, birthYear: 1948,
    spouseId: "r-tinh-giang", role: "Con rể", avatarTone: "wine", email: "thucn@nguyenvan.naol.cloud",
    bio: "Con rể của bà Tịnh Giang.",
  }),
  makeMember({
    id: "r-sky", name: "Ông Sky", initials: "SK", generation: 4, birthYear: 1970,
    fatherId: "r-an-thu", motherId: "r-thien", role: "Cụnh cháu", avatarTone: "amber", email: "skys@nguyenvan.naol.cloud",
    bio: "Cụnh cháu của bà Anh Thư — Nguyễn Hữu Thiên.",
  }),
  makeMember({
    id: "r-candy", name: "Bà Candy", initials: "CD", gender: "female", generation: 4, birthYear: 1972,
    fatherId: "r-an-thu", motherId: "r-thien", role: "Cụnh cháu", avatarTone: "sage", email: "candyc@nguyenvan.naol.cloud",
    bio: "Cụnh cháu của bà Anh Thư — Nguyễn Hữu Thiên.",
  }),
  makeMember({
    id: "r-bingo", name: "Ông Bí Ngô", initials: "BN", generation: 4, birthYear: 1974,
    fatherId: "r-tinh-giang", motherId: "r-thuc", role: "Cụnh cháu", avatarTone: "amber", email: "ngob@nguyenvan.naol.cloud",
    bio: "Cụnh cháu của bà Tịnh Giang — Nguyễn Thục.",
  }),
  makeMember({
    id: "r-oanh", name: "Bà Nguyễn Thị Oanh", initials: "OA", gender: "female", generation: 2, birthYear: 1928,
    fatherId: "r-rinh", motherId: "r-quet", spouseId: "r-bon", role: "Con", avatarTone: "sage", email: "oanhnt@nguyenvan.naol.cloud",
    bio: "Con của tổ Rinh — Quệt, vợ ông Bốn (đã mất).",
  }),
  makeMember({
    id: "r-bon", name: "Ông Bốn", initials: "BO", generation: 2, birthYear: 1925, deathYear: 1990,
    isAlive: false, spouseId: "r-oanh", role: "Con rể (đã mất)", avatarTone: "slate", email: "bonb@nguyenvan.naol.cloud",
    bio: "Con rể của bà Oanh, đã qua đời.",
  }),
  makeMember({
    id: "r-nhut", name: "Nguyễn Minh Nhựt", initials: "NH", generation: 3, birthYear: 1952,
    fatherId: "r-oanh", motherId: "r-bon", spouseId: "r-yen", role: "Cháu", avatarTone: "amber", email: "nhutnm@nguyenvan.naol.cloud",
    bio: "Cháu của bà Oanh — ông Bốn, vợ Ngô Thị Yến.",
  }),
  makeMember({
    id: "r-yen", name: "Ngô Thị Yến", initials: "YE", gender: "female", generation: 3, birthYear: 1955,
    spouseId: "r-nhut", role: "Con dâu", avatarTone: "sage", email: "yennt2@nguyenvan.naol.cloud",
    bio: "Con dâu của Nguyễn Minh Nhựt.",
  }),
  makeMember({
    id: "r-bong", name: "Bà bống", initials: "BG", gender: "female", generation: 4, birthYear: 1978,
    fatherId: "r-nhut", motherId: "r-yen", role: "Cụnh cháu", avatarTone: "sage", email: "bongb@nguyenvan.naol.cloud",
    bio: "Cụnh cháu của Minh Nhựt — Ngô Thị Yến.",
  }),
  makeMember({
    id: "r-anh2", name: "Nguyễn Minh Ánh", initials: "AH", generation: 3, birthYear: 1950,
    fatherId: "r-oanh", motherId: "r-bon", spouseId: "r-diem", role: "Cháu", avatarTone: "amber", email: "anhnm@nguyenvan.naol.cloud",
    bio: "Cháu của bà Oanh — ông Bốn, vợ Nguyễn Thị Diễm.",
  }),
  makeMember({
    id: "r-diem", name: "Nguyễn Thị Diễm", initials: "DM", gender: "female", generation: 3, birthYear: 1953,
    spouseId: "r-anh2", role: "Con dâu", avatarTone: "sage", email: "diemnt@nguyenvan.naol.cloud",
    bio: "Con dâu của Nguyễn Minh Ánh.",
  }),
  makeMember({
    id: "r-mia", name: "Bà Mía", initials: "MI", gender: "female", generation: 4, birthYear: 1980,
    fatherId: "r-anh2", motherId: "r-diem", role: "Cụnh cháu", avatarTone: "sage", email: "miam@nguyenvan.naol.cloud",
    bio: "Cụnh cháu của Minh Ánh — Nguyễn Thị Diễm.",
  }),
  makeMember({
    id: "r-xuan-lieu", name: "Bà Đoàn Thị Xuân Liễu", initials: "XL", gender: "female", generation: 2, birthYear: 1930,
    spouseId: "van-thanh", role: "Con dâu", avatarTone: "wine", email: "lieudt@nguyenvan.naol.cloud",
    bio: "Con dâu của ông Nguyễn Văn Thành.",
  }),
  makeMember({
    id: "r-nguyen-thong", name: "Ông Nguyễn Văn Nguyên Thông", initials: "NT", generation: 3, birthYear: 1955,
    fatherId: "van-thanh", motherId: "r-xuan-lieu", spouseId: "r-chau-loan", role: "Cháu", avatarTone: "amber", email: "thongnv@nguyenvan.naol.cloud",
    bio: "Cháu của ông Thành — bà Xuân Liễu, vợ Huỳnh Thị Châu Loan.",
  }),
  makeMember({
    id: "r-chau-loan", name: "Bà Huỳnh Thị Châu Loan", initials: "CL", gender: "female", generation: 3, birthYear: 1958,
    spouseId: "r-nguyen-thong", role: "Con dâu", avatarTone: "sage", email: "loanht@nguyenvan.naol.cloud",
    bio: "Con dâu của ông Nguyên Thông.",
  }),
  makeMember({
    id: "r-minh-tri", name: "Ông Nguyễn Văn Minh Trí", initials: "MT", generation: 4, birthYear: 1982,
    fatherId: "r-nguyen-thong", motherId: "r-chau-loan", role: "Cụnh cháu", avatarTone: "amber", email: "trinv@nguyenvan.naol.cloud",
    bio: "Cụnh cháu của ông Nguyên Thông — bà Châu Loan.",
  }),
  makeMember({
    id: "r-kieu-trinh", name: "Bà Nguyễn Thị Kiều Trinh", initials: "KT", gender: "female", generation: 3, birthYear: 1957,
    fatherId: "van-thanh", motherId: "r-xuan-lieu", spouseId: "r-hieu", role: "Cháu", avatarTone: "sage", email: "trinhnt@nguyenvan.naol.cloud",
    bio: "Cháu của ông Thành — bà Xuân Liễu, vợ Huỳnh Văn Hiếu.",
  }),
  makeMember({
    id: "r-hieu", name: "Huỳnh Văn Hiếu", initials: "HE", generation: 3, birthYear: 1955,
    spouseId: "r-kieu-trinh", role: "Con rể", avatarTone: "wine", email: "hieuhv@nguyenvan.naol.cloud",
    bio: "Con rể của bà Kiều Trinh.",
  }),
  makeMember({
    id: "r-hung-anh", name: "Ông Huỳnh Nguyễn Hùng Anh", initials: "HA", generation: 4, birthYear: 1985,
    fatherId: "r-kieu-trinh", motherId: "r-hieu", role: "Cụnh cháu", avatarTone: "amber", email: "anhhn@nguyenvan.naol.cloud",
    bio: "Cụnh cháu của bà Kiều Trinh — Huỳnh Văn Hiếu.",
  }),
  makeMember({
    id: "r-cuc", name: "Bà Nguyễn Thị Cúc", initials: "CC", gender: "female", generation: 2, birthYear: 1932,
    fatherId: "r-rinh", motherId: "r-quet", spouseId: "r-tin", role: "Con", avatarTone: "sage", email: "cucnt@nguyenvan.naol.cloud",
    bio: "Con của tổ Rinh — Quệt, vợ ông Ngô Đức Tín.",
  }),
  makeMember({
    id: "r-tin", name: "Ông Ngô Đức Tín", initials: "TN", generation: 2, birthYear: 1930,
    spouseId: "r-cuc", role: "Con rể", avatarTone: "slate", email: "tinnd@nguyenvan.naol.cloud",
    bio: "Con rể của bà Cúc.",
  }),
  makeMember({
    id: "r-thinh", name: "Ông Ngô Đức Thịnh", initials: "TI", generation: 3, birthYear: 1958,
    fatherId: "r-cuc", motherId: "r-tin", role: "Cháu", avatarTone: "amber", email: "thinhnd@nguyenvan.naol.cloud",
    bio: "Cháu của bà Cúc — ông Ngô Đức Tín.",
  }),
  makeMember({
    id: "r-thao", name: "Ông Nguyễn Văn Thảo", initials: "TA", generation: 2, birthYear: 1935, deathYear: 1980,
    isAlive: false, fatherId: "r-rinh", motherId: "r-quet", role: "Con (đã mất)", avatarTone: "slate", email: "thaonv@nguyenvan.naol.cloud",
    bio: "Con của tổ Rinh — Quệt, đã qua đời.",
  }),
  makeMember({
    id: "r-thuan", name: "Ông Nguyễn Văn Thuận", initials: "TU", generation: 2, birthYear: 1938, deathYear: 1985,
    isAlive: false, fatherId: "r-rinh", motherId: "r-quet", role: "Con (đã mất)", avatarTone: "slate", email: "thuannv@nguyenvan.naol.cloud",
    bio: "Con của tổ Rinh — Quệt, đã qua đời.",
  }),
];

export const familySummary = {
  name: "Gia phả Họ Nguyễn — Chi 3",
  shortName: "Họ Nguyễn · Chi 3",
  totalMembers: familyMembers.length,
  totalGenerations: Math.max(...familyMembers.map((member) => member.generation)),
  lastUpdated: "28/08/2026",
};
