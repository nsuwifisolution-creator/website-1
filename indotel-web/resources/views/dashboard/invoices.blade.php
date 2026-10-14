@extends('layouts.dashboard')

@section('title', 'Tagihan')
@section('page-title', 'Tagihan')
@section('page-subtitle', 'Kelola tagihan dan pembayaran Anda')

@section('content')
    <div class="card">
        <div class="card-header">
            <h3><i class="fas fa-file-invoice-dollar"></i> Riwayat Tagihan</h3>
            <form method="GET" style="display:flex;gap:8px;">
                <select name="status" onchange="this.form.submit()" style="padding:10px 16px;border-radius:10px;border:2px solid #E8EDF3;font-family:inherit;font-size:13.5px;outline:none;cursor:pointer;">
                    <option value="">Semua Status</option>
                    <option value="paid" {{ $currentStatus === 'paid' ? 'selected' : '' }}>Lunas</option>
                    <option value="unpaid" {{ $currentStatus === 'unpaid' ? 'selected' : '' }}>Belum Bayar</option>
                    <option value="overdue" {{ $currentStatus === 'overdue' ? 'selected' : '' }}>Terlambat</option>
                </select>
            </form>
        </div>

        @forelse($invoices as $invoice)
            <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;background:#F5F7FA;border-radius:12px;margin-bottom:12px;gap:16px;flex-wrap:wrap;">
                <div style="display:flex;gap:16px;align-items:center;flex:1;min-width:200px;">
                    <div style="width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;
                        @if($invoice['status'] === 'paid') background:rgba(16,185,129,0.1);color:#10B981;
                        @elseif($invoice['status'] === 'overdue') background:rgba(239,68,68,0.1);color:#EF4444;
                        @else background:rgba(245,158,11,0.1);color:#F59E0B;@endif">
                        @if($invoice['status'] === 'paid') <i class="fas fa-check"></i>
                        @elseif($invoice['status'] === 'overdue') <i class="fas fa-exclamation-triangle"></i>
                        @else <i class="fas fa-clock"></i>@endif
                    </div>
                    <div>
                        <div style="font-weight:600;color:#0A2540;font-size:14.5px;">{{ $invoice['period'] }}</div>
                        <div style="font-size:12.5px;color:#6B7A8F;">{{ $invoice['invoiceNumber'] }} · Jatuh tempo {{ \Carbon\Carbon::parse($invoice['dueDate'])->format('d M Y') }}</div>
                    </div>
                </div>
                <div style="font-weight:700;color:#0A2540;font-size:16px;">Rp {{ number_format($invoice['amount'], 0, ',', '.') }}</div>
                @if($invoice['status'] === 'paid')
                    <span style="padding:6px 14px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;background:rgba(16,185,129,0.1);color:#10B981;">Lunas</span>
                @else
                    <form method="POST" action="{{ route('dashboard.invoices.pay', $invoice['id']) }}" style="display:flex;gap:8px;">
                        @csrf
                        <select name="payment_method" required style="padding:8px 12px;border-radius:10px;border:2px solid #E8EDF3;font-family:inherit;font-size:13px;">
                            <option value="">Metode...</option>
                            <option value="Transfer Bank">Transfer Bank</option>
                            <option value="Virtual Account">Virtual Account</option>
                            <option value="E-Wallet">E-Wallet</option>
                            <option value="QRIS">QRIS</option>
                            <option value="Minimart">Minimart</option>
                        </select>
                        <button type="submit" class="btn btn-primary btn-sm">Bayar</button>
                    </form>
                @endif
            </div>
        @empty
            <div style="text-align:center;padding:60px 20px;">
                <i class="fas fa-file-invoice" style="font-size:64px;color:#D1D9E3;margin-bottom:20px;"></i>
                <h3 style="color:#0A2540;margin-bottom:8px;">Belum Ada Tagihan</h3>
                <p style="color:#6B7A8F;">Tagihan akan muncul setelah Anda berlangganan paket Indotel.</p>
            </div>
        @endforelse
    </div>
@endsection
