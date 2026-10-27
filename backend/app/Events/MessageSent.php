<?php

namespace App\Events;

use App\Models\ChatMessage;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(public ChatMessage $message) {}

    public function broadcastOn(): array
    {
        /*
         * Phát tới channel của nhóm (màn hình đang mở) và channel nền riêng của từng
         * thành viên (bộ đếm tin chưa đọc). Payload giống nhau cho mọi người nhận, nên
         * không cần gửi từng bản riêng — Reverb/Pusher tự chỉ định theo từng channel.
         * Người nhận đều là thành viên trong nhóm nên không rò rỉ dữ liệu ra ngoài.
         */
        $memberChannels = $this->message->group
            ->members()
            ->pluck('users.id')
            ->map(fn (int $userId): PrivateChannel => new PrivateChannel('users.'.$userId))
            ->all();

        return [new PrivateChannel('chat-groups.'.$this->message->group_id), ...$memberChannels];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    public function broadcastWith(): array
    {
        return ['message' => [
            'id' => $this->message->id,
            'group_id' => $this->message->group_id,
            'sender_id' => $this->message->sender_id,
            'sender_name' => $this->message->sender?->name,
            'sender_role' => $this->message->sender?->role,
            'message_text' => $this->message->message_text,
            'image_url' => $this->message->image_url,
            'created_at' => $this->message->created_at?->toIso8601String(),
        ]];
    }
}
