<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('SIS.tokens_acesso_pessoal', function (Blueprint $table) {
            $table->id('codigo');
            $table->string('tokenavel_tipo');
            $table->unsignedBigInteger('tokenavel_codigo');
            $table->index(['tokenavel_tipo', 'tokenavel_codigo']);
            $table->string('nome');
            $table->string('token', 64)->unique();
            $table->text('habilidades')->nullable();
            $table->timestamp('ultimo_uso_em')->nullable();
            $table->timestamp('expira_em')->nullable();
            $table->timestamp('criado_em')->nullable();
            $table->timestamp('atualizado_em')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('SIS.tokens_acesso_pessoal');
    }
};
