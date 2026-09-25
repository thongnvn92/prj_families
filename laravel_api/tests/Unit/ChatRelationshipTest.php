<?php

namespace Tests\Unit;

use App\Models\ChatGroup;
use App\Models\ChatMessage;
use App\Models\User;
use Tests\TestCase;

class ChatRelationshipTest extends TestCase
{
    public function test_chat_group_pivot_uses_the_schema_foreign_keys(): void
    {
        $relation = (new ChatGroup)->members();

        $this->assertSame('group_id', $relation->getForeignPivotKeyName());
        $this->assertSame('user_id', $relation->getRelatedPivotKeyName());
        $this->assertSame('user_id', (new User)->chatGroups()->getForeignPivotKeyName());
        $this->assertSame('group_id', (new User)->chatGroups()->getRelatedPivotKeyName());
        $this->assertSame('group_id', (new ChatGroup)->messages()->getForeignKeyName());
        $this->assertSame('group_id', (new ChatMessage)->group()->getForeignKeyName());
    }

    public function test_reverb_config_contains_required_ingest_intervals(): void
    {
        $config = config('reverb.servers.reverb');

        $this->assertIsInt($config['pulse_ingest_interval']);
        $this->assertIsInt($config['telescope_ingest_interval']);
    }
}
