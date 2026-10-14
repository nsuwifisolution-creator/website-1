@extends('layouts.dashboard')

@section('title', 'Profil Saya')
@section('page-title', 'Profil Saya')
@section('page-subtitle', 'Kelola informasi akun Anda')

@section('content')
    <div class="card">
        <div class="card-header">
            <h3><i class="fas fa-user"></i> Informasi Akun</h3>
        </div>

        <form method="POST" action="{{ route('dashboard.profile.update') }}">
            @csrf
            @method('PUT')

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;">
                <div>
                    <label style="display:block;font-size:12px;color:#6B7A8F;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:6px;">Nama Lengkap</label>
                    <input type="text" name="name" value="{{ old('name', $user['name'] ?? '') }}" style="width:100%;padding:12px 16px;border-radius:10px;border:2px solid #E8EDF3;font-family:inherit;">
                </div>
                <div>
                    <label style="display:block;font-size:12px;color:#6B7A8F;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:6px;">Email</label>
                    <input type="email" value="{{ $user['email'] ?? '' }}" disabled style="width:100%;padding:12px 16px;border-radius:10px;border:2px solid #E8EDF3;font-family:inherit;background:#F5F7FA;color:#6B7A8F;">
                </div>
                <div>
                    <label style="display:block;font-size:12px;color:#6B7A8F;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:6px;">Nomor WhatsApp</label>
                    <input type="tel" name="phone" value="{{ old('phone', $user['phone'] ?? '') }}" style="width:100%;padding:12px 16px;border-radius:10px;border:2px solid #E8EDF3;font-family:inherit;">
                </div>
                <div>
                    <label style="display:block;font-size:12px;color:#6B7A8F;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:6px;">Customer ID</label>
                    <input type="text" value="{{ $user['customerId'] ?? '' }}" disabled style="width:100%;padding:12px 16px;border-radius:10px;border:2px solid #E8EDF3;font-family:inherit;background:#F5F7FA;color:#6B7A8F;">
                </div>
            </div>

            <div style="margin-top:20px;">
                <label style="display:block;font-size:12px;color:#6B7A8F;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:6px;">Alamat</label>
                <textarea name="address" rows="3" style="width:100%;padding:12px 16px;border-radius:10px;border:2px solid #E8EDF3;font-family:inherit;resize:vertical;">{{ old('address', $user['address'] ?? '') }}</textarea>
            </div>

            <button type="submit" class="btn btn-primary" style="margin-top:20px;">
                <i class="fas fa-save"></i> Simpan Perubahan
            </button>
        </form>
    </div>
@endsection
