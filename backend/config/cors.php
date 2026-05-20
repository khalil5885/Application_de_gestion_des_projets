<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'up'],

    'allowed_methods' => ['*'],

   'allowed_origins' => [
    env('FRONTEND_URL'),
    'http://localhost:3000',
    'http://localhost:8081',
    'http://127.0.0.1:8081',
    'http://192.168.1.120:8081',
    'http://192.168.1.120:19000',
    'http://192.168.1.120:8000',
    'http://192.168.1.120',
    'https://gift-crisping-eagle.ngrok-free.dev',  // <-- ADD THIS
],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];