<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CapacitacaoController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EficienciaController;
use App\Http\Controllers\ProjetoController;
use App\Http\Controllers\TarefaController;
use App\Http\Controllers\UsuarioController;
use Illuminate\Support\Facades\Route;

/*
| Todas as rotas (exceto o login) exigem token Sanctum. O middleware "permissao"
| aplica o RBAC: cada perfil recebe suas permissões do PermissionService (get-permissions).
| O escopo "somente as suas coisas" é aplicado nos repositórios.
*/

Route::post('auth/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum', 'permissao'])->group(function () {
    // Autenticação e configuração
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::get('config', [AuthController::class, 'config']);

    // Usuários
    Route::get('users', [UsuarioController::class, 'index'])->middleware('permissao:usuarios.listar');
    Route::get('users/{id}', [UsuarioController::class, 'show'])->whereNumber('id');
    Route::post('users', [UsuarioController::class, 'store'])->middleware('permissao:usuarios.gerenciar');
    Route::put('users/{id}', [UsuarioController::class, 'update'])->whereNumber('id')->middleware('permissao:usuarios.gerenciar');
    Route::patch('users/{id}/perfil', [UsuarioController::class, 'perfil'])->whereNumber('id')->middleware('permissao:usuarios.gerenciar');
    Route::patch('users/{id}/status', [UsuarioController::class, 'status'])->whereNumber('id')->middleware('permissao:usuarios.gerenciar');

    // Projetos
    Route::get('projects', [ProjetoController::class, 'index'])->middleware('permissao:projetos.ver');
    Route::get('projects/{id}', [ProjetoController::class, 'show'])->whereNumber('id')->middleware('permissao:projetos.ver');
    Route::post('projects', [ProjetoController::class, 'store'])->middleware('permissao:projetos.gerenciar');
    Route::put('projects/{id}', [ProjetoController::class, 'update'])->whereNumber('id')->middleware('permissao:projetos.gerenciar');
    Route::patch('projects/{id}/status', [ProjetoController::class, 'status'])->whereNumber('id')->middleware('permissao:projetos.gerenciar');
    Route::delete('projects/{id}', [ProjetoController::class, 'destroy'])->whereNumber('id')->middleware('permissao:projetos.gerenciar');

    // Tarefas (Kanban e Gantt)
    Route::get('projects/{id}/tasks', [TarefaController::class, 'doProjeto'])->whereNumber('id')->middleware('permissao:tarefas.ver');
    Route::post('projects/{id}/tasks', [TarefaController::class, 'store'])->whereNumber('id')->middleware('permissao:tarefas.gerenciar');
    Route::get('tasks/{id}', [TarefaController::class, 'show'])->whereNumber('id')->middleware('permissao:tarefas.ver');
    Route::put('tasks/{id}', [TarefaController::class, 'update'])->whereNumber('id')->middleware('permissao:tarefas.gerenciar');
    Route::patch('tasks/{id}/status', [TarefaController::class, 'status'])->whereNumber('id')->middleware('permissao:tarefas.gerenciar');
    Route::patch('tasks/{id}/move', [TarefaController::class, 'mover'])->whereNumber('id')->middleware('permissao:tarefas.gerenciar');
    Route::delete('tasks/{id}', [TarefaController::class, 'destroy'])->whereNumber('id')->middleware('permissao:tarefas.gerenciar');
    Route::get('me/tasks', [TarefaController::class, 'minhas'])->middleware('permissao:tarefas.ver');

    // Capacitações
    Route::get('trainings', [CapacitacaoController::class, 'index'])->middleware('permissao:capacitacoes.ver');
    Route::get('trainings/{id}', [CapacitacaoController::class, 'show'])->whereNumber('id')->middleware('permissao:capacitacoes.ver');
    Route::post('trainings', [CapacitacaoController::class, 'store'])->middleware('permissao:capacitacoes.gerenciar');
    Route::put('trainings/{id}', [CapacitacaoController::class, 'update'])->whereNumber('id')->middleware('permissao:capacitacoes.gerenciar');
    Route::delete('trainings/{id}', [CapacitacaoController::class, 'destroy'])->whereNumber('id')->middleware('permissao:capacitacoes.gerenciar');
    Route::post('trainings/{id}/enrollments', [CapacitacaoController::class, 'inscrever'])->whereNumber('id')->middleware('permissao:capacitacoes.inscrever');
    Route::delete('trainings/{id}/enrollments/{usuarioId}', [CapacitacaoController::class, 'cancelar'])
        ->whereNumber('id')->where('usuarioId', '[0-9]+|me')->middleware('permissao:capacitacoes.inscrever');
    Route::get('me/trainings', [CapacitacaoController::class, 'minhas'])->middleware('permissao:capacitacoes.ver');

    // Dashboard
    Route::get('dashboard/summary', [DashboardController::class, 'summary'])->middleware('permissao:dashboard.ver');
    Route::get('dashboard/burndown', [DashboardController::class, 'burndown'])->middleware('permissao:dashboard.ver');

    // Eficiência
    Route::get('efficiency/members', [EficienciaController::class, 'membros'])->middleware('permissao:eficiencia.ver');
    Route::get('efficiency/insights', [EficienciaController::class, 'insights'])->middleware('permissao:eficiencia.ver');
    Route::get('efficiency/projects', [EficienciaController::class, 'projetos'])->middleware('permissao:eficiencia.ver');
});
