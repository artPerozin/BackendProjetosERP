<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tarefa_usuario', function (Blueprint $table) {
            $table->foreignId('tarefa_id')
                ->constrained('tarefas')
                ->cascadeOnDelete();

            $table->unsignedBigInteger('usuario_id');

            $table->foreign('usuario_id')
                ->references('codigo')
                ->on('SIS.usuario')
                ->cascadeOnDelete();

            $table->primary(['tarefa_id', 'usuario_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tarefa_usuario');
    }
};
