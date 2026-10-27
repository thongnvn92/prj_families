<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\AiAssistant;
use App\Support\FamilyContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Trợ lý AI Gia tộc: tra cứu gia phả, phong tục, nghi lễ và văn cúng truyền thống.
 * Chỉ thành viên dòng họ (member/editor/mod/admin) được dùng — Guest bị chặn 403.
 */
class AiController extends Controller
{
    public function chat(Request $request): JsonResponse
    {
        $data = $request->validate([
            'prompt' => ['required', 'string', 'min:3', 'max:2000'],
            'family_id' => ['nullable', 'integer', 'exists:families,id'],
        ]);

        $context = FamilyContext::forUser($request->user(), $data['family_id'] ?? null);
        $answer = (new AiAssistant($context))->answer($data['prompt']);

        return response()->json([
            'data' => [
                'id' => (string) Str::uuid(),
                'prompt' => $data['prompt'],
                'text' => $answer->text,
                'references' => $answer->references,
                'driver' => $answer->driver,
                'created_at' => now()->toIso8601String(),
            ],
            'context' => $context->toArray(),
        ]);
    }

    /**
     * Gợi ý câu hỏi sinh từ ngữ cảnh gia phả để frontend hiển thị chip gợi ý.
     */
    public function suggestions(Request $request): JsonResponse
    {
        $data = $request->validate(['family_id' => ['nullable', 'integer', 'exists:families,id']]);
        $context = FamilyContext::forUser($request->user(), $data['family_id'] ?? null);

        return response()->json([
            'data' => (new AiAssistant($context))->suggestions(),
            'context' => $context->toArray(),
            'driver' => $this->activeDriver(),
        ]);
    }

    /** Trạng thái driver để UI hiển thị minh bạch: đang dùng LLM hay fallback nội bộ. */
    public function status(Request $request): JsonResponse
    {
        $context = FamilyContext::forUser($request->user());

        return response()->json([
            'data' => [
                'driver' => $this->activeDriver(),
                'model' => config('ai.model'),
                'family_name' => $context->family->name,
                'total_members' => $context->totalMembers,
                'upcoming_events' => $context->upcomingEvents->count(),
            ],
        ]);
    }

    private function activeDriver(): string
    {
        return config('ai.driver') !== 'fallback' && filled(config('ai.api_key')) ? 'openai' : 'fallback';
    }
}
