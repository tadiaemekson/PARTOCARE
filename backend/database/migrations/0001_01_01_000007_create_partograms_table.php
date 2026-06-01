<?php
 
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
 
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partograms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('labour_id')->constrained('labours')->onDelete('cascade');
            $table->dateTime('started_at');
            $table->dateTime('completed_at')->nullable();
            $table->string('status', 20)->default('ACTIVE'); // ACTIVE, COMPLETED, SUSPENDED
            $table->timestamps();
        });
    }
 
    public function down(): void
    {
        Schema::dropIfExists('partograms');
    }
};
