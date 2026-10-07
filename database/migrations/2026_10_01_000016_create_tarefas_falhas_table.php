<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('SIS.tarefas_falhas', function (Blueprint $table) {
            $table->id('codigo');
            $table->string('uuid')->unique();
            $table->text('conexao');
            $table->text('fila');
            $table->longText('carga');
            $table->longText('excecao');
            $table->timestamp('falhou_em')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('SIS.tarefas_falhas');
    }
};
