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
  deathYear?: number;
  deathDateSolar?: string;
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
  phone: string;
  birthplace: string;
  address: string;
  bio: string;
  burialPlace?: string;
  burialMapUrl: string;
  homeMapUrl?: string;
  avatarUrl?: string;
  avatarTone: AvatarTone;
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
    id: "minh", name: "Nguyễn Văn Minh", initials: "NM", generation: 1, birthYear: 1898, deathYear: 1974,
    isAlive: false, birthLunar: "03 / 06 / 1898 âm lịch", deathLunar: "19 / 08 / 1974 âm lịch", spouseId: "sau",
    role: "Thủy Tổ", phone: "090 210 1898", birthplace: "Thôn Trung, Bắc Ninh", address: "Khu di tích gia tộc, Bắc Ninh", avatarTone: "wine",
    bio: "Ông là vị tổ đầu tiên được ghi nhận trong nhánh Chi 3 của Họ Nguyễn. Ông đã gìn giữ gia phạn, đứng ra bảo vệ và truyền tại cho các thế hệ sau.",
  }),
  makeMember({
    id: "sau", name: "Nguyễn Thị Sáu", initials: "NS", gender: "female", generation: 1, birthYear: 1902, deathYear: 1985,
    isAlive: false, birthLunar: "16 / 09 / 1902 âm lịch", deathLunar: "07 / 10 / 1985 âm lịch", spouseId: "minh", role: "Bà nội",
    phone: "Liên hệ qua Trưởng tộc", birthplace: "Bắc Ninh", address: "Khu di tích gia tộc, Bắc Ninh", avatarTone: "slate",
    bio: "Bà Sáu được nhắc đến với sự nhẫn nại và sự chăm sóc đối với cả dòng họ trong những năm đầu thế kỷ XX.",
  }),
  makeMember({
    id: "van-thanh", name: "Nguyễn Văn Thành", initials: "NT", generation: 2, birthYear: 1925, deathYear: 2001,
    isAlive: false, birthLunar: "11 / 01 / 1925 âm lịch", deathLunar: "23 / 12 / 2001 âm lịch", fatherId: "minh", motherId: "sau", spouseId: "nga",
    role: "Cụ", phone: "Liên hệ qua Trưởng tộc", avatarTone: "amber", bio: "Cụ Thành gắn bó với ruộng đồng và là người ghi nhớ nhiều thế hệ trong nhánh Chi 3.",
  }),
  makeMember({
    id: "nga", name: "Nguyễn Thị Nga", initials: "NN", gender: "female", generation: 2, birthYear: 1930, deathYear: 2008,
    isAlive: false, birthLunar: "21 / 04 / 1930 âm lịch", deathLunar: "05 / 11 / 2008 âm lịch", spouseId: "van-thanh", role: "Mẹ",
    phone: "Liên hệ qua Trưởng tộc", avatarTone: "sage", bio: "Bà Nga là người nội trưởng đầy cảm xúc, nổi tiếng với những mâm cúng đầy đủ vẻ của dòng họ.",
  }),
  makeMember({
    id: "duc", name: "Nguyễn Văn Đức", initials: "NĐ", generation: 2, birthYear: 1948, birthLunar: "08 / 02 / 1948 âm lịch",
    fatherId: "minh", motherId: "sau", spouseId: "hoa", role: "Trưởng tộc", phone: "090 330 1948", address: "Hoàng Kiếm, Hà Nội",
    avatarTone: "wine", bio: "Ông Đức là trưởng tộc đương thời, phụ trách đồng đạo, tổ chức giỗ cháp và bảo trì gia phả số của Chi 3.",
  }),
  makeMember({
    id: "hoa", name: "Nguyễn Thị Hoa", initials: "NH", gender: "female", generation: 2, birthYear: 1951, birthLunar: "27 / 05 / 1951 âm lịch",
    spouseId: "duc", role: "Phu nhân", phone: "091 330 1951", address: "Hoàng Kiếm, Hà Nội", avatarTone: "amber",
    bio: "Bà Hoa chăm lo nấu ăn cùng ban tổ chức, hỗ trợ các chương trình văn hóa và sinh hoạt gia đình của Chi 3.",
  }),
  makeMember({
    id: "dung", name: "Nguyễn Văn Dũng", initials: "ND", generation: 2, birthYear: 1942, deathYear: 2010,
    isAlive: false, birthLunar: "09 / 08 / 1942 âm lịch", deathLunar: "29 / 03 / 2010 âm lịch", fatherId: "minh", motherId: "sau", spouseId: "mai",
    role: "Cụ", phone: "Liên hệ qua Trưởng tộc", avatarTone: "slate", bio: "Cụ Dũng từng giữ vai trò thủ bổ trong nhánh họ trước khi sinh hoạt gia phả được số hóa.",
  }),
  makeMember({
    id: "mai", name: "Nguyễn Thị Mai", initials: "NM", gender: "female", generation: 2, birthYear: 1946, deathYear: 2016,
    isAlive: false, birthLunar: "02 / 11 / 1946 âm lịch", deathLunar: "16 / 04 / 2016 âm lịch", spouseId: "dung", role: "Thím",
    phone: "Liên hệ qua Trưởng tộc", avatarTone: "sage", bio: "Thím Mai luôn nhắc các cháu về cội nguồn và giữ gìn nếp nhà trong những ngày đầu xuân.",
  }),
  makeMember({
    id: "hien", name: "Nguyễn Văn Hiền", initials: "NH", generation: 3, birthYear: 1950, birthLunar: "04 / 03 / 1950 âm lịch",
    fatherId: "van-thanh", motherId: "nga", spouseId: "lien", role: "Trưởng chi", phone: "090 520 1950", address: "Bắc Ninh", avatarTone: "amber",
    bio: "Ông Hiền phụ trách nhánh Bắc Ninh, đồng hành cùng các anh em trong việc số hóa hình ảnh và sổ bội tưởng.",
  }),
  makeMember({
    id: "lien", name: "Nguyễn Thị Liên", initials: "NL", gender: "female", generation: 3, birthYear: 1954, birthLunar: "19 / 06 / 1954 âm lịch",
    spouseId: "hien", role: "Dâu", phone: "091 520 1954", address: "Bắc Ninh", avatarTone: "sage",
    bio: "Bà Liên nổi tiếng hiền lành, luôn sẵn lòng hỗ trợ công tác gia phả và việc gia đình của nhánh Chi 3.",
  }),
  makeMember({
    id: "thao", name: "Nguyễn Thị Thảo", initials: "NT", gender: "female", generation: 3, birthYear: 1956, birthLunar: "12 / 09 / 1956 âm lịch",
    fatherId: "van-thanh", motherId: "nga", role: "Dâu", phone: "090 610 1956", address: "Bắc Ninh", avatarTone: "slate",
    bio: "Chị Thảo là người đầu tiên trong thế hệ thứ ba gia nhập nhóm dùng chung để đóng góp dữ liệu gia phả.",
  }),
  makeMember({
    id: "hung", name: "Nguyễn Văn Hùng", initials: "NH", generation: 3, birthYear: 1971, birthLunar: "25 / 01 / 1971 âm lịch",
    fatherId: "duc", motherId: "hoa", spouseId: "huyen", role: "Trưởng chi", phone: "090 720 1971", address: "Hoàng Kiếm, Hà Nội", avatarTone: "wine",
    bio: "Anh Hùng kết nối thế hệ trẻ với truyền thống gia đình, đồng thời phụ trách gia phả số nhánh Hà Nội.",
  }),
  makeMember({
    id: "huyen", name: "Nguyễn Thị Huyền", initials: "NH", gender: "female", generation: 3, birthYear: 1975, birthLunar: "08 / 04 / 1975 âm lịch",
    spouseId: "hung", role: "Dâu", phone: "091 720 1975", address: "Hoàng Kiếm, Hà Nội", avatarTone: "amber",
    bio: "Chị Huyền là người đồng hành trong các chương trình sinh hoạt văn hóa của Họ Nguyễn Chi 3.",
  }),
  makeMember({
    id: "lan", name: "Nguyễn Thị Lan", initials: "NL", gender: "female", generation: 3, birthYear: 1978, birthLunar: "30 / 07 / 1978 âm lịch",
    fatherId: "duc", motherId: "hoa", role: "Dâu", phone: "090 820 1978", address: "Hà Nội", avatarTone: "sage",
    bio: "Chị Lan phụ trách chuyên mục album gia đình, giữ lại nhiều tấm ảnh quý của các thế hệ trước.",
  }),
  makeMember({
    id: "tuan", name: "Nguyễn Văn Tuấn", initials: "NT", generation: 3, birthYear: 1969, birthLunar: "17 / 11 / 1969 âm lịch",
    fatherId: "dung", motherId: "mai", spouseId: "thanh", role: "Trưởng chi", phone: "090 920 1969", address: "Hà Nội", avatarTone: "slate",
    bio: "Anh Tuấn thường xuyên tổ chức sinh hoạt cho các cháu nhỏ và hỗ trợ công tác nhắc ngày giỗ trong nhánh.",
  }),
  makeMember({
    id: "thanh", name: "Nguyễn Thị Thanh", initials: "NT", gender: "female", generation: 3, birthYear: 1972, birthLunar: "06 / 02 / 1972 âm lịch",
    spouseId: "tuan", role: "Dâu", phone: "091 920 1972", address: "Hà Nội", avatarTone: "wine",
    bio: "Chị Thanh có kinh nghiệm trong việc chuẩn bị nghi lễ, tụng kinh và hỗ trợ việc trang trí mâm cúng.",
  }),
  makeMember({
    id: "bao", name: "Nguyễn Gia Bảo", initials: "GB", generation: 4, birthYear: 1980, birthLunar: "22 / 08 / 1980 âm lịch",
    fatherId: "hien", motherId: "lien", role: "Cháu nội", phone: "091 080 1980", address: "Bắc Ninh", avatarTone: "amber",
    bio: "Bảo là thế hệ thứ tư tiếp nối truyền thống, đồng thời là người thử nghiệm các tính năng trên Gia Phả Online.",
  }),
  makeMember({
    id: "khai", name: "Nguyễn Gia Khải", initials: "GK", generation: 4, birthYear: 1983, birthLunar: "14 / 10 / 1983 âm lịch",
    fatherId: "hung", motherId: "huyen", role: "Cháu nội", phone: "091 180 1983", address: "Hà Nội", avatarTone: "sage",
    bio: "Khải đam mê công nghệ và đóng góp ý tưởng cho việc kết nối các chi nhánh trong gia tộc.",
  }),
  makeMember({
    id: "ngoc", name: "Nguyễn Gia Ngọc", initials: "GN", gender: "female", generation: 4, birthYear: 1990, birthLunar: "03 / 12 / 1990 âm lịch",
    fatherId: "hung", motherId: "huyen", role: "Cháu nội", phone: "091 280 1990", address: "Hà Nội", avatarTone: "slate",
    bio: "Ngọc là một trong những thành viên thế hệ trẻ tích cực đóng góp ảnh và kể chuyện về dòng họ.",
  }),
  makeMember({
    id: "anh", name: "Nguyễn Gia Anh", initials: "GA", generation: 4, birthYear: 1998, birthLunar: "15 / 05 / 1998 âm lịch",
    fatherId: "tuan", motherId: "thanh", role: "Cháu nội", phone: "091 380 1998", address: "Hà Nội", avatarTone: "wine",
    bio: "Anh họ trẻ của nhánh Hà Nội, luôn sẵn sàng hỗ trợ công việc ban quản trị gia phả.",
  }),
  makeMember({
    id: "huy", name: "Nguyễn Gia Huy", initials: "GH", generation: 5, birthYear: 2012, birthLunar: "28 / 03 / 2012 âm lịch",
    fatherId: "bao", role: "Cháu kế tục", phone: "Chưa cập nhật", address: "Bắc Ninh", avatarTone: "amber",
    bio: "Huy là thành viên nhỏ nhất trong bản gia phả hiện tại, được các cụ nhỏ yêu quý và nhắc nhở về cội nguồn.",
  }),
  makeMember({
    id: "nhi", name: "Nguyễn Gia Nhi", initials: "GN", gender: "female", generation: 5, birthYear: 2015, birthLunar: "09 / 06 / 2015 âm lịch",
    fatherId: "khai", role: "Cháu kế tục", phone: "Chưa cập nhật", address: "Hà Nội", avatarTone: "sage",
    bio: "Nhi là thế hệ thứ năm, thế hệ đang lớn lên cùng nền tảng số của gia tộc.",
  }),
  makeMember({
    id: "an", name: "Nguyễn Gia An", initials: "GA", gender: "female", generation: 5, birthYear: 2021, birthLunar: "21 / 09 / 2021 âm lịch",
    fatherId: "anh", role: "Cháu kế tục", phone: "Chưa cập nhật", address: "Hà Nội", avatarTone: "slate",
    bio: "An thuộc thế hệ thứ năm, được gia đình yêu thương và ghi nhận trong từng mốc trưởng thành.",
  }),
];

export const familySummary = {
  name: "Gia phả Họ Nguyễn — Chi 3",
  shortName: "Họ Nguyễn · Chi 3",
  totalMembers: familyMembers.length,
  totalGenerations: Math.max(...familyMembers.map((member) => member.generation)),
  lastUpdated: "28/08/2026",
};
