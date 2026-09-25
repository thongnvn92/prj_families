<?php

$frontendOrigins = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('FRONTEND_URLS', env('FRONTEND_URL', 'http://127.0.0.1:5173')))
)));

return [
    'paths' => ['api/*', 'broadcasting/auth', 'oauth/token', 'oauth/token/refresh'],
    'allowed_methods' => ['*'],
    'allowed_origins' => $frontendOrigins,
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
