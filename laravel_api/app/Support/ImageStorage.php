<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;

class ImageStorage
{
    public function storeWebp(UploadedFile $file, string $directory, int $maxWidth = 1920, int $quality = 82): string
    {
        $filename = Str::uuid().'.webp';
        $path = trim($directory, '/').'/'.$filename;
        $image = ImageManager::gd()->read($file->getRealPath());
        $image->scaleDown(width: $maxWidth);
        if (! Storage::disk('public')->put($path, $image->toWebp(quality: $quality)->toString())) {
            throw new \RuntimeException('Không thể lưu ảnh đã nén.');
        }

        return Storage::disk('public')->url($path);
    }

    public function delete(?string $url): void
    {
        if (! $url || ! str_starts_with($url, Storage::disk('public')->url(''))) {
            return;
        }
        $path = str_replace(Storage::disk('public')->url(''), '', $url);
        if ($path !== '') {
            Storage::disk('public')->delete($path);
        }
    }
}
