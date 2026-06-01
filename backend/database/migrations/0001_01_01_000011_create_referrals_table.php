<?php
 
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
 
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('referrals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('labour_id')->constrained('labours')->onDelete('restrict');
            $table->foreignUuid('source_facility_id')->constrained('facilities')->onDelete('restrict');
            $table->foreignUuid('destination_facility_id')->constrained('facilities')->onDelete('restrict');
            $table->foreignUuid('initiated_by')->constrained('users')->onDelete('restrict');
            $table->text('reason');
            $table->string('referral_status', 20)->default('PENDING'); // PENDING, ACCEPTED, IN_TRANSIT, ADMITTED, DECLINED
            $table->dateTime('departure_time')->nullable();
            $table->dateTime('arrival_time')->nullable();
            $table->foreignUuid('ambulance_id')->nullable()->constrained('ambulances')->onDelete('set null');
            $table->timestamps();
        });
    }
 
    public function down(): void
    {
        Schema::dropIfExists('referrals');
    }
};
