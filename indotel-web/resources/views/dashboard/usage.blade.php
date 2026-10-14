@extends('layouts.dashboard')

@section('title', 'Penggunaan')
@section('page-title', 'Penggunaan')
@section('page-subtitle', 'Statistik pemakaian internet Anda')

@section('content')
    @if($usage)
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-card-icon cyan"><i class="fas fa-download"></i></div>
                <h3>{{ $usage['totals']['downloadGb'] }} GB</h3>
                <p>Total Download</p>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon green"><i class="fas fa-upload"></i></div>
                <h3>{{ $usage['totals']['uploadGb'] }} GB</h3>
                <p>Total Upload</p>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon purple"><i class="fas fa-clock"></i></div>
                <h3>{{ $usage['totals']['onlineHours'] }} Jam</h3>
                <p>Waktu Online</p>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon orange"><i class="fas fa-signal"></i></div>
                <h3>{{ $usage['totals']['avgPing'] }} ms</h3>
                <p>Rata-rata Ping</p>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-chart-bar"></i> Penggunaan Harian ({{ $days }} hari terakhir)</h3>
                <form method="GET" style="display:flex;gap:8px;">
                    <select name="days" onchange="this.form.submit()" style="padding:10px 16px;border-radius:10px;border:2px solid #E8EDF3;font-family:inherit;font-size:13.5px;">
                        <option value="7" {{ $days === 7 ? 'selected' : '' }}>7 Hari</option>
                        <option value="30" {{ $days === 30 ? 'selected' : '' }}>30 Hari</option>
                        <option value="90" {{ $days === 90 ? 'selected' : '' }}>90 Hari</option>
                    </select>
                </form>
            </div>

            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:13.5px;">
                    <thead>
                        <tr style="border-bottom:2px solid #E8EDF3;">
                            <th style="padding:12px;text-align:left;color:#6B7A8F;font-weight:600;">Tanggal</th>
                            <th style="padding:12px;text-align:right;color:#6B7A8F;font-weight:600;">Download</th>
                            <th style="padding:12px;text-align:right;color:#6B7A8F;font-weight:600;">Upload</th>
                            <th style="padding:12px;text-align:right;color:#6B7A8F;font-weight:600;">Online</th>
                            <th style="padding:12px;text-align:right;color:#6B7A8F;font-weight:600;">Ping</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach(array_reverse($usage['daily']) as $day)
                            <tr style="border-bottom:1px solid #F0F2F5;">
                                <td style="padding:12px;">{{ \Carbon\Carbon::parse($day['date'])->format('d M Y') }}</td>
                                <td style="padding:12px;text-align:right;font-weight:600;color:#0A2540;">{{ $day['downloadGb'] }} GB</td>
                                <td style="padding:12px;text-align:right;color:#6B7A8F;">{{ $day['uploadGb'] }} GB</td>
                                <td style="padding:12px;text-align:right;color:#6B7A8F;">{{ $day['onlineHours'] }} jam</td>
                                <td style="padding:12px;text-align:right;color:#6B7A8F;">{{ $day['avgPing'] }} ms</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    @else
        <div class="card" style="text-align:center;padding:60px 20px;">
            <i class="fas fa-chart-line" style="font-size:64px;color:#D1D9E3;margin-bottom:20px;"></i>
            <h3 style="color:#0A2540;margin-bottom:8px;">Belum Ada Data</h3>
            <p style="color:#6B7A8F;">Data penggunaan akan muncul setelah Anda aktif berlangganan.</p>
        </div>
    @endif
@endsection
