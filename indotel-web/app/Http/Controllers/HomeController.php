<?php

namespace App\Http\Controllers;

use App\Services\IndotelApiService;

class HomeController extends Controller
{
    protected IndotelApiService $api;

    public function __construct(IndotelApiService $api)
    {
        $this->api = $api;
    }

    public function index()
    {
        $packages = $this->api->getPackages();
        return view('home', ['packages' => $packages['data'] ?? []]);
    }

    public function about()
    {
        return view('about');
    }

    public function blog()
    {
        $posts = [
            [
                'id' => 1,
                'title' => 'Panduan Lengkap Memilih Paket Internet untuk WFH',
                'excerpt' => 'Bekerja dari rumah membutuhkan koneksi internet yang stabil...',
                'category' => 'Tips & Tutorial',
                'date' => '10 Jan 2025',
                'read_time' => '8 menit',
                'icon' => 'fa-rocket',
            ],
            [
                'id' => 2,
                'title' => '5 Cara Meningkatkan Kecepatan WiFi di Rumah',
                'excerpt' => 'WiFi lambat? Coba 5 tips mudah ini untuk meningkatkan kecepatan...',
                'category' => 'Tips & Tutorial',
                'date' => '8 Jan 2025',
                'read_time' => '5 menit',
                'icon' => 'fa-wifi',
            ],
            [
                'id' => 3,
                'title' => 'Teknologi WiFi 7: Apa yang Perlu Anda Ketahui?',
                'excerpt' => 'WiFi 7 hadir dengan kecepatan hingga 46 Gbps...',
                'category' => 'Berita Teknologi',
                'date' => '2 Jan 2025',
                'read_time' => '7 menit',
                'icon' => 'fa-microchip',
            ],
        ];
        return view('blog', ['posts' => $posts]);
    }

    public function kontak()
    {
        return view('kontak');
    }
}
