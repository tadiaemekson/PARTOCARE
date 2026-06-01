<?php
 
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
 
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('patient_code', 50)->unique(); // PT-2026-XXXX
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->date('date_of_birth');
            $table->string('phone', 20)->nullable();
            $table->text('address')->nullable();
            $table->string('blood_group', 5)->nullable();
            $table->string('emergency_contact_name', 150);
            $table->string('emergency_contact_phone', 20);
            $table->timestamps();
        });
    }
 
    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
