<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('SIS.cache', function (Blueprint $table) {
            $table->string('chave')->primary();
            $table->mediumText('valor');
            $table->integer('expiracao');
        });

        Schema::create('SIS.cache_bloqueios', function (Blueprint $table) {
            $table->string('chave')->primary();
            $table->string('proprietario');
            $table->integer('expiracao');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('SIS.cache_bloqueios');
        Schema::dropIfExists('SIS.cache');
    }
};
