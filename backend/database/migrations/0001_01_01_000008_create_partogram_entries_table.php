<?php
 
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
 
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partogram_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('partogram_id')->constrained('partograms')->onDelete('cascade');
            $table->dateTime('observation_time');
            $table->decimal('cervical_dilation', 3, 1);
            $table->integer('fetal_heart_rate');
            $table->integer('contractions_per_10min');
            $table->integer('contraction_duration_secs');
            $table->decimal('maternal_temperature', 3, 1);
            $table->integer('maternal_pulse');
            $table->integer('systolic_bp');
            $table->integer('diastolic_bp');
            $table->integer('fetal_station'); // 0 to 5 presentation
            $table->string('membrane_status', 20); // INTACT, RUPTURED
            $table->string('amniotic_fluid_status', 20); // CLEAR, MECONIUM, BLOOD, NONE
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }
 
    public function down(): void
    {
        Schema::dropIfExists('partogram_entries');
    }
};
