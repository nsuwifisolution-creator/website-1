@extends('layouts.dashboard')

@section('title', 'Dashboard')
@section('page-title', 'Dashboard')
@section('page-subtitle', 'Selamat datang kembali di Indotel')

@section('content')
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-card-icon cyan"><i class="fas fa-tachometer-alt"></i></div>
            <h3>{{ $summary['subscription']['speed'] ?? '-' }}</h3>
            <p>Kecepatan Saat Ini</p>
        </div>
        <div class="stat-card">
            <div class="stat-card-icon green"><i class="fas fa-file-invoice-dollar"></i></div>
            <h3>Rp {{ number_format($summary['billing']['totalDue'] ?? 0, 0, ',', '.') }}</h3>
            <p>Tagihan Belum Dibayar</p>
        </div>
        <div class="stat-card">
            <div class="stat-card-icon orange"><i class="fas fa-calendar-alt"></i></div>
            <h3>{{ $summary['subscription']['daysLeft'] ?? 0 }} Hari</h3>
            <p>Sisa Masa Aktif</p>
        </div>
        <div class="stat-card">
            <div class="stat-card-icon purple"><i class="fas fa-download"></i></div>
            <h3>{{ $summary['usage']['downloadGb'] ?? 0 }} GB</h3>
            <p>Download 7 Hari</p>
        </div>
    </div>

    @if($summary['subscription'])
    <div class="card" style="background:linear-gradient(135deg,#0A2540,#0d3055);color:#fff;">
        <div class="card-header">
            <h3 style="color:#fff;"><i class="fas fa-wifi" style="color:#00D4FF;"></i> {{ $summary['subscription']['packageName'] }} - {{ $summary['subscription']['speed'] }}</h3>
            <span style="background:rgba(16,185,129,0.15);color:#4ADE80;padding:6px 16px;border-radius:50px;font-size:13px;font-weight:600;">
                <i class="fas fa-circle" style="font-size:8px;"></i> Aktif
            </span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);">
            <div><div style="color:rgba(255,255,255,0.55);font-size:12px;text-transform:uppercase;">ID Pelanggan</div><div style="font-size:16px;font-weight:600;">{{ $summary['user']['customerId'] ?? '-' }}</div></div>
            <div><div style="color:rgba(255,255,255,0.55);font-size:12px;text-transform:uppercase;">Harga</div><div style="font-size:16px;font-weight:600;">Rp {{ number_format($summary['subscription']['price'], 0, ',', '.') }}/bln</div></div>
            <div><div style="color:rgba(255,255,255,0.55);font-size:12px;text-transform:uppercase;">Berakhir</div><div style="font-size:16px;font-weight:600;">{{ \Carbon\Carbon::parse($summary['subscription']['endDate'])->format('d M Y') }}</div></div>
            <div><div style="color:rgba(255,255,255,0.55);font-size:12px;text-transform:uppercase;">Sisa Hari</div><div style="font-size:16px;font-weight:600;color:#00D4FF;">{{ $summary['subscription']['daysLeft'] }} hari</div></div>
        </div>
    </div>
    @else
    <div class="card" style="text-align:center;padding:60px 20px;">
        <i class="fas fa-wifi" style="font-size:64px;color:#D1D9E3;margin-bottom:20px;"></i>
        <h3 style="color:#0A2540;margin-bottom:8px;">Belum Ada Langganan Aktif</h3>
        <p style="color:#6B7A8F;margin-bottom:24px;">Pilih paket internet Indotel sesuai kebutuhan Anda.</p>
        <a href="{{ route('dashboard.packages') }}" class="btn btn-primary">
            <i class="fas fa-tags"></i> Lihat Paket
        </a>
    </div>
    @endif

    <div class="card">
        <div class="card-header">
            <h3><i class="fas fa-file-invoice-dollar"></i> Tagihan Terbaru</h3>
            <a href="{{ route('dashboard.invoices') }}" class="btn btn-primary btn-sm">Lihat Semua</a>
        </div>
        @forelse($invoices as $invoice)
            <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 20px;background:#F5F7FA;border-radius:12px;margin-bottom:10px;">
                <div>
                    <div style="font-weight:600;color:#0A2540;">{{ $invoice['period'] }}</div>
                    <div style="font-size:12.5px;color:#6B7A8F;">{{ $invoice['invoiceNumber'] }}</div>
                </div>
                <div style="display:flex;gap:16px;align-items:center;">
                    <div style="font-weight:700;color:#0A2540;">Rp {{ number_format($invoice['amount'], 0, ',', '.') }}</div>
                    <span style="padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;
                        {{ $invoice['status'] === 'paid' ? 'background:rgba(16,185,129,0.1);color:#10B981;' : 'background:rgba(245,158,11,0.1);color:#F59E0B;' }}">
                        {{ $invoice['status'] === 'paid' ? 'Lunas' : 'Belum Bayar' }}
                    </span>
                </div>
            </div>
        @empty
            <p style="color:#6B7A8F;text-align:center;padding:20px;">Belum ada tagihan.</p>
        @endforelse
    </div>
@endsection
