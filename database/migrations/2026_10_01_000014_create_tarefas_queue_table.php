<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('SIS.tarefas', function (Blueprint $table) {
            $table->id('codigo');
            $table->string('fila')->index();
            $table->longText('carga');
            $table->unsignedTinyInteger('tentativas');
            $table->unsignedInteger('reservado_em')->nullable();
            $table->unsignedInteger('disponivel_em');
            $table->unsignedInteger('criado_em');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('SIS.tarefas');
    }
};
