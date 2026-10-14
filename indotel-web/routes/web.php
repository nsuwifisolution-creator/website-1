<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeController;

// PUBLIC
Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/about', [HomeController::class, 'about'])->name('about');
Route::get('/blog', [HomeController::class, 'blog'])->name('blog');
Route::get('/kontak', [HomeController::class, 'kontak'])->name('kontak');

// AUTH
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [AuthController::class, 'register']);
});

Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// DASHBOARD
Route::middleware('auth.indotel')
    ->prefix('dashboard')
    ->name('dashboard.')
    ->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('index');
        Route::get('/packages', [DashboardController::class, 'packages'])->name('packages');
        Route::post('/subscribe', [DashboardController::class, 'subscribe'])->name('subscribe');
        Route::get('/invoices', [DashboardController::class, 'invoices'])->name('invoices');
        Route::get('/invoices/{id}', [DashboardController::class, 'showInvoice'])->name('invoices.show');
        Route::post('/invoices/{id}/pay', [DashboardController::class, 'payInvoice'])->name('invoices.pay');
        Route::get('/usage', [DashboardController::class, 'usage'])->name('usage');
        Route::get('/support', [DashboardController::class, 'support'])->name('support');
        Route::post('/support', [DashboardController::class, 'createTicket'])->name('support.create');
        Route::get('/profile', [DashboardController::class, 'profile'])->name('profile');
        Route::put('/profile', [DashboardController::class, 'updateProfile'])->name('profile.update');
    });
