@extends('layouts.app')

@section('title', 'Kontak')

@section('styles')
<style>
    .page-header { background: linear-gradient(135deg, #061829 0%, #0A2540 50%, #0d3055 100%); padding: 160px 0 80px; text-align: center; color: #fff; }
    .page-header h1 { font-size: clamp(2rem, 4.5vw, 3rem); font-weight: 800; margin-bottom: 16px; }
    .page-header p { color: rgba(255,255,255,0.75); font-size: 17px; }
    .contact-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; }
    .contact-card { background: #fff; padding: 32px 24px; border-radius: 16px; text-align: center; box-shadow: 0 10px 40px rgba(10,37,64,0.08); transition: all 0.3s; }
    .contact-card:hover { transform: translateY(-6px); box-shadow: 0 20px 60px rgba(10,37,64,0.15); }
    .contact-card i { font-size: 36px; color: #00A8CC; margin-bottom: 16px; }
    .contact-card h3 { color: #0A2540; margin-bottom: 8px; font-size: 17px; }
    .contact-card p { color: #6B7A8F; font-size: 14px; line-height: 1.7; }
    .contact-card a { color: #00A8CC; font-weight: 600; text-decoration: none; }
</style>
@endsection

@section('content')
    <section class="page-header">
        <div class="container">
            <h1>Hubungi Kami</h1>
            <p>Tim Indotel siap membantu Anda 24/7.</p>
        </div>
    </section>

    <section>
        <div class="container">
            <div class="contact-grid">
                <div class="contact-card">
                    <i class="fas fa-phone-alt"></i>
                    <h3>Telepon</h3>
                    <p>Senin - Minggu, 24 jam<br><a href="tel:+622112345678">(021) 1234-5678</a></p>
                </div>
                <div class="contact-card">
                    <i class="fab fa-whatsapp"></i>
                    <h3>WhatsApp</h3>
                    <p>Respon cepat dalam 5 menit<br><a href="https://wa.me/6281234567890">+62 812-3456-7890</a></p>
                </div>
                <div class="contact-card">
                    <i class="fas fa-envelope"></i>
                    <h3>Email</h3>
                    <p>Untuk pertanyaan & kerja sama<br><a href="mailto:info@indotel.id">info@indotel.id</a></p>
                </div>
                <div class="contact-card">
                    <i class="fas fa-map-marker-alt"></i>
                    <h3>Kantor Pusat</h3>
                    <p>Jl. Teknologi Digital No. 88<br>Jakarta Selatan 12190</p>
                </div>
            </div>
        </div>
    </section>
@endsection
