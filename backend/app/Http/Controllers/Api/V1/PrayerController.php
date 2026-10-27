<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\PrayerCategory;
use App\Http\Controllers\Controller;
use App\Http\Resources\PrayerResource;
use App\Models\Prayer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PrayerController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'query' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', Rule::enum(PrayerCategory::class)],
        ]);
        $query = Prayer::query()->with('author:id,name');
        if ($request->user()->role->value !== 'admin') {
            $query->where('family_id', $request->user()->family_id);
        }
        $query->when(isset($filters['category']), fn ($builder) => $builder->where('category', $filters['category']))
            ->when(! empty($filters['query']), fn ($builder) => $builder->where(function ($nested) use ($filters): void {
                $nested->where('title', 'like', "%{$filters['query']}%")->orWhere('content', 'like', "%{$filters['query']}%");
            }));

        return PrayerResource::collection($query->latest()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'family_id' => ['nullable', 'integer', 'exists:families,id'],
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', Rule::enum(PrayerCategory::class)],
            'content' => ['required', 'string', 'min:20', 'max:100000'],
        ]);
        $familyId = $data['family_id'] ?? $request->user()->family_id;
        abort_if(! $familyId, 422, 'Tài khoản chưa được gán dòng họ.');
        $prayer = Prayer::query()->create(['family_id' => $familyId, 'title' => $data['title'], 'category' => $data['category'], 'content' => $data['content'], 'author_id' => $request->user()->id]);

        return response()->json(['data' => new PrayerResource($prayer->load('author:id,name'))], 201);
    }

    public function show(Request $request, Prayer $prayer): PrayerResource
    {
        abort_if($request->user()->role->value !== 'admin' && (int) $prayer->family_id !== (int) $request->user()->family_id, 403);

        return new PrayerResource($prayer->load('author:id,name'));
    }

    public function update(Request $request, Prayer $prayer): PrayerResource
    {
        abort_if($request->user()->role->value !== 'admin' && (int) $prayer->family_id !== (int) $request->user()->family_id, 403);
        $data = $request->validate(['title' => ['sometimes', 'string', 'max:255'], 'category' => ['sometimes', Rule::enum(PrayerCategory::class)], 'content' => ['sometimes', 'string', 'min:20', 'max:100000']]);
        $prayer->update($data);

        return new PrayerResource($prayer->fresh('author'));
    }

    public function destroy(Request $request, Prayer $prayer): JsonResponse
    {
        abort_if($request->user()->role->value !== 'admin' && (int) $prayer->family_id !== (int) $request->user()->family_id, 403);
        $prayer->delete();

        return response()->json(['message' => 'Đã xóa bài văn.']);
    }
}
