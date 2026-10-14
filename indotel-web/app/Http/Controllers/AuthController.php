<?php

namespace App\Http\Controllers;

use App\Services\IndotelApiService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    protected IndotelApiService $api;

    public function __construct(IndotelApiService $api)
    {
        $this->api = $api;
    }

    public function showLogin()
    {
        if (session('indotel_token')) {
            return redirect()->route('dashboard.index');
        }
        return view('auth.login');
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string',
            'password' => 'required|string|min:6',
        ], [
            'email.required' => 'Email/WhatsApp wajib diisi.',
            'password.required' => 'Password wajib diisi.',
        ]);

        $result = $this->api->login(
            $request->input('email'),
            $request->input('password')
        );

        if ($result['success'] ?? false) {
            return redirect()->route('dashboard.index')
                ->with('success', 'Login berhasil! Selamat datang, ' . ($result['data']['user']['name'] ?? 'User'));
        }

        return back()->withInput()
            ->with('error', $result['message'] ?? 'Login gagal.');
    }

    public function showRegister()
    {
        if (session('indotel_token')) {
            return redirect()->route('dashboard.index');
        }
        return view('auth.register');
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|min:3|max:100',
            'email' => 'required|email',
            'phone' => ['required', 'regex:/^(\+62|62|0)8[1-9][0-9]{6,11}$/'],
            'password' => 'required|string|min:8|confirmed',
        ], [
            'name.required' => 'Nama wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'phone.required' => 'Nomor WhatsApp wajib diisi.',
            'phone.regex' => 'Format nomor WhatsApp tidak valid.',
            'password.min' => 'Password minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
        ]);

        $result = $this->api->register($request->only(['name', 'email', 'phone', 'password']));

        if ($result['success'] ?? false) {
            $this->api->login($request->input('email'), $request->input('password'));
            return redirect()->route('dashboard.index')
                ->with('success', 'Pendaftaran berhasil! Selamat datang di Indotel.');
        }

        return back()->withInput()
            ->with('error', $result['message'] ?? 'Pendaftaran gagal.');
    }

    public function logout()
    {
        $this->api->logout();
        return redirect()->route('home')->with('success', 'Anda telah logout.');
    }
}
