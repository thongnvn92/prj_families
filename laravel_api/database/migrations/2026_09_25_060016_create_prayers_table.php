<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prayers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('family_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->enum('category', ['tet', 'gio_to', 'gio_thuong', 'nhap_trach', 'khac'])->default('khac');
            $table->longText('content');
            $table->foreignId('author_id')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            $table->index(['family_id', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prayers');
    }
};
