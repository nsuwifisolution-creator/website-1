@extends('layouts.app')

@section('title', 'Blog')

@section('styles')
<style>
    .page-header { background: linear-gradient(135deg, #061829 0%, #0A2540 50%, #0d3055 100%); padding: 160px 0 80px; text-align: center; color: #fff; }
    .page-header h1 { font-size: clamp(2rem, 4.5vw, 3rem); font-weight: 800; margin-bottom: 16px; }
    .page-header p { color: rgba(255,255,255,0.75); font-size: 17px; }
    .blog-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 28px; }
    .blog-card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(10,37,64,0.08); transition: all 0.3s; }
    .blog-card:hover { transform: translateY(-8px); box-shadow: 0 20px 60px rgba(10,37,64,0.15); }
    .blog-card-image { height: 200px; background: linear-gradient(135deg, #0A2540, #0d3055); display: flex; align-items: center; justify-content: center; color: #00D4FF; font-size: 56px; }
    .blog-card-content { padding: 28px; }
    .blog-category { display: inline-block; background: rgba(0,212,255,0.1); color: #00A8CC; padding: 4px 12px; border-radius: 50px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
    .blog-card h3 { font-size: 19px; color: #0A2540; font-weight: 700; line-height: 1.35; margin-bottom: 12px; }
    .blog-card p { color: #6B7A8F; font-size: 14px; line-height: 1.7; margin-bottom: 16px; }
    .blog-meta { display: flex; gap: 16px; font-size: 12.5px; color: #6B7A8F; margin-bottom: 16px; }
</style>
@endsection

@section('content')
    <section class="page-header">
        <div class="container">
            <h1>Blog Indotel</h1>
            <p>Tips, tutorial, dan berita terbaru seputar teknologi internet.</p>
        </div>
    </section>

    <section>
        <div class="container">
            <div class="blog-grid">
                @foreach($posts as $post)
                    <article class="blog-card">
                        <div class="blog-card-image"><i class="fas {{ $post['icon'] }}"></i></div>
                        <div class="blog-card-content">
                            <span class="blog-category">{{ $post['category'] }}</span>
                            <h3>{{ $post['title'] }}</h3>
                            <p>{{ $post['excerpt'] }}</p>
                            <div class="blog-meta">
                                <span><i class="fas fa-calendar"></i> {{ $post['date'] }}</span>
                                <span><i class="fas fa-clock"></i> {{ $post['read_time'] }}</span>
                            </div>
                        </div>
                    </article>
                @endforeach
            </div>
        </div>
    </section>
@endsection
