<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ChatGroupType;
use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Http\Resources\ChatGroupResource;
use App\Http\Resources\ChatMessageResource;
use App\Models\ChatGroup;
use App\Models\ChatMessage;
use App\Models\Member;
use App\Models\User;
use App\Support\FamilySettings;
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
            ->with(['creator:id,name,role,member_id', 'creator.member:id,avatar_url'])
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
            // Frontend chỉ có id của bảng members, nên nhận member_ids rồi resolve sang user qua users.member_id.
            'member_ids' => ['nullable', 'array', 'min:1'],
            'member_ids.*' => ['integer', 'exists:members,id'],
            'family_id' => ['nullable', 'integer', 'exists:families,id'],
        ]);
        $familyId = $request->user()->role->value === 'admin' && $request->filled('family_id') ? $request->integer('family_id') : $request->user()->family_id;
        abort_if(! $familyId, 422, 'Tài khoản chưa được gán dòng họ.');
        $memberIds = array_values(array_unique(array_map('intval', $data['member_ids'] ?? [])));
        abort_if(Member::query()->whereIn('id', $memberIds)->where('family_id', $familyId)->count() !== count($memberIds), 422, 'Thành viên nhóm phải cùng dòng họ.');
        // Thành viên chưa có tài khoản sẽ bị bỏ qua vì bảng chat_group_members tham chiếu users.
        $userIds = User::query()->whereIn('member_id', $memberIds)->where('family_id', $familyId)->pluck('id');
        $userIds = $userIds->push($request->user()->id)->unique()->values();
        $group = DB::transaction(function () use ($data, $familyId, $request, $userIds): ChatGroup {
            $group = ChatGroup::query()->create(['family_id' => $familyId, 'name' => $data['name'], 'type' => $data['type'], 'created_by' => $request->user()->id]);
            $group->members()->sync($userIds->mapWithKeys(fn (int $id) => [$id => ['role' => $id === $request->user()->id ? 'owner' : 'member']]));

            return $group;
        });

        return response()->json(['data' => new ChatGroupResource($group->loadCount('members')->load(['creator:id,name,role,member_id', 'creator.member:id,avatar_url']))], 201);
    }

    public function messages(Request $request, ChatGroup $group)
    {
        $this->assertMember($request, $group);

        return ChatMessageResource::collection($group->messages()->with(['sender:id,name,role,member_id', 'sender.member:id,avatar_url'])->latest()->paginate(50));
    }

    public function sendMessage(Request $request, ChatGroup $group, ImageStorage $images): JsonResponse
    {
        $this->assertMember($request, $group);
        $data = $request->validate([
            'message_text' => ['nullable', 'string', 'max:5000'],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:10240'],
        ]);
        abort_if(empty($data['message_text']) && ! $request->hasFile('image'), 422, 'Vui lòng nhập nội dung hoặc chọn ảnh.');
        // Tin nhắn text vẫn gửi được khi chat mở; chỉ ảnh mới chịu ràng buộc quyền upload
        // mà Admin cấu hình trong family_settings.
        if ($request->hasFile('image')) {
            FamilySettings::assertCanUploadImages($request->user());
        }
        $message = $group->messages()->create([
            'sender_id' => $request->user()->id,
            'message_text' => $data['message_text'] ?? null,
            'image_url' => $request->hasFile('image') ? $images->storeWebp($request->file('image'), 'chat/'.$group->id, 1600, 78) : null,
        ]);
        $message->load('sender:id,name,role,member_id');
        // Broadcast là best-effort: ShouldBroadcastNow chạy đồng bộ nên Reverb sập sẽ biến
        // một lần gửi đã lưu thành lỗi 500, khiến client báo hỏng và retry tạo tin trùng.
        try {
            MessageSent::dispatch($message);
        } catch (\Throwable $broadcastError) {
            report($broadcastError);
        }

        return response()->json(['data' => new ChatMessageResource($message)], 201);
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
