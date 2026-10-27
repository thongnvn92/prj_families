<?php

return [
    /*
    |--------------------------------------------------------------------------
    | AI Assistant
    |--------------------------------------------------------------------------
    |
    | Trợ lý AI Gia tộc dùng một driver hội thoại tương thích OpenAI (OpenAI,
    | OpenRouter, Ollama, vLLM, LM Studio...). Khi chưa cấu hình API key, hệ
    | thống tự động dùng "fallback driver" dựa trên ngữ cảnh gia tộc lấy từ DB
    | nên màn hình vẫn hoạt động và trả lời được trong môi trường local.
    |
    */
    'driver' => env('AI_DRIVER', env('AI_API_KEY') ? 'openai' : 'fallback'),

    'api_key' => env('AI_API_KEY'),
    'base_url' => env('AI_BASE_URL', 'https://api.openai.com/v1'),
    'model' => env('AI_MODEL', 'gpt-4o-mini'),
    'timeout' => (int) env('AI_TIMEOUT', 20),

    // Giới hạn ngữ cảnh đưa vào system prompt để câu trả lời bám sát gia phả.
    'context' => [
        'max_members' => (int) env('AI_CONTEXT_MAX_MEMBERS', 12),
        'max_events' => (int) env('AI_CONTEXT_MAX_EVENTS', 5),
        'max_rituals' => (int) env('AI_CONTEXT_MAX_RITUALS', 3),
    ],
];
