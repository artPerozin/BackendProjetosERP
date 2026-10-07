<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projeto_usuario', function (Blueprint $table) {
            $table->foreignId('projeto_id')
                ->constrained('projetos')
                ->cascadeOnDelete();

            $table->unsignedBigInteger('usuario_id');

            $table->foreign('usuario_id')
                ->references('codigo')
                ->on('SIS.usuario')
                ->cascadeOnDelete();

            $table->primary(['projeto_id', 'usuario_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projeto_usuario');
    }
};
