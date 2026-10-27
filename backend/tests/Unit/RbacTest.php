<?php

namespace Tests\Unit;

use App\Enums\UserRole;
use App\Http\Resources\LunarEventResource;
use App\Http\Resources\MemberResource;
use App\Models\LunarEvent;
use App\Models\Member;
use App\Models\User;
use Illuminate\Http\Request;
use Tests\TestCase;

class RbacTest extends TestCase
{
    public function test_guest_projection_only_exposes_public_tree_fields(): void
    {
        $member = new Member([
            'id' => 1,
            'family_id' => 7,
            'full_name' => 'Nguyễn Văn Minh',
            'generation' => 1,
            'birth_year_lunar' => 1898,
            'death_year_lunar' => 1974,
            'phone' => '090 210 1898',
            'address' => 'Khu di tích gia tộc',
            'bio' => 'Không công khai',
            'burial_map_url' => 'https://maps.example.test',
        ]);
        $request = Request::create('/api/v1/members');
        $data = (new MemberResource($member))->toArray($request);

        $this->assertSame('Nguyễn Văn Minh', $data['full_name']);
        $this->assertSame(1, $data['generation']);
        $this->assertArrayNotHasKey('phone', $data);
        $this->assertArrayNotHasKey('address', $data);
        $this->assertArrayNotHasKey('bio', $data);
        $this->assertArrayNotHasKey('burial_map_url', $data);
        $this->assertArrayNotHasKey('family_id', $data);
    }

    public function test_authenticated_member_receives_internal_fields(): void
    {
        $user = new User(['role' => UserRole::Member]);
        $request = Request::create('/api/v1/members');
        $request->setUserResolver(static fn (): User => $user);
        $member = new Member([
            'id' => 1,
            'family_id' => 7,
            'full_name' => 'Nguyễn Văn Minh',
            'generation' => 1,
            'phone' => '090 210 1898',
            'address' => 'Bắc Ninh',
        ]);
        $data = (new MemberResource($member))->toArray($request);

        $this->assertSame('090 210 1898', $data['phone']);
        $this->assertSame('Bắc Ninh', $data['address']);
        $this->assertSame(7, $data['family_id']);
    }

    public function test_lunar_event_resource_uses_registration_count_status(): void
    {
        $event = new LunarEvent(['id' => 9, 'member_id' => 1, 'event_type' => 'death_anniversary', 'lunar_day' => 15, 'lunar_month' => 3, 'solar_date' => '2030-03-15']);
        $event->setAttribute('duty_registrations_count', 1);
        $data = (new LunarEventResource($event))->toArray(Request::create('/api/v1/calendar/events'));

        $this->assertSame('registered', $data['status']);
        $this->assertSame('event_id', $event->dutyRegistrations()->getForeignKeyName());
    }

    public function test_role_matrix_matches_the_application_policy(): void
    {
        $this->assertTrue(UserRole::Admin->canDirectlyEditMembers());
        $this->assertTrue(UserRole::Mod->canDirectlyEditMembers());
        $this->assertTrue(UserRole::Editor->canDirectlyEditMembers());
        $this->assertFalse(UserRole::Member->canDirectlyEditMembers());
        $this->assertFalse(UserRole::Guest->canDirectlyEditMembers());
        $this->assertTrue(UserRole::Admin->canReviewEdits());
        $this->assertTrue(UserRole::Mod->canReviewEdits());
        $this->assertFalse(UserRole::Editor->canReviewEdits());
        $this->assertFalse(UserRole::Guest->canViewPrivateData());
    }
}
