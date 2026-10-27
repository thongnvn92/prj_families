<?php

namespace Tests\Feature;

use App\Enums\PhotoCategory;
use App\Enums\PhotoVisibility;
use App\Enums\UserRole;
use App\Models\AlbumPhoto;
use App\Models\Family;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Passport\Passport;
use Tests\TestCase;

class AlbumApiTest extends TestCase
{
    use DatabaseTransactions;

    public function test_editor_uploads_photo_with_tags_and_uploader_name(): void
    {
        Storage::fake('public');
        $user = $this->userFor(UserRole::Editor);
        Passport::actingAs($user);

        $response = $this->post('/api/v1/album', [
            'title' => 'Họp mặt dòng họ mùa xuân',
            'description' => 'Các chi tụ họp tại khu di tích.',
            'event_date' => '2026-02-10',
            'category' => PhotoCategory::Reunion->value,
            'visibility' => PhotoVisibility::Public->value,
            'tags' => ['Bắc Ninh', '  Họp mặt  ', ''],
            'image' => UploadedFile::fake()->image('hop-mat.jpg', 800, 600),
        ], ['Accept' => 'application/json'])->assertCreated()
            ->assertJsonPath('data.title', 'Họp mặt dòng họ mùa xuân')
            ->assertJsonPath('data.uploader_name', $user->name)
            ->assertJsonPath('data.category', PhotoCategory::Reunion->value);

        $this->assertSame(['Bắc Ninh', 'Họp mặt'], $response->json('data.tags'), 'Phải trim và loại thẻ rỗng.');
        $this->assertDatabaseHas('album_photos', ['id' => $response->json('data.id'), 'uploaded_by' => $user->id]);
        $this->assertCount(1, Storage::disk('public')->files('album/'.$user->family_id));
    }

    public function test_guest_is_rejected_when_reading_the_album(): void
    {
        $editor = $this->userFor(UserRole::Editor);
        $this->photo($editor, PhotoVisibility::Public);
        $this->photo($editor, PhotoVisibility::Family, ['title' => 'Ảnh nội bộ']);

        // Album là dữ liệu nội bộ: không token trả 401.
        $this->getJson('/api/v1/album')->assertUnauthorized();

        // Có token nhưng thuộc vai trò guest vẫn bị chặn 403, kể cả ảnh visibility=public.
        Passport::actingAs($this->userFor(UserRole::Guest, $editor->family_id));
        $this->getJson('/api/v1/album')->assertForbidden();
    }

    public function test_guest_cannot_open_a_photo(): void
    {
        $public = $this->photo($this->userFor(UserRole::Editor), PhotoVisibility::Public);
        $private = $this->photo($this->userFor(UserRole::Editor), PhotoVisibility::Family);

        $this->getJson("/api/v1/album/{$public->id}")->assertUnauthorized();
        $this->getJson("/api/v1/album/{$private->id}")->assertUnauthorized();
    }

    public function test_member_sees_both_visibilities_with_uploader_name(): void
    {
        $editor = $this->userFor(UserRole::Editor);
        $this->photo($editor, PhotoVisibility::Public);
        $this->photo($editor, PhotoVisibility::Family);
        Passport::actingAs($this->userFor(UserRole::Member, $editor->family_id));

        $payload = $this->getJson('/api/v1/album')->assertOk()->json('data');

        $this->assertCount(2, $payload);
        $this->assertSame($editor->name, $payload[0]['uploader_name']);
    }

    public function test_category_filter_is_applied(): void
    {
        $editor = $this->userFor(UserRole::Editor);
        $this->photo($editor, PhotoVisibility::Public, ['category' => PhotoCategory::Tet->value, 'title' => 'Mâm cúng đầu xuân']);
        $this->photo($editor, PhotoVisibility::Public, ['category' => PhotoCategory::General->value]);
        Passport::actingAs($this->userFor(UserRole::Member, $editor->family_id));

        $payload = $this->getJson('/api/v1/album?category=tet')->assertOk()->json('data');

        $this->assertCount(1, $payload);
        $this->assertSame(PhotoCategory::Tet->value, $payload[0]['category']);
    }

    public function test_member_cannot_upload_photo(): void
    {
        Storage::fake('public');
        Passport::actingAs($this->userFor(UserRole::Member));

        $this->post('/api/v1/album', [
            'title' => 'Ảnh trái phép',
            'category' => PhotoCategory::General->value,
            'visibility' => PhotoVisibility::Public->value,
            'image' => UploadedFile::fake()->image('x.jpg', 400, 400),
        ], ['Accept' => 'application/json'])->assertForbidden();

        $this->assertDatabaseCount('album_photos', 0);
    }

    public function test_upload_requires_image_and_valid_category(): void
    {
        Storage::fake('public');
        Passport::actingAs($this->userFor(UserRole::Editor));

        $this->post('/api/v1/album', [
            'title' => 'Thiếu ảnh',
            'category' => PhotoCategory::General->value,
            'visibility' => PhotoVisibility::Public->value,
        ], ['Accept' => 'application/json'])->assertUnprocessable();

        $this->post('/api/v1/album', [
            'title' => 'Sai danh mục',
            'category' => 'khong_hop_le',
            'visibility' => PhotoVisibility::Public->value,
            'image' => UploadedFile::fake()->image('y.jpg', 400, 400),
        ], ['Accept' => 'application/json'])->assertUnprocessable();
    }

    public function test_editor_deletes_own_photo_and_removes_the_file(): void
    {
        Storage::fake('public');
        $editor = $this->userFor(UserRole::Editor);
        $path = 'album/'.$editor->family_id.'/xoa.webp';
        // ImageStorage chỉ xóa file khi URL khớp đúng disk public nên phải dùng URL thật.
        Storage::disk('public')->put($path, 'x');
        $photo = $this->photo($editor, PhotoVisibility::Public, ['image_url' => Storage::disk('public')->url($path)]);
        Passport::actingAs($editor);

        $this->deleteJson("/api/v1/album/{$photo->id}")->assertOk();

        $this->assertDatabaseMissing('album_photos', ['id' => $photo->id]);
        Storage::disk('public')->assertMissing($path);
    }

    // MARK: - Helpers

    private function photo(User $uploader, PhotoVisibility $visibility, array $overrides = []): AlbumPhoto
    {
        return AlbumPhoto::query()->create(array_merge([
            'family_id' => $uploader->family_id,
            'title' => 'Ảnh gia đình',
            'description' => 'Mô tả',
            'image_url' => 'https://example.test/storage/album/x.webp',
            'event_date' => '2026-01-01',
            'category' => PhotoCategory::General,
            'visibility' => $visibility,
            'uploaded_by' => $uploader->id,
            'tags' => [],
        ], $overrides));
    }

    private function userFor(UserRole $role, ?int $familyId = null): User
    {
        return User::query()->create([
            'name' => 'Người dùng album '.ucfirst($role->value),
            'email' => uniqid().'@example.test',
            'password' => 'password',
            'role' => $role,
            'family_id' => $familyId ?? Family::query()->orderBy('id')->value('id'),
        ]);
    }
}
