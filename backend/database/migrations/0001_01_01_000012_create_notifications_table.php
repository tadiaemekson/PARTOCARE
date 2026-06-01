<?php
 
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
 
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->string('channel', 30); // SMS, WHATSAPP, IN_APP
            $table->string('title', 255);
            $table->text('message');
            $table->string('status', 20)->default('PENDING'); // PENDING, SENT, FAILED, READ
            $table->dateTime('sent_at')->nullable();
            $table->timestamps();
        });
    }
 
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
