<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Log;

class IndotelApiService
{
    protected Client $client;
    protected string $baseUrl;
    protected int $timeout;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.indotel_api.url', 'http://api:3000/api'), '/') . '/';
        $this->timeout = (int) config('services.indotel_api.timeout', 30);

        $this->client = new Client([
            'base_uri' => $this->baseUrl,
            'timeout' => $this->timeout,
            'headers' => [
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ],
            'http_errors' => false,
        ]);
    }

    protected function token(): ?string
    {
        return Session::get('indotel_token');
    }

    protected function withAuth(array $options = []): array
    {
        if ($token = $this->token()) {
            $options['headers']['Authorization'] = 'Bearer ' . $token;
        }
        return $options;
    }

    // AUTH
    public function register(array $data): array
    {
        return $this->request('POST', 'auth/register', ['json' => $data]);
    }

    public function login(string $email, string $password): array
    {
        $result = $this->request('POST', 'auth/login', [
            'json' => ['email' => $email, 'password' => $password]
        ]);

        if (($result['success'] ?? false) && isset($result['data']['token'])) {
            Session::put('indotel_token', $result['data']['token']);
            Session::put('indotel_user', $result['data']['user']);
        }
        return $result;
    }

    public function logout(): void
    {
        try {
            if ($this->token()) {
                $this->request('POST', 'auth/logout', $this->withAuth());
            }
        } catch (\Exception $e) {
            Log::warning('Logout API call failed: ' . $e->getMessage());
        }
        Session::forget(['indotel_token', 'indotel_user']);
    }

    public function getMe(): array
    {
        return $this->request('GET', 'auth/me', $this->withAuth());
    }

    public function updateProfile(array $data): array
    {
        return $this->request('PUT', 'auth/profile', $this->withAuth(['json' => $data]));
    }

    // PACKAGES
    public function getPackages(): array
    {
        return $this->request('GET', 'packages');
    }

    public function getPackage(string $slug): array
    {
        return $this->request('GET', "packages/{$slug}");
    }

    public function getMySubscription(): array
    {
        return $this->request('GET', 'packages/my-subscription', $this->withAuth());
    }

    public function subscribe(string $packageSlug): array
    {
        return $this->request('POST', 'packages/subscribe', $this->withAuth([
            'json' => ['packageSlug' => $packageSlug]
        ]));
    }

    // INVOICES
    public function getInvoices(?string $status = null): array
    {
        $query = $status ? ['status' => $status] : [];
        return $this->request('GET', 'invoices', $this->withAuth(['query' => $query]));
    }

    public function getInvoice(int $id): array
    {
        return $this->request('GET', "invoices/{$id}", $this->withAuth());
    }

    public function payInvoice(int $id, string $method): array
    {
        return $this->request('POST', "invoices/{$id}/pay", $this->withAuth([
            'json' => ['paymentMethod' => $method]
        ]));
    }

    public function getInvoiceSummary(): array
    {
        return $this->request('GET', 'invoices/summary', $this->withAuth());
    }

    public function getUsageStats(int $days = 7): array
    {
        return $this->request('GET', 'invoices/usage', $this->withAuth([
            'query' => ['days' => $days]
        ]));
    }

    // USER / DASHBOARD
    public function getDashboardSummary(): array
    {
        return $this->request('GET', 'users/dashboard', $this->withAuth());
    }

    public function getQuickStats(): array
    {
        return $this->request('GET', 'users/stats', $this->withAuth());
    }

    public function getActivity(int $limit = 20): array
    {
        return $this->request('GET', 'users/activity', $this->withAuth([
            'query' => ['limit' => $limit]
        ]));
    }

    public function getNotifications(int $limit = 10): array
    {
        return $this->request('GET', 'users/notifications', $this->withAuth([
            'query' => ['limit' => $limit]
        ]));
    }

    public function getConnectionInfo(): array
    {
        return $this->request('GET', 'users/connection-info', $this->withAuth());
    }

    // SUPPORT
    public function getSupportTickets(?string $status = null): array
    {
        $query = $status ? ['status' => $status] : [];
        return $this->request('GET', 'users/support-tickets', $this->withAuth(['query' => $query]));
    }

    public function createSupportTicket(array $data): array
    {
        return $this->request('POST', 'users/support-ticket', $this->withAuth(['json' => $data]));
    }

    public function getSupportTicket(int $id): array
    {
        return $this->request('GET', "users/support-tickets/{$id}", $this->withAuth());
    }

    public function replySupportTicket(int $id, string $message): array
    {
        return $this->request('POST', "users/support-tickets/{$id}/reply", $this->withAuth([
            'json' => ['message' => $message]
        ]));
    }

    public function closeSupportTicket(int $id): array
    {
        return $this->request('POST', "users/support-tickets/{$id}/close", $this->withAuth());
    }

    // HTTP WRAPPER
    protected function request(string $method, string $endpoint, array $options = []): array
    {
        try {
            $response = $this->client->request($method, $endpoint, $options);
            $body = $response->getBody()->getContents();
            $decoded = json_decode($body, true);

            return $decoded ?? ['success' => false, 'message' => 'Invalid JSON response'];
        } catch (GuzzleException $e) {
            Log::error('Indotel API error', [
                'method' => $method,
                'endpoint' => $endpoint,
                'error' => $e->getMessage(),
            ]);

            if (method_exists($e, 'hasResponse') && $e->hasResponse()) {
                $body = $e->getResponse()->getBody()->getContents();
                $decoded = json_decode($body, true);
                if ($decoded) return $decoded;
            }

            return [
                'success' => false,
                'message' => 'Tidak dapat terhubung ke server.',
                'code' => 'CONNECTION_ERROR',
            ];
        }
    }
}
