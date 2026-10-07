<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('SIS.usuario', function (Blueprint $table) {
            $table->id('codigo');
            $table->string('nome');
            $table->string('email')->unique();
            $table->timestamp('email_verificado_em')->nullable();
            $table->string('senha');
            $table->unsignedBigInteger('codigo_perfil')->nullable();

            $table->foreign('codigo_perfil')
                ->references('codigo')
                ->on('SIS.perfil');

            $table->string('lembrar_token', 100)->nullable();
            $table->timestamp('excluido_em')->nullable();
            $table->timestamp('criado_em')->nullable();
            $table->timestamp('atualizado_em')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('SIS.usuario');
    }
};
