<?php

namespace App\Http\Controllers;

use App\Services\IndotelApiService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    protected IndotelApiService $api;

    public function __construct(IndotelApiService $api)
    {
        $this->api = $api;
    }

    public function index()
    {
        $summary = $this->api->getDashboardSummary();
        $invoices = $this->api->getInvoices();
        $notifications = $this->api->getNotifications();

        return view('dashboard.index', [
            'summary' => $summary['data'] ?? null,
            'invoices' => array_slice($invoices['data']['invoices'] ?? [], 0, 3),
            'notifications' => $notifications['data']['notifications'] ?? [],
        ]);
    }

    public function packages()
    {
        $packages = $this->api->getPackages();
        $subscription = $this->api->getMySubscription();

        return view('dashboard.packages', [
            'packages' => $packages['data'] ?? [],
            'subscription' => $subscription['data'] ?? null,
        ]);
    }

    public function subscribe(Request $request)
    {
        $request->validate(['package_slug' => 'required|string']);
        $result = $this->api->subscribe($request->input('package_slug'));

        if ($result['success'] ?? false) {
            return back()->with('success', $result['message'] ?? 'Berhasil.');
        }
        return back()->with('error', $result['message'] ?? 'Gagal berlangganan.');
    }

    public function invoices(Request $request)
    {
        $status = $request->input('status');
        $invoices = $this->api->getInvoices($status);

        return view('dashboard.invoices', [
            'invoices' => $invoices['data']['invoices'] ?? [],
            'summary' => $invoices['data']['summary'] ?? null,
            'pagination' => $invoices['data']['pagination'] ?? null,
            'currentStatus' => $status,
        ]);
    }

    public function showInvoice(int $id)
    {
        $result = $this->api->getInvoice($id);
        if (!($result['success'] ?? false)) {
            return redirect()->route('dashboard.invoices')->with('error', 'Invoice tidak ditemukan.');
        }
        return view('dashboard.invoice-detail', ['invoice' => $result['data']]);
    }

    public function payInvoice(Request $request, int $id)
    {
        $request->validate(['payment_method' => 'required|string']);
        $result = $this->api->payInvoice($id, $request->input('payment_method'));

        if ($result['success'] ?? false) {
            return back()->with('success', $result['message'] ?? 'Pembayaran berhasil.');
        }
        return back()->with('error', $result['message'] ?? 'Pembayaran gagal.');
    }

    public function usage(Request $request)
    {
        $days = (int) $request->input('days', 7);
        $usage = $this->api->getUsageStats($days);

        return view('dashboard.usage', [
            'usage' => $usage['data'] ?? null,
            'days' => $days,
        ]);
    }

    public function support()
    {
        $tickets = $this->api->getSupportTickets();
        return view('dashboard.support', [
            'tickets' => $tickets['data']['tickets'] ?? [],
            'summary' => $tickets['data']['summary'] ?? null,
        ]);
    }

    public function createTicket(Request $request)
    {
        $request->validate([
            'subject' => 'required|string|min:5|max:200',
            'message' => 'required|string|min:10|max:2000',
            'priority' => 'nullable|in:low,normal,high,urgent',
        ]);

        $result = $this->api->createSupportTicket($request->only(['subject', 'message', 'priority']));

        if ($result['success'] ?? false) {
            return back()->with('success', $result['message'] ?? 'Tiket berhasil dibuat.');
        }
        return back()->with('error', $result['message'] ?? 'Gagal membuat tiket.');
    }

    public function profile()
    {
        $result = $this->api->getMe();
        return view('dashboard.profile', [
            'user' => $result['data']['user'] ?? null,
            'subscription' => $result['data']['subscription'] ?? null,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'nullable|string|min:3|max:100',
            'phone' => ['nullable', 'regex:/^(\+62|62|0)8[1-9][0-9]{6,11}$/'],
            'address' => 'nullable|string|max:500',
        ]);

        $result = $this->api->updateProfile($request->only(['name', 'phone', 'address']));

        if ($result['success'] ?? false) {
            return back()->with('success', $result['message'] ?? 'Profil diperbarui.');
        }
        return back()->with('error', $result['message'] ?? 'Gagal update profil.');
    }
}
