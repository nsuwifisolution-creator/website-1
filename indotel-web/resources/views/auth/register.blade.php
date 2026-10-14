<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daftar - Indotel</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Poppins', sans-serif; min-height: 100vh; background: linear-gradient(135deg, #061829 0%, #0A2540 50%, #0d3055 100%); display: flex; align-items: center; justify-content: center; padding: 24px; }
        .register-box { background: white; border-radius: 24px; padding: 48px; max-width: 480px; width: 100%; box-shadow: 0 30px 80px rgba(0,0,0,0.3); }
        .logo { display: flex; align-items: center; gap: 10px; font-size: 24px; font-weight: 800; color: #0A2540; margin-bottom: 32px; justify-content: center; }
        .logo-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #00D4FF, #00A8CC); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #0A2540; font-size: 20px; }
        .logo span { color: #00D4FF; }
        h1 { font-size: 24px; color: #0A2540; margin-bottom: 8px; text-align: center; }
        .subtitle { color: #6B7A8F; font-size: 14px; text-align: center; margin-bottom: 32px; }
        .alert { padding: 12px 16px; border-radius: 12px; font-size: 13.5px; margin-bottom: 20px; display: flex; gap: 10px; align-items: center; }
        .alert-error { background: rgba(239,68,68,0.1); color: #EF4444; border: 1px solid rgba(239,68,68,0.2); }
        .form-group { margin-bottom: 18px; }
        label { display: block; font-size: 13.5px; font-weight: 600; color: #0A2540; margin-bottom: 8px; }
        input { width: 100%; padding: 14px 18px; border-radius: 12px; border: 2px solid #E8EDF3; font-family: inherit; font-size: 14.5px; transition: all 0.3s; outline: none; }
        input:focus { border-color: #00D4FF; box-shadow: 0 0 0 4px rgba(0,212,255,0.1); }
        .btn { width: 100%; padding: 15px; border-radius: 12px; border: none; background: linear-gradient(135deg, #00D4FF, #00A8CC); color: #0A2540; font-family: inherit; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.3s; box-shadow: 0 8px 24px rgba(0,212,255,0.35); }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,212,255,0.5); }
        .link { text-align: center; margin-top: 20px; font-size: 14px; color: #6B7A8F; }
        .link a { color: #00A8CC; text-decoration: none; font-weight: 600; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 480px) { .register-box { padding: 28px 20px; } .grid-2 { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div class="register-box">
        <a href="{{ route('home') }}" class="logo">
            <div class="logo-icon"><i class="fas fa-wifi"></i></div>
            Indo<span>tel</span>
        </a>

        <h1>Buat Akun Baru</h1>
        <p class="subtitle">Daftar gratis dan nikmati internet cepat Indotel</p>

        @if($errors->any())
            <div class="alert alert-error"><i class="fas fa-exclamation-circle"></i> {{ $errors->first() }}</div>
        @endif

        <form method="POST" action="{{ route('register') }}">
            @csrf
            <div class="form-group">
                <label>Nama Lengkap</label>
                <input type="text" name="name" value="{{ old('name') }}" placeholder="Nama lengkap Anda" required>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" name="email" value="{{ old('email') }}" placeholder="email@contoh.com" required>
            </div>
            <div class="form-group">
                <label>Nomor WhatsApp</label>
                <input type="tel" name="phone" value="{{ old('phone') }}" placeholder="081234567890" required>
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" name="password" placeholder="Min 8 karakter" required>
                </div>
                <div class="form-group">
                    <label>Konfirmasi</label>
                    <input type="password" name="password_confirmation" placeholder="Ulangi password" required>
                </div>
            </div>
            <button type="submit" class="btn"><i class="fas fa-user-plus"></i> Daftar Sekarang</button>
        </form>

        <div class="link">
            Sudah punya akun? <a href="{{ route('login') }}">Masuk di sini</a>
        </div>
    </div>
</body>
</html>
