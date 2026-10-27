<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class SafeEmail implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || $value !== trim($value)) {
            $fail('Email không hợp lệ.');

            return;
        }

        if (preg_match('/[\x00-\x1F\x7F]/u', $value) === 1) {
            $fail('Email không được chứa ký tự điều khiển.');

            return;
        }

        if (filter_var($value, FILTER_VALIDATE_EMAIL) === false) {
            $fail('Email không hợp lệ.');
        }
    }
}
