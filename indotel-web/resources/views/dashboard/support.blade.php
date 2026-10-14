@extends('layouts.dashboard')

@section('title', 'Bantuan')
@section('page-title', 'Bantuan')
@section('page-subtitle', 'Kami siap membantu Anda 24/7')

@section('content')
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;margin-bottom:24px;">
        <a href="https://wa.me/6281234567890" target="_blank" class="card" style="text-align:center;text-decoration:none;transition:all 0.3s;cursor:pointer;">
            <i class="fab fa-whatsapp" style="font-size:40px;color:#25D366;margin-bottom:16px;"></i>
            <h4 style="color:#0A2540;margin-bottom:8px;">WhatsApp</h4>
            <p style="color:#6B7A8F;font-size:13.5px;">Respon cepat dalam 5 menit</p>
        </a>
        <a href="tel:+622112345678" class="card" style="text-align:center;text-decoration:none;transition:all 0.3s;cursor:pointer;">
            <i class="fas fa-phone-alt" style="font-size:40px;color:#00A8CC;margin-bottom:16px;"></i>
            <h4 style="color:#0A2540;margin-bottom:8px;">Telepon</h4>
            <p style="color:#6B7A8F;font-size:13.5px;">Tersedia 24/7</p>
        </a>
        <a href="mailto:support@indotel.id" class="card" style="text-align:center;text-decoration:none;transition:all 0.3s;cursor:pointer;">
            <i class="fas fa-envelope" style="font-size:40px;color:#00A8CC;margin-bottom:16px;"></i>
            <h4 style="color:#0A2540;margin-bottom:8px;">Email</h4>
            <p style="color:#6B7A8F;font-size:13.5px;">Respon 1x24 jam</p>
        </a>
    </div>

    <div class="card">
        <div class="card-header">
            <h3><i class="fas fa-ticket-alt"></i> Tiket Bantuan</h3>
            <button onclick="document.getElementById('newTicketForm').style.display = document.getElementById('newTicketForm').style.display === 'none' ? 'block' : 'none'" class="btn btn-primary btn-sm">
                <i class="fas fa-plus"></i> Buat Tiket
            </button>
        </div>

        <div id="newTicketForm" style="display:none;padding:20px;background:#F5F7FA;border-radius:12px;margin-bottom:24px;">
            <form method="POST" action="{{ route('dashboard.support.create') }}">
                @csrf
                <div style="margin-bottom:14px;">
                    <label style="display:block;font-size:13.5px;font-weight:600;color:#0A2540;margin-bottom:8px;">Subjek</label>
                    <input type="text" name="subject" placeholder="Contoh: Internet lambat" required style="width:100%;padding:12px 16px;border-radius:10px;border:2px solid #E8EDF3;font-family:inherit;">
                </div>
                <div style="margin-bottom:14px;">
                    <label style="display:block;font-size:13.5px;font-weight:600;color:#0A2540;margin-bottom:8px;">Prioritas</label>
                    <select name="priority" style="width:100%;padding:12px 16px;border-radius:10px;border:2px solid #E8EDF3;font-family:inherit;">
                        <option value="normal">Normal</option>
                        <option value="low">Rendah</option>
                        <option value="high">Tinggi</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>
                <div style="margin-bottom:14px;">
                    <label style="display:block;font-size:13.5px;font-weight:600;color:#0A2540;margin-bottom:8px;">Pesan</label>
                    <textarea name="message" rows="4" placeholder="Jelaskan masalah Anda..." required style="width:100%;padding:12px 16px;border-radius:10px;border:2px solid #E8EDF3;font-family:inherit;resize:vertical;"></textarea>
                </div>
                <button type="submit" class="btn btn-primary"><i class="fas fa-paper-plane"></i> Kirim</button>
            </form>
        </div>

        @forelse($tickets as $ticket)
            <div style="padding:16px 20px;background:#F5F7FA;border-radius:12px;margin-bottom:12px;border-left:4px solid
                @if($ticket['status'] === 'open') #F59E0B
                @elseif($ticket['status'] === 'in_progress') #00D4FF
                @elseif($ticket['status'] === 'resolved') #10B981
                @else #6B7A8F @endif;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">
                    <div style="flex:1;min-width:200px;">
                        <div style="font-weight:600;color:#0A2540;">{{ $ticket['subject'] }}</div>
                        <div style="font-size:12.5px;color:#6B7A8F;margin-top:4px;">{{ Str::limit($ticket['message'], 100) }}</div>
                    </div>
                    <div style="display:flex;gap:8px;align-items:center;">
                        <span style="padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;
                            @if($ticket['status'] === 'open') background:rgba(245,158,11,0.15);color:#F59E0B;
                            @elseif($ticket['status'] === 'in_progress') background:rgba(0,212,255,0.15);color:#00A8CC;
                            @elseif($ticket['status'] === 'resolved') background:rgba(16,185,129,0.15);color:#10B981;
                            @else background:rgba(107,122,143,0.15);color:#6B7A8F;@endif">
                            {{ str_replace('_', ' ', $ticket['status']) }}
                        </span>
                        <span style="font-size:12px;color:#6B7A8F;">{{ \Carbon\Carbon::parse($ticket['createdAt'])->format('d M Y') }}</span>
                    </div>
                </div>
            </div>
        @empty
            <div style="text-align:center;padding:40px 20px;">
                <i class="fas fa-inbox" style="font-size:56px;color:#D1D9E3;margin-bottom:16px;"></i>
                <p style="color:#6B7A8F;">Belum ada tiket bantuan. Buat tiket jika ada kendala.</p>
            </div>
        @endforelse
    </div>
@endsection
