<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Masuk - Indotel</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Poppins', sans-serif; min-height: 100vh; background: linear-gradient(135deg, #061829 0%, #0A2540 50%, #0d3055 100%); display: flex; align-items: center; justify-content: center; padding: 24px; }
        .login-box { background: white; border-radius: 24px; padding: 48px; max-width: 440px; width: 100%; box-shadow: 0 30px 80px rgba(0,0,0,0.3); }
        .logo { display: flex; align-items: center; gap: 10px; font-size: 24px; font-weight: 800; color: #0A2540; margin-bottom: 32px; justify-content: center; }
        .logo-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #00D4FF, #00A8CC); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #0A2540; font-size: 20px; }
        .logo span { color: #00D4FF; }
        h1 { font-size: 24px; color: #0A2540; margin-bottom: 8px; text-align: center; }
        .subtitle { color: #6B7A8F; font-size: 14px; text-align: center; margin-bottom: 32px; }
        .alert { padding: 12px 16px; border-radius: 12px; font-size: 13.5px; margin-bottom: 20px; display: flex; gap: 10px; align-items: center; }
        .alert-error { background: rgba(239,68,68,0.1); color: #EF4444; border: 1px solid rgba(239,68,68,0.2); }
        .alert-success { background: rgba(16,185,129,0.1); color: #10B981; border: 1px solid rgba(16,185,129,0.2); }
        .form-group { margin-bottom: 18px; }
        label { display: block; font-size: 13.5px; font-weight: 600; color: #0A2540; margin-bottom: 8px; }
        input { width: 100%; padding: 14px 18px; border-radius: 12px; border: 2px solid #E8EDF3; font-family: inherit; font-size: 14.5px; transition: all 0.3s; outline: none; }
        input:focus { border-color: #00D4FF; box-shadow: 0 0 0 4px rgba(0,212,255,0.1); }
        .btn { width: 100%; padding: 15px; border-radius: 12px; border: none; background: linear-gradient(135deg, #00D4FF, #00A8CC); color: #0A2540; font-family: inherit; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.3s; box-shadow: 0 8px 24px rgba(0,212,255,0.35); }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,212,255,0.5); }
        .link { text-align: center; margin-top: 20px; font-size: 14px; color: #6B7A8F; }
        .link a { color: #00A8CC; text-decoration: none; font-weight: 600; }
        .demo-info { background: #F5F7FA; border-radius: 12px; padding: 14px 18px; margin-top: 24px; font-size: 12.5px; color: #6B7A8F; line-height: 1.7; }
        .demo-info strong { color: #0A2540; }
    </style>
</head>
<body>
    <div class="login-box">
        <a href="{{ route('home') }}" class="logo">
            <div class="logo-icon"><i class="fas fa-wifi"></i></div>
            Indo<span>tel</span>
        </a>

        <h1>Masuk ke Akun Anda</h1>
        <p class="subtitle">Kelola layanan internet Anda dengan mudah</p>

        @if(session('error'))
            <div class="alert alert-error"><i class="fas fa-exclamation-circle"></i> {{ session('error') }}</div>
        @endif
        @if(session('success'))
            <div class="alert alert-success"><i class="fas fa-check-circle"></i> {{ session('success') }}</div>
        @endif
        @if($errors->any())
            <div class="alert alert-error"><i class="fas fa-exclamation-circle"></i> {{ $errors->first() }}</div>
        @endif

        <form method="POST" action="{{ route('login') }}">
            @csrf
            <div class="form-group">
                <label>Email atau WhatsApp</label>
                <input type="text" name="email" value="{{ old('email') }}" placeholder="email@contoh.com atau 08xx" required autofocus>
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" name="password" placeholder="Masukkan password" required>
            </div>
            <button type="submit" class="btn"><i class="fas fa-sign-in-alt"></i> Masuk</button>
        </form>

        <div class="link">
            Belum punya akun? <a href="{{ route('register') }}">Daftar sekarang</a>
        </div>

        <div class="demo-info">
            <strong>🔑 Demo Login:</strong><br>
            Email: demo@indotel.id<br>
            Password: Demo123!
        </div>
    </div>
</body>
</html>
