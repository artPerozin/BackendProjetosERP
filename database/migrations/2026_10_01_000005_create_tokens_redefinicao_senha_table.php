<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('SIS.tokens_redefinicao_senha', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('criado_em')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('SIS.tokens_redefinicao_senha');
    }
};
