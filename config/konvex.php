<?php

return [
    // Senha atribuída a usuários cadastrados pela API (a rota de cadastro não recebe senha).
    'senha_inicial' => env('KONVEX_SENHA_INICIAL', 'Konvex@123'),

    // Validade do token de acesso, em minutos.
    'token_minutos' => (int) env('KONVEX_TOKEN_MINUTOS', 480),
];
