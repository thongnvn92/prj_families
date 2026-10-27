<?php

namespace App\Support;

/**
 * Can - chi (con giáp) của một năm âm, ví dụ năm 1962 là "Nhâm Dần" (Dần = hổ).
 *
 * Mốc gốc: năm 4 (năm 4 TCN) là năm Giáp Tý, tức đồng thời là can đầu tiên của
 * chu kỳ 10 can và chi đầu tiên của chu kỳ 12 chi. Vì vậy can = (năm - 4) % 10 và
 * chi = (năm - 4) % 12; chu kỳ chung là 60 năm nên tự lặp lại đúng sau 60 năm.
 *
 * Con giáp tính theo NĂM ÂM (năm của lễ Tết), không phải năm dương: sinh trong
 * tháng 1-2 dương có thể rơi vào năm âm trước đó. Vì vậy nơi gọi hàm này phải
 * truyền năm âm (`birth_year_lunar`), hoặc suy ra năm âm từ ngày dương bằng
 * {@see LunarCalendar::toLunar()} — không đoán bằng năm dương.
 */
final class Zodiac
{
    private const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];

    private const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

    private const ANIMALS = ['Chuột', 'Trâu', 'Hổ', 'Thỏ', 'Rồng', 'Rắn', 'Ngựa', 'Dê', 'Khỉ', 'Gà', 'Chó', 'Lợn'];

    /** Năm 4 TCN = Giáp Tý: gốc chung của cả chu kỳ 10 can và 12 chi. */
    private const EPOCH_YEAR = 4;

    /**
     * Nhãn can - chi, ví dụ "Nhâm Dần". Trả null khi không có năm âm hoặc năm
     * nằm ngoài phạm vi bảng âm lịch (xem LunarCalendar::MIN_YEAR/MAX_YEAR).
     */
    public static function label(?int $lunarYear): ?string
    {
        if ($lunarYear === null || ! LunarCalendar::isSupportedYear($lunarYear)) {
            return null;
        }

        return self::CAN[self::cycleIndex($lunarYear, 10)].' '.self::CHI[self::cycleIndex($lunarYear, 12)];
    }

    /** Con vật ứng với chi, ví dụ "Hổ". */
    public static function animal(?int $lunarYear): ?string
    {
        if ($lunarYear === null || ! LunarCalendar::isSupportedYear($lunarYear)) {
            return null;
        }

        return self::ANIMALS[self::cycleIndex($lunarYear, 12)];
    }

    /** Nhãn đầy đủ dùng cho màn hình hồ sơ: "Nhâm Dần (Hổ)". */
    public static function describe(?int $lunarYear): ?string
    {
        $label = self::label($lunarYear);
        if ($label === null) {
            return null;
        }

        return $label.' ('.self::animal($lunarYear).')';
    }

    private static function cycleIndex(int $year, int $cycleLength): int
    {
        // Năm trong phạm vi 1900-2100 luôn lớn hơn EPOCH_YEAR nên phép % không âm.
        return ($year - self::EPOCH_YEAR) % $cycleLength;
    }
}
