<?php

namespace Tests\Feature;

use App\Models\User;
use DB;
use Illuminate\Foundation\Testing\RefreshDatabase;
use \Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_login()
    {
        $response = $this->post('/api/login', [
            'email' => env("DEFAULT_EMAIL"),
            'password' => env("DEFAULT_PASSWORD")
        ]);

        $response->assertStatus(Response::HTTP_OK)->assertJson([
            'message' => "Autorizado",
            'status' => Response::HTTP_OK,
            'data' => [
                "name" => true,
                "profile" => "ADMIN",
                "permissions" => true,
                "token" => true
            ]
        ]);
    }

    public function test_admin_can_not_login_with_invalid_credentials()
    {
        $response = $this->post('/api/login', [
            'email' => env("DEFAULT_EMAIL"),
            'password' => "1234567"
        ]);

        $response->assertStatus(Response::HTTP_UNAUTHORIZED)->assertJson([
            'message' => "Não autorizado. Credenciais incorretas",
            'status' => Response::HTTP_UNAUTHORIZED
        ]);
    }

    public function test_admin_can_not_login_without_email()
    {
        $response = $this->post('/api/login', [
            'password' => env("DEFAULT_PASSWORD")
        ]);

        $response->assertStatus(Response::HTTP_BAD_REQUEST);
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals('O email é obrigatório', $responseData['message']);
    }

    public function test_admin_permissions_load_correct()
    {
        $response = $this->post('/api/login', [
            'email' => env("DEFAULT_EMAIL"),
            'password' => env("DEFAULT_PASSWORD")
        ]);

        $response->assertStatus(Response::HTTP_OK)->assertJson([
            'data' => [
                'permissions' => [
                    'create-users',
                    'get-users',
                    'delete-users',
                    'update-users',
                ]
            ]
        ]);
    }

    public function test_admin_can_logout()
    {
        DB::statement('TRUNCATE TABLE users CASCADE;');
        DB::statement('ALTER SEQUENCE users_id_seq RESTART WITH 1;');

        $user = User::factory()->create(['profile_id' => 1]);

        $response = $this->actingAs($user)->post('/api/logout');

        $response->assertStatus(Response::HTTP_NO_CONTENT);
    }
}
