<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lịch sử đã nhắc giỗ, dùng để job chạy hằng ngày (hoặc mỗi phút qua cron) mà không
 * gửi trùng cho cùng một sự kiện + ngày giỗ.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('anniversary_reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lunar_event_id')->constrained('lunar_events')->cascadeOnDelete();
            // Ngày dương của lần giỗ đã nhắc, không phải ngày chạy job.
            $table->date('reminded_for');
            $table->timestamp('reminded_at');
            $table->unsignedInteger('recipients_count')->default(0);

            $table->timestamps();

            // Chặn gửi trùng cho cùng một sự kiện trong cùng ngày giỗ.
            $table->unique(['lunar_event_id', 'reminded_for']);
            $table->index('reminded_for');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('anniversary_reminders');
    }
};
