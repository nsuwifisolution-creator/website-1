<?php

return [
    'postmark' => ['token' => env('POSTMARK_TOKEN')],
    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],
    'indotel_api' => [
        'url' => env('INDOTEL_API_URL', 'http://api:3000/api'),
        'timeout' => env('INDOTEL_API_TIMEOUT', 30),
    ],
];
