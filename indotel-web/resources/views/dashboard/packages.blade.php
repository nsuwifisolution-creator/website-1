@extends('layouts.dashboard')

@section('title', 'Paket Layanan')
@section('page-title', 'Paket Layanan')
@section('page-subtitle', 'Pilih atau upgrade paket internet Anda')

@section('content')
    <div class="card">
        <div class="card-header">
            <h3><i class="fas fa-tags"></i> Paket Tersedia</h3>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;">
            @foreach($packages as $pkg)
                @php
                    $isCurrent = $subscription && $subscription['package']['slug'] === $pkg['slug'];
                @endphp
                <div style="border:2px solid {{ $isCurrent ? '#00D4FF' : ($pkg['isPopular'] ? '#00D4FF' : '#E8EDF3') }};border-radius:16px;padding:24px;position:relative;
                    {{ $isCurrent ? 'background:rgba(0,212,255,0.05);' : '' }}">
                    @if($isCurrent)
                        <span style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#10B981;color:#fff;padding:4px 14px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:1px;">AKTIF</span>
                    @elseif($pkg['isPopular'])
                        <span style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#00D4FF,#00A8CC);color:#0A2540;padding:4px 14px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:1px;">POPULAR</span>
                    @endif

                    <h4 style="font-size:18px;font-weight:700;color:#0A2540;margin-bottom:4px;">{{ $pkg['name'] }}</h4>
                    <p style="color:#6B7A8F;font-size:13px;margin-bottom:16px;">{{ $pkg['speed'] }}</p>

                    <div style="padding-bottom:16px;border-bottom:1px solid #E8EDF3;margin-bottom:16px;">
                        @if($pkg['price'] > 0)
                            <span style="font-size:13px;color:#6B7A8F;">Rp</span>
                            <span style="font-size:32px;font-weight:800;color:#0A2540;letter-spacing:-1px;">{{ number_format($pkg['price'] / 1000, 0) }}</span>
                            <span style="font-size:13px;color:#6B7A8F;">rb/bln</span>
                        @else
                            <span style="font-size:24px;font-weight:800;color:#0A2540;">Custom</span>
                        @endif
                    </div>

                    <ul style="margin-bottom:20px;">
                        @foreach($pkg['features'] as $feature)
                            <li style="display:flex;gap:8px;padding:5px 0;font-size:13px;color:#6B7A8F;">
                                <i class="fas fa-check-circle" style="color:#00A8CC;margin-top:3px;"></i> {{ $feature }}
                            </li>
                        @endforeach
                    </ul>

                    @if($isCurrent)
                        <button disabled style="width:100%;padding:11px;border-radius:10px;background:#F5F7FA;color:#6B7A8F;border:none;font-weight:600;font-size:13.5px;cursor:not-allowed;">
                            Paket Aktif Anda
                        </button>
                    @elseif($pkg['price'] > 0)
                        <form method="POST" action="{{ route('dashboard.subscribe') }}">
                            @csrf
                            <input type="hidden" name="package_slug" value="{{ $pkg['slug'] }}">
                            <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;padding:11px;font-size:13.5px;">
                                <i class="fas fa-rocket"></i> {{ $subscription ? 'Upgrade ke Paket Ini' : 'Pilih Paket' }}
                            </button>
                        </form>
                    @else
                        <a href="{{ route('kontak') }}" class="btn btn-outline" style="width:100%;justify-content:center;padding:11px;font-size:13.5px;">
                            <i class="fas fa-phone"></i> Hubungi Sales
                        </a>
                    @endif
                </div>
            @endforeach
        </div>
    </div>
@endsection
