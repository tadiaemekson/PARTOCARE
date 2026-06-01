<?php
 
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
 
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ambulances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('facility_id')->constrained('facilities')->onDelete('cascade');
            $table->string('registration_number', 20)->unique();
            $table->string('driver_name', 100);
            $table->string('driver_phone', 20);
            $table->string('status', 20)->default('available'); // available, en mission, maintenance
            $table->timestamps();
        });
    }
 
    public function down(): void
    {
        Schema::dropIfExists('ambulances');
    }
};
