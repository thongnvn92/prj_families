<?php

namespace Tests\Unit;

use App\Support\Zodiac;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class ZodiacTest extends TestCase
{
    /**
     * Can - chi là kiến thức lịch sử cố định, kiểm chứng độc lập với bảng LUNAR_INFO.
     * Mốc gốc của thuật toán là năm 4 TCN = Giáp Tý, nhưng bảng âm lịch chỉ hỗ trợ
     * 1900-2100 nên các ca kiểm thứng nằm trong phạm vi đó.
     *
     * @return list<array{0:int,1:string,2:string}>
     */
    public static function knownYears(): array
    {
        return [
            '1900' => [1900, 'Canh Tý', 'Chuột'],
            '1932' => [1932, 'Nhâm Thân', 'Khỉ'],
            '1962' => [1962, 'Nhâm Dần', 'Hổ'],
            '1968' => [1968, 'Mậu Thân', 'Khỉ'],
            '1984' => [1984, 'Giáp Tý', 'Chuột'],
            '2024' => [2024, 'Giáp Thìn', 'Rồng'],
            '2100' => [2100, 'Canh Thân', 'Khỉ'],
        ];
    }

    #[DataProvider('knownYears')]
    public function test_returns_the_can_chi_label_of_a_lunar_year(int $year, string $label, string $animal): void
    {
        $this->assertSame($label, Zodiac::label($year));
        $this->assertSame($animal, Zodiac::animal($year));
        $this->assertSame($label.' ('.$animal.')', Zodiac::describe($year));
    }

    public function test_can_chi_repeats_every_sixty_years(): void
    {
        $this->assertSame(Zodiac::label(1962), Zodiac::label(1962 + 60));
        $this->assertSame(Zodiac::label(2024), Zodiac::label(2024 - 60));
        $this->assertNotSame(Zodiac::label(1962), Zodiac::label(1963));
    }

    public function test_returns_null_outside_the_supported_lunar_range_or_without_a_year(): void
    {
        $this->assertNull(Zodiac::label(null));
        $this->assertNull(Zodiac::animal(null));
        $this->assertNull(Zodiac::describe(null));
        $this->assertNull(Zodiac::label(1899));
        $this->assertNull(Zodiac::label(2101));
    }
}
