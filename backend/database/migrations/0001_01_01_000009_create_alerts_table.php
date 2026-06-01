<?php
 
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
 
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alerts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('labour_id')->constrained('labours')->onDelete('cascade');
            $table->foreignUuid('partogram_entry_id')->nullable()->constrained('partogram_entries')->onDelete('set null');
            $table->string('alert_level', 15); // GREEN, YELLOW, ORANGE, RED
            $table->string('alert_type', 50); // FCF, TEMPERATURE, BP, STAGNATION, SLOW_PROGRESS
            $table->text('alert_message');
            $table->dateTime('generated_at');
            $table->dateTime('resolved_at')->nullable();
            $table->timestamps();
        });
    }
 
    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};
