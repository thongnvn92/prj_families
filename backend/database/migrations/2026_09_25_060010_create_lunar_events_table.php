<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lunar_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained()->cascadeOnDelete();
            $table->enum('event_type', ['death_anniversary', 'birth_anniversary']);
            $table->unsignedTinyInteger('lunar_day');
            $table->unsignedTinyInteger('lunar_month');
            $table->smallInteger('lunar_year')->nullable();
            $table->date('solar_date');
            $table->string('burial_place')->nullable();
            $table->string('organizer')->nullable();
            $table->timestamps();

            $table->index(['member_id', 'event_type']);
            $table->index('solar_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lunar_events');
    }
};
