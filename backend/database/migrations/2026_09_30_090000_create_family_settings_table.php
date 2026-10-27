<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Cấu hình tính năng theo từng dòng họ. Admin (Trưởng Tộc) dùng bảng này để
     * bật/tắt Trò chuyện nội bộ và chọn vai trò được đưa hình ảnh lên hệ thống.
     */
    public function up(): void
    {
        Schema::create('family_settings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('family_id')->unique()->constrained()->cascadeOnDelete();
            $table->boolean('chat_enabled')->default(true);
            // JSON array các role được phép upload ảnh: admin/mod/editor/member.
            $table->json('image_upload_roles');
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('family_settings');
    }
};
