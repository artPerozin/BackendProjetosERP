<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('capacitacoes', function (Blueprint $table) {
            $table->id();
            $table->string('titulo');
            $table->string('tipo', 20)->index();
            $table->date('data')->index();
            $table->string('hora', 5);
            $table->string('sala');
            $table->string('instrutor');
            $table->unsignedInteger('vagas');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('capacitacoes');
    }
};
