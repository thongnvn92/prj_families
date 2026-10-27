<?php

namespace Tests\Unit;

use App\Support\LunarCalendar;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class LunarCalendarTest extends TestCase
{
    /**
     * Ngày Tết và Rằm thực tế — mốc kiểm chứng độc lập với bảng LUNAR_INFO.
     *
     * @return list<array{0:string,1:int,2:int,3:int}>
     */
    public static function knownDates(): array
    {
        return [
            'Tết 1900' => ['1900-01-31', 1, 1, 1900],
            'Tết 2020' => ['2020-01-25', 1, 1, 2020],
            'Tết 2021' => ['2021-02-12', 1, 1, 2021],
            'Tết 2022' => ['2022-02-01', 1, 1, 2022],
            'Tết 2023' => ['2023-01-22', 1, 1, 2023],
            'Tết 2024' => ['2024-02-10', 1, 1, 2024],
            'Tết 2025' => ['2025-01-29', 1, 1, 2025],
            'Tết 2026' => ['2026-02-17', 1, 1, 2026],
            'Tết 2030' => ['2030-02-03', 1, 1, 2030],
            'Tết 2035' => ['2035-02-08', 1, 1, 2035],
            'Rằm tháng Giêng 2024' => ['2024-02-24', 15, 1, 2024],
            'Rằm tháng Giêng 2025' => ['2025-02-12', 15, 1, 2025],
            'Ngày 29 tháng Chạp âm 2025' => ['2026-02-16', 29, 12, 2025],
        ];
    }

    #[DataProvider('knownDates')]
    public function test_converts_known_solar_dates_to_lunar(string $solar, int $day, int $month, int $year): void
    {
        $lunar = LunarCalendar::toLunar(new \DateTimeImmutable($solar));

        $this->assertSame($day, $lunar['day']);
        $this->assertSame($month, $lunar['month']);
        $this->assertSame($year, $lunar['year']);
    }

    #[DataProvider('knownDates')]
    public function test_converts_lunar_dates_back_to_the_same_solar_date(string $solar, int $day, int $month, int $year): void
    {
        $result = LunarCalendar::toSolar($day, $month, $year);

        $this->assertNotNull($result);
        $this->assertSame($solar, $result->format('Y-m-d'));
    }

    /**
     * Bảo đảm hai chiều khớp nhau trên toàn bộ 50 năm, bao gồm các năm có tháng
     * nhuận — bảo vệ chống lỗi lệch 1 tháng hoặc 1 năm trong thuật toán.
     */
    public function test_roundtrip_is_stable_for_fifty_years(): void
    {
        $checked = 0;
        for ($year = 2000; $year <= 2050; $year++) {
            for ($month = 1; $month <= 12; $month++) {
                for ($day = 1; $day <= 30; $day++) {
                    $solar = LunarCalendar::toSolar($day, $month, $year);
                    if (! $solar instanceof \DateTimeImmutable) {
                        // Ngày không tồn tại (ví dụ mùng 30 của tháng chỉ có 29 ngày).
                        continue;
                    }
                    $checked++;
                    $back = LunarCalendar::toLunar($solar);
                    $this->assertSame(
                        [$day, $month, $year],
                        [$back['day'], $back['month'], $back['year']],
                        "Vòng lặp đảo sai tại {$day}/{$month}/{$year} ({$solar->format('Y-m-d')})."
                    );
                }
            }
        }

        $this->assertGreaterThan(18_000, $checked, 'Số ngày kiểm tra phải đủ lớn để bao phủ cả tháng nhuận.');
    }

    public function test_returns_null_for_a_day_that_does_not_exist_in_that_month(): void
    {
        // Tháng Chạp âm 2025 chỉ có 29 ngày nên mùng 30 không tồn tại.
        $this->assertSame(29, LunarCalendar::monthLength(2025, 12));
        $this->assertNull(LunarCalendar::toSolar(30, 12, 2025));
        $this->assertInstanceOf(\DateTimeImmutable::class, LunarCalendar::toSolar(29, 12, 2025));
    }

    public function test_returns_null_for_a_leap_month_request_when_year_has_no_such_leap_month(): void
    {
        // Năm âm 2024 không có tháng nhuận.
        $this->assertSame(0, LunarCalendar::leapMonth(2024));
        $this->assertNull(LunarCalendar::toSolar(1, 5, 2024, true));
    }

    public function test_leap_month_sorts_after_its_regular_month(): void
    {
        // 2020 có tháng 4 nhuận; tháng nhuận phải nằm ngay sau tháng 4 thường.
        $this->assertSame(4, LunarCalendar::leapMonth(2020));

        $regular = LunarCalendar::toSolar(1, 4, 2020);
        $leap = LunarCalendar::toSolar(1, 4, 2020, true);
        $this->assertInstanceOf(\DateTimeImmutable::class, $regular);
        $this->assertInstanceOf(\DateTimeImmutable::class, $leap);
        $this->assertSame(
            LunarCalendar::monthLength(2020, 4),
            (int) $regular->diff($leap)->format('%r%a'),
            'Tháng nhuận phải cách tháng thường đúng số ngày của tháng thường.'
        );
    }

    public function test_converts_leap_month_dates_both_ways(): void
    {
        $leap = LunarCalendar::toSolar(15, 4, 2020, true);
        $this->assertInstanceOf(\DateTimeImmutable::class, $leap);

        $back = LunarCalendar::toLunar($leap);
        $this->assertSame(4, $back['month']);
        $this->assertSame(15, $back['day']);
        $this->assertTrue($back['isLeapMonth']);
        $this->assertSame('Tư nhuận', $back['monthName']);
    }

    public function test_rejects_years_outside_the_supported_range(): void
    {
        $this->assertTrue(LunarCalendar::isSupportedYear(1900));
        $this->assertTrue(LunarCalendar::isSupportedYear(2100));
        $this->assertFalse(LunarCalendar::isSupportedYear(1899));
        $this->assertFalse(LunarCalendar::isSupportedYear(2101));

        $this->assertNull(LunarCalendar::toSolar(1, 1, 1899));
        $this->assertNull(LunarCalendar::toSolar(1, 1, 2101));
        $this->expectException(\OutOfRangeException::class);
        LunarCalendar::yearLength(2200);
    }

    public function test_anniversary_in_year_keeps_the_same_lunar_date_across_years(): void
    {
        // Giỗ 19/8 âm rơi vào ngày dương khác nhau mỗi năm, nhưng ngày âm phải giữ nguyên.
        $in2026 = LunarCalendar::anniversaryInYear(19, 8, 2026);
        $in2027 = LunarCalendar::anniversaryInYear(19, 8, 2027);
        $this->assertInstanceOf(\DateTimeImmutable::class, $in2026);
        $this->assertInstanceOf(\DateTimeImmutable::class, $in2027);
        $this->assertSame(2026, (int) $in2026->format('Y'));
        $this->assertSame(2027, (int) $in2027->format('Y'));
        $this->assertNotSame($in2026->format('m-d'), $in2027->format('m-d'));

        foreach ([$in2026, $in2027] as $solar) {
            $lunar = LunarCalendar::toLunar($solar);
            $this->assertSame(19, $lunar['day']);
            $this->assertSame(8, $lunar['month']);
        }
    }

    public function test_next_anniversary_is_on_or_after_the_given_date(): void
    {
        $from = new \DateTimeImmutable('2026-01-01');
        $next = LunarCalendar::nextAnniversary(1, 1, $from);
        $this->assertInstanceOf(\DateTimeImmutable::class, $next);
        $this->assertGreaterThanOrEqual($from, $next);

        // Gọi từ đúng ngày giỗ thì trả về chính ngày đó, không nhảy sang năm sau.
        $sameDay = LunarCalendar::nextAnniversary(1, 1, $next);
        $this->assertSame($next->format('Y-m-d'), $sameDay?->format('Y-m-d'));

        // Mùng 30 tháng Chạp âm 2025 không tồn tại nên phải chờ sang năm sau.
        $next30 = LunarCalendar::nextAnniversary(30, 12, new \DateTimeImmutable('2025-12-01'));
        $this->assertInstanceOf(\DateTimeImmutable::class, $next30);
        $this->assertGreaterThan(2025, (int) $next30->format('Y'));
    }

    public function test_exposes_vietnamese_labels(): void
    {
        $this->assertSame('Mùng 1', LunarCalendar::dayLabel(1));
        $this->assertSame('Rằm', LunarCalendar::dayLabel(15));
        $this->assertSame('Mùng 29', LunarCalendar::dayLabel(29));
        $this->assertSame('Giêng', LunarCalendar::monthName(1));
        $this->assertSame('Chạp', LunarCalendar::monthName(12));
        $this->assertSame('Bảy nhuận', LunarCalendar::monthName(7, true));
    }
}
