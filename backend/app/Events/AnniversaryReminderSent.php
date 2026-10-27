<?php

namespace App\Events;

use App\Models\LunarEvent;
use App\Models\User;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Nhắc giỗ trong ứng dụng, gửi tới channel nền riêng của từng tài khoản trong dòng họ.
 *
 * Job `RemindUpcomingAnniversaries` phát event này; frontend subscribe channel
 * `private-users.{id}` nên nhận được mà không cần SMS/Zalo.
 */
class AnniversaryReminderSent implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public LunarEvent $event,
        public string $solarDate,
        public string $lunarLabel,
        public int $daysRemaining,
    ) {}

    /**
     * @return list<PrivateChannel>
     */
    public function broadcastOn(): array
    {
        $familyId = $this->event->member?->family_id;
        if ($familyId === null) {
            return [];
        }

        return User::query()
            ->where('family_id', $familyId)
            ->pluck('id')
            ->map(fn (int $userId): PrivateChannel => new PrivateChannel('users.'.$userId))
            ->all();
    }

    public function broadcastAs(): string
    {
        return 'anniversary.reminder';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'event_id' => $this->event->id,
            'member_name' => $this->event->member?->full_name,
            'event_type' => $this->event->event_type,
            'solar_date' => $this->solarDate,
            'lunar_label' => $this->lunarLabel,
            'days_remaining' => $this->daysRemaining,
            'burial_place' => $this->event->burial_place,
            'organizer' => $this->event->organizer,
        ];
    }
}
