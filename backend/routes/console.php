<?php

use App\Jobs\RemindUpcomingAnniversaries;
use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Scheduled Tasks
|--------------------------------------------------------------------------
| Cron trên CentOS Stream 9 chạy `php artisan schedule:run` mỗi phút
| (xem docs/DEPLOY_CENTOS9.md §11). Không có task nào thì cron sẽ chạy vô ích.
|
*/

// Dọn Passport access/refresh token đã hết hạn.
Schedule::command('passport:purge')->hourly();

// Dọn bản ghi batch queue cũ.
Schedule::command('queue:prune-batches')->daily();

/*
 | Nhắc giỗ trong ứng dụng: chạy mỗi ngày lúc 06:00 (giờ Asia/Ho_Chi_Minh trong .env)
 | để phát thông báo cho các ngày giỗ sắp tới trong 7 ngày. Job tự bỏ qua sự kiện
 | đã nhắc nhờ unique (lunar_event_id, reminded_for) nên có thể chạy lại vô hại.
 */
Schedule::job(new RemindUpcomingAnniversaries)->dailyAt('06:00')->withoutOverlapping();
