<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\PhotoCategory;
use App\Enums\PhotoVisibility;
use App\Http\Controllers\Controller;
use App\Http\Resources\AlbumPhotoResource;
use App\Models\AlbumPhoto;
use App\Support\FamilyScope;
use App\Support\ImageStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class AlbumController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'category' => ['nullable', Rule::enum(PhotoCategory::class)],
            'event_date' => ['nullable', 'date'],
            'family_id' => ['nullable', 'integer', 'exists:families,id'],
        ]);
        $user = $request->user();
        $query = AlbumPhoto::query()->with('uploader:id,name');
        if (! $user || $user->role->value === 'guest') {
            $query->where('visibility', PhotoVisibility::Public)->where('family_id', FamilyScope::publicFamilyId(isset($filters['family_id']) ? (int) $filters['family_id'] : null));
        } else {
            FamilyScope::constrain($query, $user, 'family_id', false);
        }
        $query->when(isset($filters['category']), fn ($builder) => $builder->where('category', $filters['category']))
            ->when(isset($filters['event_date']), fn ($builder) => $builder->whereDate('event_date', $filters['event_date']));

        return AlbumPhotoResource::collection($query->latest('event_date')->latest('id')->paginate(30));
    }

    public function store(Request $request, ImageStorage $images): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'image' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:10240', 'dimensions:min_width=100,min_height=100'],
            'event_date' => ['nullable', 'date'],
            'category' => ['required', Rule::enum(PhotoCategory::class)],
            'visibility' => ['required', Rule::enum(PhotoVisibility::class)],
            'family_id' => ['nullable', 'integer', 'exists:families,id'],
        ]);
        $user = $request->user();
        $familyId = $user->role->value === 'admin' && $request->filled('family_id') ? $request->integer('family_id') : $user->family_id;
        abort_if(! $familyId, 422, 'Tài khoản chưa được gán dòng họ.');
        $url = $images->storeWebp($request->file('image'), 'album/'.$familyId);
        $photo = AlbumPhoto::query()->create([
            'family_id' => $familyId,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'image_url' => $url,
            'event_date' => $data['event_date'] ?? null,
            'category' => $data['category'],
            'visibility' => $data['visibility'],
            'uploaded_by' => $request->user()->id,
        ]);

        return response()->json(['data' => new AlbumPhotoResource($photo)], 201);
    }

    public function show(Request $request, AlbumPhoto $photo): AlbumPhotoResource
    {
        $user = $request->user();
        if (! $user || $user->role->value === 'guest') {
            $familyId = FamilyScope::publicFamilyId($request->integer('family_id') ?: null);
            abort_unless($photo->visibility->value === 'public' && (int) $photo->family_id === $familyId, 404);
        } else {
            abort_if($user->role->value !== 'admin' && (int) $photo->family_id !== (int) $user->family_id, 403);
        }

        return new AlbumPhotoResource($photo->load('uploader:id,name'));
    }

    public function destroy(Request $request, AlbumPhoto $photo, ImageStorage $images): JsonResponse
    {
        $user = $request->user();
        if ($user->role->value !== 'admin' && (int) $photo->family_id !== (int) $user->family_id) {
            abort(403);
        }
        abort_unless($user->role->value === 'admin' || $user->role->value === 'mod' || (int) $photo->uploaded_by === (int) $user->id, 403);
        $images->delete($photo->image_url);
        $photo->delete();

        return response()->json(['message' => 'Đã xóa ảnh.']);
    }
}
