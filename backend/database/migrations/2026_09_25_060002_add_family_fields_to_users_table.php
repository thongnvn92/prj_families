<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone', 30)->nullable()->after('password');
            $table->enum('role', ['admin', 'mod', 'editor', 'member', 'guest'])->default('member')->after('phone');
            $table->foreignId('member_id')->nullable()->after('role')->constrained('members')->nullOnDelete();
            $table->foreignId('family_id')->nullable()->after('member_id')->constrained()->nullOnDelete();
            $table->foreignId('managed_root_member_id')->nullable()->after('family_id')->constrained('members')->nullOnDelete();
            $table->index(['family_id', 'role'], 'users_family_role_idx');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['member_id']);
            $table->dropForeign(['family_id']);
            $table->dropForeign(['managed_root_member_id']);
            $table->dropIndex('users_family_role_idx');
            $table->dropColumn(['phone', 'role', 'member_id', 'family_id', 'managed_root_member_id']);
        });
    }
};
