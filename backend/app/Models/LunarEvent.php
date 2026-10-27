<?php

namespace App\Models;

use App\Enums\LunarEventType;
use App\Support\LunarCalendar;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LunarEvent extends Model
{
    use HasFactory;

    /**
     * Lần giỗ (hoặc sinh nhật) sắp tới kể từ một ngày.
     *
     * Ngày giỗ theo âm lặp lại hằng năm nhưng ngày dương thay đổi, nên cột
     * `solar_date` chỉ là ngày dương tương ứng tại thời điểm tạo bản ghi. Mọi nơi
     * cần ngày giỗ thật (API calendar, job nhắc giỗ) đều gọi hàm này để không lệch nhau.
     */
    public function nextOccurrence(?\DateTimeInterface $from = null): ?\DateTimeImmutable
    {
        return LunarCalendar::nextAnniversary(
            (int) $this->lunar_day,
            (int) $this->lunar_month,
            $from ?? now(),
        );
    }

    /**
     * Ngày giỗ rơi vào một năm dương cụ thể, dùng khi xem lịch theo tháng/năm.
     */
    public function occurrenceInYear(int $solarYear): ?\DateTimeImmutable
    {
        return LunarCalendar::anniversaryInYear((int) $this->lunar_day, (int) $this->lunar_month, $solarYear);
    }

    protected $fillable = [
        'member_id', 'event_type', 'lunar_day', 'lunar_month', 'lunar_year',
        'solar_date', 'burial_place', 'organizer',
    ];

    protected function casts(): array
    {
        return [
            'event_type' => LunarEventType::class,
            'solar_date' => 'date',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function dutyRegistrations(): HasMany
    {
        return $this->hasMany(EventDutyRegistration::class, 'event_id');
    }
}
