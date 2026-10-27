<?php

namespace App\Support;

/** Câu trả lời chuẩn hoá của Trợ lý AI kèm các thẻ tham chiếu hồ sơ thành viên. */
final class AiAnswer
{
    /**
     * @param  array<int, array{memberId: string, name: string}>  $references
     */
    public function __construct(
        public readonly string $text,
        public readonly array $references = [],
        public readonly string $driver = 'fallback',
    ) {}
}
