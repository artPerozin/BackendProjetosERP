<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('SIS.lotes_tarefas', function (Blueprint $table) {
            $table->string('codigo')->primary();
            $table->string('nome');
            $table->integer('total_tarefas');
            $table->integer('tarefas_pendentes');
            $table->integer('tarefas_falhas');
            $table->longText('codigos_tarefas_falhas');
            $table->mediumText('opcoes')->nullable();
            $table->integer('cancelado_em')->nullable();
            $table->integer('criado_em');
            $table->integer('finalizado_em')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('SIS.lotes_tarefas');
    }
};
