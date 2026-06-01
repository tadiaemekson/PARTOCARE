<?php
 
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
 
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('labours', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pregnancy_id')->constrained('pregnancies')->onDelete('restrict');
            $table->foreignUuid('facility_id')->constrained('facilities')->onDelete('restrict');
            $table->foreignUuid('admitted_by')->constrained('users')->onDelete('restrict');
            $table->dateTime('admission_datetime');
            $table->string('labour_status', 20)->default('ACTIVE'); // ACTIVE, COMPLETED, TRANSFERRED
            $table->string('delivery_type', 30)->nullable(); // VAGINAL, CESAREAN, FORCEPS, NONE
            $table->string('outcome', 50)->nullable(); // HEALTHY_MOU, HEALTHY_CHILD, COMPLICATED, STILLBORN, NONE
            $table->timestamps();
        });
    }
 
    public function down(): void
    {
        Schema::dropIfExists('labours');
    }
};
