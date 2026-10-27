<?php

namespace Tests\Unit;

use App\Models\ChatGroup;
use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Support\Str;
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

    public function test_reverb_allowed_origins_are_hostnames_not_full_urls(): void
    {
        /*
         * Reverb so khớp allowed_origins với HOST của header Origin
         * (Laravel\Reverb\Protocols\Pusher\EventHandler::verifyOrigin gọi parse_url(..., PHP_URL_HOST)
         * rồi Str::is($allowedOrigin, $host)). Nếu config đưa URL đầy đủ vào đây thì mọi
         * handshake WebSocket từ trình duyệt đều bị từ chối với 4009 "Origin not allowed".
         */
        $origins = config('reverb.apps.apps.0.allowed_origins');

        $this->assertNotEmpty($origins);
        foreach ($origins as $origin) {
            $this->assertStringNotContainsString('://', $origin, 'allowed_origins phải là hostname, không phải URL.');
            $this->assertStringNotContainsString('/', $origin, 'allowed_origins không được chứa path.');
            $this->assertStringNotContainsString(':', $origin, 'Reverb chỉ so khớp host nên không được kèm port.');
        }

        // Mọi origin frontend đã cấu hình đều phải khớp theo đúng luật so khớp của Reverb.
        $frontendUrls = array_filter(array_map(
            'trim',
            explode(',', (string) env('FRONTEND_URLS', env('FRONTEND_URL', 'http://127.0.0.1:5173')))
        ));
        foreach ($frontendUrls as $frontendUrl) {
            $host = (string) parse_url($frontendUrl, PHP_URL_HOST);
            $this->assertNotEmpty(
                array_filter($origins, fn (string $origin): bool => Str::is($origin, $host)),
                "Reverb sẽ từ chối Origin {$frontendUrl} vì '{$host}' không nằm trong allowed_origins."
            );
        }
    }
}
