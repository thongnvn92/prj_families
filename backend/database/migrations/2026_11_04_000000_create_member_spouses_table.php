<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_spouses', function (Blueprint $table) {
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->foreignId('spouse_id')->constrained('members')->cascadeOnDelete();
            $table->primary(['member_id', 'spouse_id']);
            $table->index('spouse_id');
        });

        $legacySpouses = DB::table('members')
            ->whereNotNull('spouse_id')
            ->get(['id', 'spouse_id']);

        foreach ($legacySpouses as $relationship) {
            DB::table('member_spouses')->insertOrIgnore([
                ['member_id' => $relationship->id, 'spouse_id' => $relationship->spouse_id],
                ['member_id' => $relationship->spouse_id, 'spouse_id' => $relationship->id],
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('member_spouses');
    }
};
