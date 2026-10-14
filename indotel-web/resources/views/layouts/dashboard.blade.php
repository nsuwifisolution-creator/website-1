<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Dashboard') - Indotel</title>
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
            --success: #10B981; --warning: #F59E0B; --danger: #EF4444;
        }
        body { font-family: 'Poppins', sans-serif; color: var(--text); background: var(--gray-light); line-height: 1.6; }
        a { text-decoration: none; color: inherit; }
        ul { list-style: none; }
        
        /* Sidebar */
        .sidebar { position: fixed; top: 0; left: 0; width: 260px; height: 100vh; background: linear-gradient(180deg, var(--navy-dark), var(--navy)); padding: 24px 16px; z-index: 100; display: flex; flex-direction: column; transition: var(--transition); overflow-y: auto; }
        .sidebar-logo { display: flex; align-items: center; gap: 10px; padding: 8px 12px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 20px; font-size: 22px; font-weight: 800; color: #fff; }
        .sidebar-logo-icon { width: 36px; height: 36px; background: linear-gradient(135deg, var(--cyan), var(--cyan-dark)); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--navy); font-size: 18px; }
        .sidebar-logo span { color: var(--cyan); }
        .sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .nav-section-title { color: rgba(255,255,255,0.4); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; padding: 16px 12px 8px; }
        .sidebar-link { display: flex; align-items: center; gap: 12px; padding: 12px 14px; color: rgba(255,255,255,0.7); font-size: 14px; font-weight: 500; border-radius: 10px; transition: var(--transition); }
        .sidebar-link i { width: 20px; font-size: 15px; text-align: center; }
        .sidebar-link:hover { background: rgba(0,212,255,0.08); color: #fff; }
        .sidebar-link.active { background: linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.05)); color: var(--cyan); border-left: 3px solid var(--cyan); padding-left: 11px; }
        
        /* Main */
        .main-content { margin-left: 260px; min-height: 100vh; }
        .topbar { background: #fff; padding: 16px 32px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 12px rgba(10,37,64,0.04); position: sticky; top: 0; z-index: 50; }
        .topbar h1 { font-size: 20px; font-weight: 700; color: var(--navy); }
        .topbar h1 span { color: var(--gray); font-size: 13px; font-weight: 400; display: block; margin-top: 2px; }
        .user-info { display: flex; align-items: center; gap: 12px; }
        .user-avatar { width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, var(--cyan), var(--cyan-dark)); display: flex; align-items: center; justify-content: center; color: var(--navy); font-weight: 700; }
        
        .dashboard-content { padding: 32px; max-width: 1400px; }
        
        /* Cards */
        .card { background: #fff; border-radius: 16px; padding: 28px; box-shadow: var(--shadow); margin-bottom: 24px; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
        .card-header h3 { font-size: 18px; font-weight: 700; color: var(--navy); display: flex; align-items: center; gap: 10px; }
        .card-header h3 i { color: var(--cyan-dark); }
        
        .btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; border: none; transition: var(--transition); font-family: inherit; }
        .btn-primary { background: linear-gradient(135deg, var(--cyan), var(--cyan-dark)); color: var(--navy); box-shadow: 0 8px 20px rgba(0,212,255,0.3); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(0,212,255,0.45); }
        .btn-sm { padding: 8px 16px; font-size: 13px; border-radius: 10px; }
        .btn-outline { background: transparent; color: var(--navy); border: 2px solid #E8EDF3; }
        .btn-outline:hover { border-color: var(--navy); }
        
        /* Alert */
        .alert { padding: 14px 20px; border-radius: 12px; margin-bottom: 20px; display: flex; gap: 12px; align-items: flex-start; font-size: 14px; }
        .alert-success { background: rgba(16,185,129,0.1); color: var(--success); border: 1px solid rgba(16,185,129,0.2); }
        .alert-error { background: rgba(239,68,68,0.1); color: var(--danger); border: 1px solid rgba(239,68,68,0.2); }
        
        /* Stats */
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 28px; }
        .stat-card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: var(--shadow); transition: var(--transition); }
        .stat-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
        .stat-card-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 16px; }
        .stat-card-icon.cyan { background: rgba(0,212,255,0.1); color: var(--cyan-dark); }
        .stat-card-icon.green { background: rgba(16,185,129,0.1); color: var(--success); }
        .stat-card-icon.orange { background: rgba(245,158,11,0.1); color: var(--warning); }
        .stat-card-icon.purple { background: rgba(139,92,246,0.1); color: #8B5CF6; }
        .stat-card h3 { font-size: 26px; font-weight: 800; color: var(--navy); margin-bottom: 6px; letter-spacing: -1px; }
        .stat-card p { color: var(--gray); font-size: 13.5px; }
        
        @media (max-width: 1024px) {
            .sidebar { transform: translateX(-100%); }
            .sidebar.open { transform: translateX(0); }
            .main-content { margin-left: 0; }
        }
        @media (max-width: 768px) {
            .dashboard-content { padding: 20px 16px; }
            .topbar { padding: 12px 16px; }
            .stats-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
        }
    </style>
    @yield('styles')
</head>
<body>
    <aside class="sidebar">
        <a href="{{ route('home') }}" class="sidebar-logo">
            <div class="sidebar-logo-icon"><i class="fas fa-wifi"></i></div>
            Indo<span>tel</span>
        </a>
        <nav class="sidebar-nav">
            <div class="nav-section-title">Menu Utama</div>
            <a href="{{ route('dashboard.index') }}" class="sidebar-link {{ request()->routeIs('dashboard.index') ? 'active' : '' }}">
                <i class="fas fa-home"></i> Dashboard
            </a>
            <a href="{{ route('dashboard.packages') }}" class="sidebar-link {{ request()->routeIs('dashboard.packages') ? 'active' : '' }}">
                <i class="fas fa-tags"></i> Paket Layanan
            </a>
            <a href="{{ route('dashboard.invoices') }}" class="sidebar-link {{ request()->routeIs('dashboard.invoices*') ? 'active' : '' }}">
                <i class="fas fa-file-invoice-dollar"></i> Tagihan
            </a>
            <a href="{{ route('dashboard.usage') }}" class="sidebar-link {{ request()->routeIs('dashboard.usage') ? 'active' : '' }}">
                <i class="fas fa-chart-line"></i> Penggunaan
            </a>
            <div class="nav-section-title">Akun</div>
            <a href="{{ route('dashboard.profile') }}" class="sidebar-link {{ request()->routeIs('dashboard.profile') ? 'active' : '' }}">
                <i class="fas fa-user"></i> Profil Saya
            </a>
            <a href="{{ route('dashboard.support') }}" class="sidebar-link {{ request()->routeIs('dashboard.support') ? 'active' : '' }}">
                <i class="fas fa-headset"></i> Bantuan
            </a>
            <form method="POST" action="{{ route('logout') }}" style="margin-top: 8px;">
                @csrf
                <button type="submit" class="sidebar-link" style="width: 100%; border: none; background: none; cursor: pointer; text-align: left; font-family: inherit;">
                    <i class="fas fa-sign-out-alt"></i> Keluar
                </button>
            </form>
        </nav>
    </aside>

    <main class="main-content">
        <div class="topbar">
            <h1>@yield('page-title', 'Dashboard') <span>@yield('page-subtitle', '')</span></h1>
            <div class="user-info">
                <div class="user-avatar">{{ strtoupper(substr(session('indotel_user.name', 'U'), 0, 1)) }}</div>
                <div>
                    <div style="font-weight:600;font-size:14px;">{{ session('indotel_user.name', 'User') }}</div>
                    <div style="font-size:12px;color:var(--gray);">{{ session('indotel_user.email', '') }}</div>
                </div>
            </div>
        </div>

        <div class="dashboard-content">
            @if(session('success'))
                <div class="alert alert-success">
                    <i class="fas fa-check-circle"></i> {{ session('success') }}
                </div>
            @endif
            @if(session('error'))
                <div class="alert alert-error">
                    <i class="fas fa-exclamation-circle"></i> {{ session('error') }}
                </div>
            @endif

            @yield('content')
        </div>
    </main>
    @yield('scripts')
</body>
</html>
