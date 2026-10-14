<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Indotel') - Internet Cepat, Stabil & Tanpa Batas</title>
    <meta name="description" content="@yield('description', 'Indotel menyediakan layanan internet fiber optik cepat, stabil, dan unlimited.')">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --navy: #0A2540; --navy-dark: #061829;
            --cyan: #00D4FF; --cyan-dark: #00A8CC;
            --white: #fff; --gray-light: #F5F7FA; --gray: #6B7A8F;
            --text: #1A2B42;
            --shadow: 0 10px 40px rgba(10,37,64,0.08);
            --shadow-lg: 0 20px 60px rgba(10,37,64,0.15);
            --transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
        }
        body { font-family: 'Poppins', sans-serif; color: var(--text); line-height: 1.6; background: var(--white); }
        a { text-decoration: none; color: inherit; }
        ul { list-style: none; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        
        /* Navbar */
        .navbar { position: fixed; top: 0; left: 0; width: 100%; padding: 18px 0; z-index: 1000; transition: var(--transition); background: rgba(10,37,64,0.95); backdrop-filter: blur(20px); }
        .navbar.scrolled { padding: 12px 0; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
        .nav-wrap { display: flex; justify-content: space-between; align-items: center; }
        .logo { display: flex; align-items: center; gap: 10px; font-size: 24px; font-weight: 800; color: #fff; }
        .logo-icon { width: 40px; height: 40px; background: linear-gradient(135deg, var(--cyan), var(--cyan-dark)); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--navy); font-size: 20px; }
        .logo span { color: var(--cyan); }
        .nav-menu { display: flex; gap: 32px; align-items: center; }
        .nav-menu a { color: rgba(255,255,255,0.85); font-weight: 500; font-size: 15px; transition: var(--transition); }
        .nav-menu a:hover, .nav-menu a.active { color: var(--cyan); }
        .nav-cta { display: flex; gap: 12px; align-items: center; }
        .btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 50px; font-weight: 600; font-size: 14px; cursor: pointer; border: none; transition: var(--transition); font-family: inherit; }
        .btn-primary { background: linear-gradient(135deg, var(--cyan), var(--cyan-dark)); color: var(--navy); box-shadow: 0 8px 24px rgba(0,212,255,0.35); }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,212,255,0.5); }
        .btn-outline { background: transparent; color: #fff; border: 2px solid rgba(255,255,255,0.3); }
        .btn-outline:hover { background: rgba(255,255,255,0.1); border-color: var(--cyan); color: var(--cyan); }
        .hamburger { display: none; background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; }
        
        /* Alert */
        .alert { padding: 16px 20px; border-radius: 12px; margin: 100px auto 0; max-width: 1200px; display: flex; gap: 12px; align-items: flex-start; font-size: 14px; }
        .alert-success { background: rgba(16,185,129,0.1); color: #10B981; border: 1px solid rgba(16,185,129,0.2); }
        .alert-error { background: rgba(239,68,68,0.1); color: #EF4444; border: 1px solid rgba(239,68,68,0.2); }
        
        @media (max-width: 768px) {
            .nav-menu { display: none; }
            .hamburger { display: block; }
        }
    </style>
    @yield('styles')
</head>
<body>
    <nav class="navbar" id="navbar">
        <div class="container nav-wrap">
            <a href="{{ route('home') }}" class="logo">
                <div class="logo-icon"><i class="fas fa-wifi"></i></div>
                Indo<span>tel</span>
            </a>
            <ul class="nav-menu">
                <li><a href="{{ route('home') }}" class="{{ request()->routeIs('home') ? 'active' : '' }}">Home</a></li>
                <li><a href="{{ route('home') }}#paket">Paket</a></li>
                <li><a href="{{ route('home') }}#coverage">Coverage</a></li>
                <li><a href="{{ route('about') }}" class="{{ request()->routeIs('about') ? 'active' : '' }}">Tentang</a></li>
                <li><a href="{{ route('blog') }}" class="{{ request()->routeIs('blog') ? 'active' : '' }}">Blog</a></li>
                <li><a href="{{ route('kontak') }}" class="{{ request()->routeIs('kontak') ? 'active' : '' }}">Kontak</a></li>
            </ul>
            <div class="nav-cta">
                @if(session('indotel_token'))
                    <a href="{{ route('dashboard.index') }}" class="btn btn-primary">
                        <i class="fas fa-tachometer-alt"></i> Dashboard
                    </a>
                @else
                    <a href="{{ route('login') }}" class="btn btn-outline">Masuk</a>
                    <a href="{{ route('register') }}" class="btn btn-primary">Daftar</a>
                @endif
                <button class="hamburger"><i class="fas fa-bars"></i></button>
            </div>
        </div>
    </nav>

    @if(session('success'))
        <div class="alert alert-success">
            <i class="fas fa-check-circle"></i>
            <span>{{ session('success') }}</span>
        </div>
    @endif

    @if(session('error'))
        <div class="alert alert-error">
            <i class="fas fa-exclamation-circle"></i>
            <span>{{ session('error') }}</span>
        </div>
    @endif

    @yield('content')

    <script>
        window.addEventListener('scroll', () => {
            document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
        });
    </script>
    @yield('scripts')
</body>
</html>
