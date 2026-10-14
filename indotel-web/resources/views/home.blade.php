@extends('layouts.app')

@section('title', 'Home')
@section('description', 'Indotel - Internet Fiber Optik Cepat, Stabil & Unlimited')

@section('styles')
<style>
    .hero { min-height: 100vh; background: linear-gradient(135deg, #061829 0%, #0A2540 50%, #0d3055 100%); display: flex; align-items: center; padding: 120px 0 80px; position: relative; overflow: hidden; }
    .hero::before { content: ''; position: absolute; top: -50%; right: -20%; width: 800px; height: 800px; background: radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%); border-radius: 50%; }
    .hero-content { text-align: center; max-width: 800px; margin: 0 auto; position: relative; z-index: 2; }
    .hero h1 { font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; color: #fff; line-height: 1.15; letter-spacing: -1px; margin-bottom: 20px; }
    .hero h1 span { background: linear-gradient(135deg, #00D4FF, #7FE7FF); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .hero p { color: rgba(255,255,255,0.75); font-size: 17px; margin-bottom: 36px; max-width: 640px; margin-left: auto; margin-right: auto; }
    .hero-buttons { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
    .badge { display: inline-flex; align-items: center; gap: 10px; background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.3); color: #00D4FF; padding: 8px 18px; border-radius: 50px; font-size: 13px; font-weight: 500; margin-bottom: 24px; }
    
    section { padding: 100px 0; }
    .section-header { text-align: center; max-width: 700px; margin: 0 auto 64px; }
    .section-tag { display: inline-block; color: #00A8CC; background: rgba(0,212,255,0.1); padding: 6px 18px; border-radius: 50px; font-size: 13px; font-weight: 600; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px; }
    .section-header h2 { font-size: clamp(1.75rem, 3.5vw, 2.5rem); font-weight: 700; color: #0A2540; line-height: 1.2; letter-spacing: -0.5px; margin-bottom: 16px; }
    .section-header p { color: #6B7A8F; font-size: 16px; }
    
    .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 28px; }
    .pricing-card { background: #fff; border: 2px solid #E8EDF3; border-radius: 24px; padding: 36px 28px; transition: all 0.3s; position: relative; display: flex; flex-direction: column; }
    .pricing-card:hover { border-color: #00D4FF; transform: translateY(-8px); box-shadow: 0 20px 60px rgba(10,37,64,0.15); }
    .pricing-card.popular { background: linear-gradient(135deg, #0A2540, #0d3055); border-color: #00D4FF; color: #fff; transform: scale(1.03); }
    .popular-badge { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #00D4FF, #00A8CC); color: #0A2540; padding: 6px 20px; border-radius: 50px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .pricing-card h3 { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
    .pricing-card .speed { font-size: 14px; color: #6B7A8F; margin-bottom: 24px; }
    .pricing-card.popular .speed { color: rgba(255,255,255,0.7); }
    .price { display: flex; align-items: baseline; gap: 4px; margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid #E8EDF3; }
    .pricing-card.popular .price { border-color: rgba(255,255,255,0.15); }
    .price .amount { font-size: 42px; font-weight: 800; color: #0A2540; letter-spacing: -1.5px; line-height: 1; }
    .pricing-card.popular .price .amount { background: linear-gradient(135deg, #00D4FF, #7FE7FF); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .price .currency, .price .period { font-size: 14px; color: #6B7A8F; }
    .pricing-features { flex: 1; margin-bottom: 28px; }
    .pricing-features li { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; font-size: 14px; color: #6B7A8F; }
    .pricing-card.popular .pricing-features li { color: rgba(255,255,255,0.85); }
    .pricing-features li i { color: #00A8CC; margin-top: 3px; }
    .pricing-card.popular .pricing-features li i { color: #00D4FF; }
    
    .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 28px; }
    .feature-card { background: #fff; padding: 36px 28px; border-radius: 16px; box-shadow: 0 10px 40px rgba(10,37,64,0.08); transition: all 0.3s; }
    .feature-card:hover { transform: translateY(-8px); box-shadow: 0 20px 60px rgba(10,37,64,0.15); }
    .feature-icon { width: 60px; height: 60px; background: linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.05)); border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #00A8CC; font-size: 24px; margin-bottom: 20px; }
    .feature-card h3 { font-size: 18px; font-weight: 600; color: #0A2540; margin-bottom: 10px; }
    .feature-card p { color: #6B7A8F; font-size: 14px; line-height: 1.7; }
    .features { background: #F5F7FA; }
    
    .cta-section { background: linear-gradient(135deg, #061829, #0A2540); color: #fff; text-align: center; }
    .cta-section h2 { color: #fff; }
    .cta-section p { color: rgba(255,255,255,0.75); margin-bottom: 32px; }
</style>
@endsection

@section('content')
    <!-- HERO -->
    <section class="hero">
        <div class="container hero-content">
            <div class="badge">
                <i class="fas fa-bolt"></i>
                <span>Internet Fiber Optik Tercepat di Indonesia</span>
            </div>
            <h1>Koneksi Cepat, <span>Harga Tepat</span>, Tanpa Batas</h1>
            <p>Nikmati internet fiber optik simetris dengan kecepatan hingga 100 Mbps. Stabil, unlimited tanpa FUP, dan support 24/7.</p>
            <div class="hero-buttons">
                <a href="#paket" class="btn btn-primary"><i class="fas fa-tags"></i> Lihat Paket</a>
                <a href="{{ route('register') }}" class="btn btn-outline"><i class="fas fa-rocket"></i> Daftar Sekarang</a>
            </div>
        </div>
    </section>

    <!-- FEATURES -->
    <section class="features">
        <div class="container">
            <div class="section-header">
                <span class="section-tag">Keunggulan Kami</span>
                <h2>Kenapa Harus Pilih Indotel?</h2>
                <p>Kami memberikan pengalaman internet terbaik dengan teknologi fiber optik terkini.</p>
            </div>
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon"><i class="fas fa-exchange-alt"></i></div>
                    <h3>Simetris Upload & Download</h3>
                    <p>Kecepatan upload sama dengan download. Cocok untuk WFH, streaming, dan gaming.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon"><i class="fas fa-infinity"></i></div>
                    <h3>Tanpa FUP / Unlimited</h3>
                    <p>Bebas berinternet sepuasnya tanpa batas kuota. Tidak ada throttling kecepatan.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon"><i class="fas fa-tools"></i></div>
                    <h3>Gratis Instalasi</h3>
                    <p>Biaya pemasangan gratis untuk pelanggan baru. Teknisi profesional siap datang.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon"><i class="fas fa-headset"></i></div>
                    <h3>Support 24/7</h3>
                    <p>Tim customer support kami siaga 24 jam via telepon, WhatsApp, dan live chat.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- PRICING -->
    <section id="paket">
        <div class="container">
            <div class="section-header">
                <span class="section-tag">Paket Layanan</span>
                <h2>Pilih Paket Ses
