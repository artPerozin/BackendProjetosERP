<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('SIS.sessoes', function (Blueprint $table) {
            $table->string('codigo')->primary();
            $table->unsignedBigInteger('codigo_usuario')->nullable();

            $table->foreign('codigo_usuario')
                ->references('codigo')
                ->on('SIS.usuario')
                ->nullOnDelete();

            $table->string('endereco_ip', 45)->nullable();
            $table->text('agente_usuario')->nullable();
            $table->longText('carga');
            $table->integer('ultima_atividade')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('SIS.sessoes');
    }
};
