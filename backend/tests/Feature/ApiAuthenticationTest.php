<?php

namespace Tests\Feature;

use Tests\TestCase;

class ApiAuthenticationTest extends TestCase
{
    public function test_cors_preflight_allows_local_vite_origin(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Access-Control-Request-Method' => 'POST',
            'Access-Control-Request-Headers' => 'content-type,accept',
        ])->options('/api/v1/auth/login');

        $response->assertStatus(204)
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
            ->assertHeader('Access-Control-Allow-Methods', 'POST');
    }

    public function test_protected_api_returns_json_401_without_a_token(): void
    {
        $this->getJson('/api/v1/calendar/events')
            ->assertUnauthorized()
            ->assertJson(['message' => 'Unauthenticated.']);
    }

    public function test_optional_public_route_rejects_malformed_bearer_token(): void
    {
        $this->getJson('/api/v1/members', ['Authorization' => 'Bearer invalid-token'])
            ->assertUnauthorized()
            ->assertJson(['message' => 'Unauthenticated.']);
    }

    public function test_protected_api_does_not_require_an_accept_header_for_json_errors(): void
    {
        $this->get('/api/v1/calendar/events')
            ->assertUnauthorized()
            ->assertJson(['message' => 'Unauthenticated.']);
    }

    public function test_register_rejects_email_header_injection_payload(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'Test user',
            'email' => "victim@example.test\r\nBcc: attacker@example.test",
            'password' => 'password-123',
            'password_confirmation' => 'password-123',
            'family_code' => 'nguyen-chi-3',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
    }
}
