<?php

namespace App\Support;

use Carbon\CarbonImmutable;

/**
 * Thuật toán chuyển đổi âm lịch Việt Nam <-> dương lịch.
 *
 * Bảng LUNAR_INFO mã hoá tháng nhuận và độ dài tháng âm cho từng năm 1900-2100.
 * Mỗi phần tử là một số hex 16 bit:
 *   - 4 bit thấp (mask 0x000F) là tháng nhuận của năm (0 = không có tháng nhuận).
 *   - 12 bit cao (mask 0x10000 >> month) là độ dài tháng âm thứ month (1 = 30 ngày, 0 = 29 ngày).
 *   - Bit 0x10000 cho biết tháng nhuận có 30 ngày hay không.
 *
 * Ngày mốc: 1900-01-31 (dương) tương ứng 01/01/1900 (âm).
 *
 * Đây là nguồn quyết định duy nhất cho mọi nơi cần tính ngày âm: API calendar,
 * job nhắc giỗ và frontend đều phải đọc từ đây để không lệch nhau.
 */
final class LunarCalendar
{
    /** Năm âm nhỏ nhất có dữ liệu trong LUNAR_INFO. */
    public const MIN_YEAR = 1900;

    /** Năm âm lớn nhất có dữ liệu trong LUNAR_INFO. */
    public const MAX_YEAR = 2100;

    /** Ngày dương mốc tương ứng 01/01 âm. */
    private const EPOCH = '1900-01-31';

    /** @var array<int, int> */
    private const LUNAR_INFO = [
        0x04BD8, 0x04AE0, 0x0A570, 0x054D5, 0x0D260, 0x0D950, 0x16554, 0x056A0, 0x09AD0, 0x055D2,
        0x04AE0, 0x0A5B6, 0x0A4D0, 0x0D250, 0x1D255, 0x0B540, 0x0D6A0, 0x0ADA2, 0x095B0, 0x14977,
        0x04970, 0x0A4B0, 0x0B4B5, 0x06A50, 0x06D40, 0x1AB54, 0x02B60, 0x09570, 0x052F2, 0x04970,
        0x06566, 0x0D4A0, 0x0EA50, 0x06E95, 0x05AD0, 0x02B60, 0x186E3, 0x092E0, 0x1C8D7, 0x0C950,
        0x0D4A0, 0x1D8A6, 0x0B550, 0x056A0, 0x1A5B4, 0x025D0, 0x092D0, 0x0D2B2, 0x0A950, 0x0B557,
        0x06CA0, 0x0B550, 0x15355, 0x04DA0, 0x0A5B0, 0x14573, 0x052B0, 0x0A9A8, 0x0E950, 0x06AA0,
        0x0AEA6, 0x0AB50, 0x04B60, 0x0AAE4, 0x0A570, 0x05260, 0x0F263, 0x0D950, 0x05B57, 0x056A0,
        0x096D0, 0x04DD5, 0x04AD0, 0x0A4D0, 0x0D4D4, 0x0D250, 0x0D558, 0x0B540, 0x0B6A0, 0x195A6,
        0x095B0, 0x049B0, 0x0A974, 0x0A4B0, 0x0B27A, 0x06A50, 0x06D40, 0x0AF46, 0x0AB60, 0x09570,
        0x04AF5, 0x04970, 0x064B0, 0x074A3, 0x0EA50, 0x06B58, 0x055C0, 0x0AB60, 0x096D5, 0x092E0,
        0x0C960, 0x0D954, 0x0D4A0, 0x0DA50, 0x07552, 0x056A0, 0x0ABB7, 0x025D0, 0x092D0, 0x0CAB5,
        0x0A950, 0x0B4A0, 0x0BAA4, 0x0AD50, 0x055D9, 0x04BA0, 0x0A5B0, 0x15176, 0x052B0, 0x0A930,
        0x07954, 0x06AA0, 0x0AD50, 0x05B52, 0x04B60, 0x0A6E6, 0x0A4E0, 0x0D260, 0x0EA65, 0x0D530,
        0x05AA0, 0x076A3, 0x096D0, 0x04AFB, 0x04AD0, 0x0A4D0, 0x1D0B6, 0x0D250, 0x0D520, 0x0DD45,
        0x0B5A0, 0x056D0, 0x055B2, 0x049B0, 0x0A577, 0x0A4B0, 0x0AA50, 0x1B255, 0x06D20, 0x0ADA0,
        0x14B63, 0x09370, 0x049F8, 0x04970, 0x064B0, 0x168A6, 0x0EA50, 0x06AA0, 0x1A6C4, 0x0AAE0,
        0x0A2E0, 0x0D2E3, 0x0C960, 0x0D557, 0x0D4A0, 0x0DA50, 0x05D55, 0x056A0, 0x0A6D0, 0x055D4,
        0x052D0, 0x0A9B8, 0x0A950, 0x0B4A0, 0x0B6A6, 0x0AD50, 0x055A0, 0x0ABA4, 0x0A5B0, 0x052B0,
        0x0B273, 0x06930, 0x07337, 0x06AA0, 0x0AD50, 0x14B55, 0x04B60, 0x0A570, 0x054E4, 0x0D160,
        0x0E968, 0x0D520, 0x0DAA0, 0x16AA6, 0x056D0, 0x04AE0, 0x0A9D4, 0x0A2D0, 0x0D150, 0x0F252,
        0x0D520,
    ];

    private const MONTH_NAMES = [
        1 => 'Giêng', 2 => 'Hai', 3 => 'Ba', 4 => 'Tư', 5 => 'Năm', 6 => 'Sáu',
        7 => 'Bảy', 8 => 'Tám', 9 => 'Chín', 10 => 'Mười', 11 => 'Một', 12 => 'Chạp',
    ];

    /** Số ngày tính từ EPOCH (1900-01-31) tới ngày dương, dùng làm trục quét. */
    private static function offsetDays(\DateTimeInterface $solarDate): int
    {
        $utc = CarbonImmutable::createFromFormat(
            'Y-m-d H:i:s',
            $solarDate->format('Y-m-d').' 00:00:00',
            new \DateTimeZone('UTC'),
        );

        return (int) floor($utc->getTimestamp() / 86400);
    }

    private static function epoch(): CarbonImmutable
    {
        return new CarbonImmutable(self::EPOCH, new \DateTimeZone('UTC'));
    }

    public static function isSupportedYear(int $lunarYear): bool
    {
        return $lunarYear >= self::MIN_YEAR && $lunarYear <= self::MAX_YEAR;
    }

    private static function assertSupportedYear(int $lunarYear): void
    {
        if (! self::isSupportedYear($lunarYear)) {
            throw new \OutOfRangeException(
                "Năm âm {$lunarYear} nằm ngoài phạm vi hỗ trợ ".self::MIN_YEAR.'-'.self::MAX_YEAR.'.'
            );
        }
    }

    /** Tháng nhuận của năm âm (0 = không có tháng nhuận). */
    public static function leapMonth(int $lunarYear): int
    {
        self::assertSupportedYear($lunarYear);

        return self::LUNAR_INFO[$lunarYear - self::MIN_YEAR] & 0x000F;
    }

    /** Số ngày của tháng âm thứ n (1-12), không tính tháng nhuận. */
    public static function monthLength(int $lunarYear, int $lunarMonth): int
    {
        self::assertSupportedYear($lunarYear);
        if ($lunarMonth < 1 || $lunarMonth > 12) {
            throw new \InvalidArgumentException("Tháng âm phải từ 1 đến 12, nhận {$lunarMonth}.");
        }

        return (self::LUNAR_INFO[$lunarYear - self::MIN_YEAR] & (0x10000 >> $lunarMonth)) !== 0 ? 30 : 29;
    }

    /** Số ngày của tháng nhuận (29 hoặc 30). */
    public static function leapMonthLength(int $lunarYear): int
    {
        self::assertSupportedYear($lunarYear);

        return (self::LUNAR_INFO[$lunarYear - self::MIN_YEAR] & 0x10000) !== 0 ? 30 : 29;
    }

    /** Tổng số ngày của cả năm âm (tính kể cả tháng nhuận). */
    public static function yearLength(int $lunarYear): int
    {
        $total = 0;
        for ($month = 1; $month <= 12; $month++) {
            $total += self::monthLength($lunarYear, $month);
        }
        $leap = self::leapMonth($lunarYear);

        return $total + ($leap > 0 ? self::leapMonthLength($lunarYear) : 0);
    }

    /**
     * Chuyển ngày dương sang ngày âm.
     *
     * @return array{year:int,month:int,day:int,isLeapMonth:bool,monthName:string,dayLabel:string}
     */
    public static function toLunar(\DateTimeInterface $solarDate): array
    {
        $remaining = self::offsetDays($solarDate) - self::offsetDays(self::epoch());
        $year = self::MIN_YEAR;
        while ($year <= self::MAX_YEAR) {
            $length = self::yearLength($year);
            if ($remaining < $length) {
                break;
            }
            $remaining -= $length;
            $year++;
        }
        self::assertSupportedYear($year);

        $leap = self::leapMonth($year);
        $isLeapMonth = false;
        $month = 1;
        while ($month <= 12) {
            // Khi đang ở trong tháng nhuận thì độ dài lấy của tháng nhuận, ngược lại
            // lấy độ dài tháng thường cùng số thứ.
            $length = $isLeapMonth ? self::leapMonthLength($year) : self::monthLength($year, $month);
            if ($remaining < $length) {
                break;
            }
            $remaining -= $length;
            // Gặp tháng nhuận thì quét tiếp chính số thứ đó với độ dài tháng nhuận,
            // chỉ sang tháng kế tiếp sau khi đã đi hết tháng nhuận.
            if ($leap > 0 && $month === $leap && ! $isLeapMonth) {
                $isLeapMonth = true;
            } else {
                $isLeapMonth = false;
                $month++;
            }
        }

        return self::describe($remaining + 1, $month, $year, $isLeapMonth);
    }

    /**
     * Chuyển ngày âm sang ngày dương.
     *
     * Trả về null khi năm không có trong bảng dữ liệu, hoặc ngày không tồn tại trong
     * tháng đó (ví dụ ngày 30 của một tháng chỉ có 29 ngày), hoặc yêu cầu tháng nhuận
     * trong khi năm đó không có tháng nhuận tương ứng.
     */
    public static function toSolar(int $lunarDay, int $lunarMonth, int $lunarYear, bool $isLeapMonth = false): ?CarbonImmutable
    {
        if (! self::isSupportedYear($lunarYear)) {
            return null;
        }

        $leap = self::leapMonth($lunarYear);
        if ($isLeapMonth && $leap !== $lunarMonth) {
            return null;
        }

        // offset là số ngày TƯƠNG ĐỐI kể từ EPOCH, nên phải khởi tạo bằng 0.
        // (offsetDays() trả về số ngày tuyệt đối tính từ 1970 nên không dùng ở đây.)
        $offset = 0;
        for ($year = self::MIN_YEAR; $year < $lunarYear; $year++) {
            $offset += self::yearLength($year);
        }

        // Thứ tự trong năm âm: ... tháng N thường, tháng N nhuận (nếu có), tháng N+1 thường ...
        // Vì vậy offset luôn trỏ tới NGÀY ĐẦU của tháng thường đang duyệt; đầu tháng
        // nhuận nằm sau đúng monthLength() ngày của tháng thường cùng số.
        for ($month = 1; $month <= 12; $month++) {
            if ($month === $lunarMonth && ! $isLeapMonth) {
                return self::atOffset($offset, $lunarDay, self::monthLength($lunarYear, $month));
            }
            if ($month === $lunarMonth && $leap === $lunarMonth) {
                return self::atOffset(
                    $offset + self::monthLength($lunarYear, $month),
                    $lunarDay,
                    self::leapMonthLength($lunarYear),
                );
            }

            $offset += self::monthLength($lunarYear, $month);
            if ($leap > 0 && $month === $leap) {
                $offset += self::leapMonthLength($lunarYear);
            }
        }

        return null;
    }

    /** Ngày thứ $day của một khối ngày bắt đầu tại $offset ngày kể từ EPOCH. */
    private static function atOffset(int $offset, int $day, int $length): ?CarbonImmutable
    {
        if ($day < 1 || $day > $length) {
            return null;
        }

        return self::epoch()->modify('+'.($offset + $day - 1).' days');
    }

    /**
     * Ngày dương của lần giỗ/sinh nhật rơi vào một năm dương cụ thể.
     *
     * Giỗ và sinh nhật theo âm lặp lại hằng năm nhưng ngày dương thay đổi theo lịch âm,
     * nên không thể lưu một `solar_date` cố định cho mọi năm. Đây là nơi duy nhất quyết
     * định "lần giỗ của năm dương N", dùng chung cho API calendar và job nhắc giỗ.
     *
     * Quét cả năm âm N-1, N và N+1 vì một năm dương có thể chứa ngày thuộc hai năm âm
     * khác nhau (ví dụ dương 2024 bắt đầu bằng vài ngày cuối của âm 2023).
     */
    public static function anniversaryInYear(
        int $lunarDay,
        int $lunarMonth,
        int $solarYear,
        bool $isLeapMonth = false,
    ): ?CarbonImmutable {
        foreach ([$solarYear - 1, $solarYear, $solarYear + 1] as $lunarYear) {
            if (! self::isSupportedYear($lunarYear)) {
                continue;
            }
            $solar = self::toSolar($lunarDay, $lunarMonth, $lunarYear, $isLeapMonth);
            if ($solar instanceof CarbonImmutable && (int) $solar->format('Y') === $solarYear) {
                return $solar;
            }
        }

        return null;
    }

    /**
     * Lần giỗ sắp tới kể từ một ngày dương (bao gồm cả chính ngày đó).
     *
     * Quét tối đa 4 năm âm liên tiếp quanh năm hiện tại để chịu được cả trường hợp
     * ngày giỗ rơi vào ngày 30 của tháng chỉ có 29 ngày ở một năm (ngày đó không tồn tại,
     * cần chờ tới năm sau).
     */
    public static function nextAnniversary(
        int $lunarDay,
        int $lunarMonth,
        \DateTimeInterface $from,
        bool $isLeapMonth = false,
    ): ?CarbonImmutable {
        $fromDate = CarbonImmutable::createFromFormat(
            'Y-m-d H:i:s',
            $from->format('Y-m-d').' 00:00:00',
            new \DateTimeZone($from->getTimezone()->getName()),
        );
        $fromYear = (int) $fromDate->format('Y');

        // Quét tới 4 năm âm liên tiếp quanh năm hiện tại: mùng 30 có thể vắng mặt ở
        // nhiều năm liên tiếp (tháng 29 ngày), nên cần đủ phạm vi để chắc chắn tìm thấy
        // ít nhất một lần giỗ trong tương lai gần.
        for ($lunarYear = $fromYear - 1; $lunarYear <= $fromYear + 4; $lunarYear++) {
            $solar = self::toSolar($lunarDay, $lunarMonth, $lunarYear, $isLeapMonth);
            if ($solar instanceof CarbonImmutable && $solar >= $fromDate) {
                return $solar;
            }
        }

        return null;
    }

    /**
     * Nhãn tiếng Việt của ngày âm: "Mùng 1", "Rằm", "Mùng 29"…
     */
    public static function dayLabel(int $day): string
    {
        return match ($day) {
            1 => 'Mùng 1', 2 => 'Mùng 2', 3 => 'Mùng 3', 4 => 'Mùng 4',
            5 => 'Mùng 5', 6 => 'Mùng 6', 7 => 'Mùng 7', 8 => 'Mùng 8',
            9 => 'Mùng 9', 10 => 'Mùng 10', 11 => 'Mùng 11', 12 => 'Mùng 12',
            13 => 'Mùng 13', 14 => 'Mùng 14', 15 => 'Rằm',
            16 => 'Mùng 16', 17 => 'Mùng 17', 18 => 'Mùng 18', 19 => 'Mùng 19',
            20 => 'Mùng 20', 21 => 'Mùng 21', 22 => 'Mùng 22', 23 => 'Mùng 23',
            24 => 'Mùng 24', 25 => 'Mùng 25', 26 => 'Mùng 26', 27 => 'Mùng 27',
            28 => 'Mùng 28', 29 => 'Mùng 29', 30 => 'Mùng 30',
            default => 'Ngày '.$day,
        };
    }

    /** Tên tháng âm: "Giêng", "Bảy", "Chạp"; tháng nhuận thêm tiền tố nhuận. */
    public static function monthName(int $month, bool $isLeapMonth = false): string
    {
        $name = self::MONTH_NAMES[$month] ?? (string) $month;

        return $isLeapMonth ? $name.' nhuận' : $name;
    }

    /** Định dạng ngày chuẩn để so sánh/lưu trữ. */
    public static function toDateKey(\DateTimeInterface $date): string
    {
        return $date->format('Y-m-d');
    }

    /**
     * @return array{year:int,month:int,day:int,isLeapMonth:bool,monthName:string,dayLabel:string}
     */
    private static function describe(int $day, int $month, int $year, bool $isLeapMonth): array
    {
        return [
            'year' => $year,
            'month' => $month,
            'day' => $day,
            'isLeapMonth' => $isLeapMonth,
            'monthName' => self::monthName($month, $isLeapMonth),
            'dayLabel' => self::dayLabel($day),
        ];
    }
}
