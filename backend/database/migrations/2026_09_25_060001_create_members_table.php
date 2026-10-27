<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('family_id')->constrained()->cascadeOnDelete();
            $table->string('full_name');
            $table->string('nickname')->nullable();
            $table->string('role')->default('Thành viên');
            $table->enum('gender', ['male', 'female', 'other'])->default('other');
            $table->unsignedBigInteger('father_id')->nullable();
            $table->unsignedBigInteger('mother_id')->nullable();
            $table->unsignedBigInteger('spouse_id')->nullable();
            $table->unsignedSmallInteger('generation')->default(1);
            $table->unsignedSmallInteger('order_in_family')->nullable();
            $table->boolean('is_alive')->default(true);
            $table->date('birth_date_solar')->nullable();
            $table->unsignedTinyInteger('birth_day_lunar')->nullable();
            $table->unsignedTinyInteger('birth_month_lunar')->nullable();
            $table->smallInteger('birth_year_lunar')->nullable();
            $table->date('death_date_solar')->nullable();
            $table->unsignedTinyInteger('death_day_lunar')->nullable();
            $table->unsignedTinyInteger('death_month_lunar')->nullable();
            $table->smallInteger('death_year_lunar')->nullable();
            $table->string('burial_place')->nullable();
            $table->text('burial_map_url')->nullable();
            $table->text('home_map_url')->nullable();
            $table->text('bio')->nullable();
            $table->text('avatar_url')->nullable();
            $table->string('phone', 30)->nullable();
            $table->text('address')->nullable();
            $table->timestamps();

            $table->foreign('father_id')->references('id')->on('members')->nullOnDelete();
            $table->foreign('mother_id')->references('id')->on('members')->nullOnDelete();
            $table->foreign('spouse_id')->references('id')->on('members')->nullOnDelete();
            $table->index(['family_id', 'generation', 'order_in_family'], 'members_family_generation_order_idx');
            $table->index('full_name');
            $table->index('is_alive');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};
