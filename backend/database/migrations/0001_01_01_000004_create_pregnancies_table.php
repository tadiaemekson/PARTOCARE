<?php
 
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
 
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pregnancies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('patient_id')->constrained('patients')->onDelete('cascade');
            $table->integer('gravidity');
            $table->integer('parity');
            $table->date('estimated_delivery_date')->nullable();
            $table->integer('gestational_age_weeks')->nullable();
            $table->string('risk_level', 20)->default('LOW'); // LOW, MEDIUM, HIGH
            $table->string('status', 20)->default('ACTIVE'); // ACTIVE, DELIVERED, REFERRED
            $table->timestamps();
        });
    }
 
    public function down(): void
    {
        Schema::dropIfExists('pregnancies');
    }
};
