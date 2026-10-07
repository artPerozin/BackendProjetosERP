<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tarefas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('projeto_id')
                ->constrained('projetos')
                ->cascadeOnDelete();
            $table->string('titulo');
            $table->string('prioridade', 2)->default('P3');
            $table->date('inicio');
            $table->date('fim')->index();
            $table->string('status', 20)->default('pendente')->index();
            $table->date('conclusao')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tarefas');
    }
};
