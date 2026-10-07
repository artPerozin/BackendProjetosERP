<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projetos', function (Blueprint $table) {
            $table->id();
            $table->string('nome');
            $table->text('descricao')->nullable();
            $table->date('inicio');
            $table->date('fim');
            $table->string('status', 20)->default('em_execucao')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projetos');
    }
};
