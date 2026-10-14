<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureLoggedIn
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!session('indotel_token')) {
            return redirect()->route('login')
                ->with('error', 'Silakan login terlebih dahulu.');
        }
        return $next($request);
    }
}
