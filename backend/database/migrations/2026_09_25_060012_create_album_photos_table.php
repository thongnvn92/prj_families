<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('album_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('family_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('image_url');
            $table->date('event_date')->nullable();
            $table->enum('category', ['anniversary', 'reunion', 'tet', 'general'])->default('general');
            $table->enum('visibility', ['public', 'family'])->default('family');
            $table->foreignId('uploaded_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index(['family_id', 'event_date']);
            $table->index(['category', 'visibility']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('album_photos');
    }
};
