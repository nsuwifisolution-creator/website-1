@extends('layouts.app')

@section('title', 'Tentang Kami')

@section('styles')
<style>
    .page-header { background: linear-gradient(135deg, #061829 0%, #0A2540 50%, #0d3055 100%); padding: 160px 0 80px; text-align: center; color: #fff; position: relative; overflow: hidden; }
    .page-header::before { content: ''; position: absolute; top: -50%; right: -20%; width: 700px; height: 700px; background: radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%); border-radius: 50%; }
    .page-header h1 { font-size: clamp(2rem, 4.5vw, 3rem); font-weight: 800; margin-bottom: 16px; position: relative; z-index: 2; }
    .page-header p { color: rgba(255,255,255,0.75); font-size: 17px; max-width: 640px; margin: 0 auto; position: relative; z-index: 2; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; margin: 60px 0; }
    .stat-card { background: #fff; padding: 36px 24px; border-radius: 16px; text-align: center; box-shadow: 0 10px 40px rgba(10,37,64,0.08); }
    .stat-card i { font-size: 32px; color: #00A8CC; margin-bottom: 16px; }
    .stat-card h3 { font-size: 36px; font-weight: 800; color: #0A2540; letter-spacing: -1px; margin-bottom: 6px; }
    .stat-card p { color: #6B7A8F; font-size: 14px; }
</style>
@endsection

@section('content')
    <section class="page-header">
        <div class="container">
            <h1>Tentang Indotel</h1>
            <p>Membangun koneksi yang menghubungkan Indonesia dengan dunia digital sejak 2015.</p>
        </div>
    </section>

    <section>
        <div class="container">
            <div style="max-width:760px;margin:0 auto;text-align:center;">
                <h2 style="font-size:32px;color:#0A2540;margin-bottom:20px;">Lebih dari Sekadar Penyedia Internet</h2>
                <p style="color:#6B7A8F;line-height:1.8;margin-bottom:16px;">Indotel didirikan pada tahun 2015 dengan visi sederhana: menghadirkan internet cepat, stabil, dan terjangkau untuk seluruh masyarakat Indonesia.</p>
                <p style="color:#6B7A8F;line-height:1.8;">Kami percaya bahwa koneksi internet yang handal bukan lagi kemewahan, melainkan kebutuhan dasar. Itulah mengapa kami terus berinvestasi pada teknologi fiber optik terkini.</p>
            </div>

            <div class="stats-grid">
                <div class="stat-card"><i class="fas fa-users"></i><h3>50K+</h3><p>Pelanggan Aktif</p></div>
                <div class="stat-card"><i class="fas fa-city"></i><h3>25+</h3><p>Kota Terjangkau</p></div>
                <div class="stat-card"><i class="fas fa-calendar-alt"></i><h3>10+</h3><p>Tahun Pengalaman</p></div>
                <div class="stat-card"><i class="fas fa-user-tie"></i><h3>500+</h3><p>Karyawan Profesional</p></div>
            </div>
        </div>
    </section>
@endsection
