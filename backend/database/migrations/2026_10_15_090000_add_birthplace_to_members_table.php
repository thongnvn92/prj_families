<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Thêm cột `birthplace` (Quê quán) cho bảng members.
 *
 * `address` là nơi ở/địa chỉ liên hệ hiện tại, còn quê quán là nơi sinh ra và
 * lớn lôn của người đó (thôn/xã, huyện, tỉnh) — hai khái niệm khác nhau trong
 * gia phả. Hồ sơ cá nhân và hồ sơ thành viên ưu tiên hiển thị quê quán nên cần
 * cột riêng thay vì dùng chung `address`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->string('birthplace', 255)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->dropColumn('birthplace');
        });
    }
};
