<?php

namespace Database\Seeders;

use App\Models\Family;
use App\Models\Prayer;
use App\Models\User;
use Illuminate\Database\Seeder;

class PrayerSeeder extends Seeder
{
    public function run(): void
    {
        $family = Family::query()->where('code', 'nguyen-chi-3')->firstOrFail();
        $author = User::query()->where('email', 'admin@gia-pha.local')->firstOrFail();
        $prayers = [
            ['Văn khấn Tết Nguyên Đán', 'tet', "Kính chào tổ tiên, cụ cố, tổ phụ!\nNgày Tết Nguyên Đán, con cháu cung kính bày lên lư hương, hoa quả, rượu, trà, bát cơm, nước và lễ vật tương vắt.\nNguyện cầu tổ tiên phù trì sức khỏe cho con cháu; gia đạo thuận hòa, trong ấm ngoài ơn, làm ăn phát đạt và mọi người an nhàn."],
            ['Văn khấn mùng 1 Tết', 'tet', "Kính lạy các cụ tổ, tổ phụ và các vị có công với dòng họ.\nMùng 1, con cháu họp mặt dâng hương, kính chúc tổ tiên mạnh khỏe, gia đạo an khang.\nChúng con nguyện cầu các cụ an nhàn, cả dòng họ tinh tiến và cả năm bình an."],
            ['Văn khấn giỗ tổ Họ Nguyễn', 'gio_to', "Đại biểu về dòng họ cùng toàn thể các chi, kính dâng lư hương, hoa, rượu, trà, bát cơm và lễ vật trước bàn thờ tổ.\nChúng con thành kính tưởng nhớ công ơn sinh thành dưỡng dục và giữ gìn phong tục tốt đẹp của dòng Nguyễn.\nKính mong các cụ chứng giám cho toàn dòng họ sức khỏe và phát đạt."],
            ['Văn khấn giỗ cụ hằng năm', 'gio_thuong', "Kính lễ các cụ tổ, tổ phụ và các vị đã khuất.\nHôm nay con cháu kính dâng lư hương, hoa quả, rượu, trà, bát cơm cùng lễ vật thành kính.\nChúng con nguyện cầu các cụ được an nhàn và phù hộ cho con cháu luôn an ổn."],
            ['Văn khấn khi tạo mộ', 'gio_thuong', "Kính tổ tiên, tổ phụ, các cụ và những vị đã khuất!\nHôm nay là ngày an táng, con cháu kính dâng lư hương, hoa, rượu, trà, bát cơm, quả và lễ vật.\nNguyện cầu các vị an tại nơi cõi nước, sớm sớm tịnh độ và gia đạo vẹn tròn."],
            ['Văn khấn lễ nhập trạch và nhập học', 'nhap_trach', "Kính chào tổ tiên, tổ phụ và các vị tiền hiền trong dòng họ!\nHôm nay là ngày nhập trạch hoặc nhập học, con cháu kính dâng lư hương, hoa quả, bát cơm và lễ vật.\nXin các cụ ban ơn cho người mới có thân xa nhà, sống khỏe mạnh và cát hóa."],
            ['Văn khấn chúc lành trong gia đình', 'khac', "Kính chào các cụ tổ, tổ phụ và các vị đã sáng suốt!\nTrong ngày vui vẻ, gia đình chúng con kính dâng lư hương, hoa quả, bát cơm, nước và rượu trà.\nNguyện cầu các cụ trời xuống lòng mà trời đứng lòng, giữ cho gia đạo an nhàn."],
        ];
        foreach ($prayers as [$title, $category, $content]) {
            Prayer::query()->updateOrCreate(['family_id' => $family->id, 'title' => $title], ['category' => $category, 'content' => $content, 'author_id' => $author->id]);
        }
    }
}
