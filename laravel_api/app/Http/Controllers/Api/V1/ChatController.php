<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ChatGroupType;
use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Http\Resources\ChatGroupResource;
use App\Http\Resources\ChatMessageResource;
use App\Models\ChatGroup;
use App\Models\ChatMessage;
use App\Models\User;
use App\Support\ImageStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ChatController extends Controller
{
    public function index(Request $request)
    {
        $query = ChatGroup::query()
            ->with('creator:id,name,role')
            ->withCount('members')
            ->addSelect(['last_message' => ChatMessage::query()
                ->select('message_text')
                ->whereColumn('chat_messages.group_id', 'chat_groups.id')
                ->latest('id')
                ->limit(1)]);
        if ($request->user()->role->value !== 'admin') {
            $query->where('family_id', $request->user()->family_id)->whereHas('members', fn ($memberQuery) => $memberQuery->whereKey($request->user()->id));
        }

        return ChatGroupResource::collection($query->latest('id')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::enum(ChatGroupType::class)],
            'member_ids' => ['nullable', 'array', 'min:1'],
            'member_ids.*' => ['integer', 'exists:users,id'],
            'family_id' => ['nullable', 'integer', 'exists:families,id'],
        ]);
        $familyId = $request->user()->role->value === 'admin' && $request->filled('family_id') ? $request->integer('family_id') : $request->user()->family_id;
        abort_if(! $familyId, 422, 'Tài khoản chưa được gán dòng họ.');
        $members = User::query()->whereIn('id', array_unique(array_merge([$request->user()->id], $data['member_ids'] ?? [])))->where('family_id', $familyId)->pluck('id');
        abort_if(count($members) !== count(array_unique(array_merge([$request->user()->id], $data['member_ids'] ?? []))), 422, 'Thành viên nhóm phải cùng dòng họ.');
        $group = DB::transaction(function () use ($data, $familyId, $request, $members): ChatGroup {
            $group = ChatGroup::query()->create(['family_id' => $familyId, 'name' => $data['name'], 'type' => $data['type'], 'created_by' => $request->user()->id]);
            $group->members()->sync($members->mapWithKeys(fn (int $id) => [$id => ['role' => $id === $request->user()->id ? 'owner' : 'member']]));

            return $group;
        });

        return response()->json(['data' => new ChatGroupResource($group->loadCount('members')->load('creator:id,name,role'))], 201);
    }

    public function messages(Request $request, ChatGroup $group)
    {
        $this->assertMember($request, $group);

        return ChatMessageResource::collection($group->messages()->with('sender:id,name,role,member_id')->latest()->paginate(50));
    }

    public function sendMessage(Request $request, ChatGroup $group, ImageStorage $images): JsonResponse
    {
        $this->assertMember($request, $group);
        $data = $request->validate([
            'message_text' => ['nullable', 'string', 'max:5000'],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:10240'],
        ]);
        abort_if(empty($data['message_text']) && ! $request->hasFile('image'), 422, 'Vui lòng nhập nội dung hoặc chọn ảnh.');
        $message = $group->messages()->create([
            'sender_id' => $request->user()->id,
            'message_text' => $data['message_text'] ?? null,
            'image_url' => $request->hasFile('image') ? $images->storeWebp($request->file('image'), 'chat/'.$group->id, 1600, 78) : null,
        ]);
        MessageSent::dispatch($message->load('sender:id,name,role,member_id'));

        return response()->json(['data' => new ChatMessageResource($message->load('sender:id,name,role,member_id'))], 201);
    }

    private function assertMember(Request $request, ChatGroup $group): void
    {
        $user = $request->user();
        if ($user->role->value === 'admin') {
            return;
        }
        abort_if($user->family_id === null, 403, 'Tài khoản chưa được gán dòng họ.');
        abort_unless((int) $group->family_id === (int) $user->family_id, 403, 'Bạn không được truy cập nhóm chat ngoài dòng họ.');
        abort_unless($group->members()->whereKey($user->id)->exists(), 403, 'Bạn không phải là thành viên của nhóm chat.');
    }
}
