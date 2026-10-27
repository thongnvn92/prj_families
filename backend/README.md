# Gia Phả Online — Laravel API

Backend API cho **Gia Phả Online**, dùng chung contract với frontend React/Vite tại `D:\Workspace\prj_families`.

## Trạng thái

- Laravel **11.56.1**, PHP **8.2+**.
- MySQL **8.0** (`gia_pha_db`).
- Laravel Passport **12.4.3**: Personal Access Token và OAuth2 Password Grant.
- Laravel Reverb **1.12**: WebSocket chat.
- Intervention Image + GD: resize và nén ảnh WebP.
- Local public disk: `storage/app/public`.
- API prefix: `/api/v1`.
- Dev API: `http://127.0.0.1:8080`.
- Passport OAuth routes: `/oauth/*`.

## Yêu cầu môi trường

- PHP 8.2 trở lên với `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`, `gd`.
- Composer 2.
- MySQL 8.0 trở lên.
- Node/npm chỉ cần khi chạy frontend hoặc Reverb client.
- Redis 7 là production dependency; local có thể dùng database/sync tạm thời.

## Cài đặt

```bash
cd D:\Workspace\prj_families\laravel_api
composer install
copy .env.example .env
php artisan key:generate
php artisan passport:keys
php artisan storage:link
```

Cấu hình MySQL trong `.env`:

```dotenv
APP_URL=http://127.0.0.1:8080
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=gia_pha_db
DB_USERNAME=root
DB_PASSWORD=
```

Tạo database nếu chưa có:

```sql
CREATE DATABASE gia_pha_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Database và dữ liệu mẫu

```bash
php artisan migrate --seed
```

Seeder tạo dữ liệu kiểm thử gồm:

- 1 family: Họ Nguyễn — Chi 3.
- 23 thành viên, 5 thế hệ.
- 5 user mẫu theo role `admin`, `mod`, `editor`, `member`, `guest`.
- 6 sự kiện âm lịch.
- 7 bài văn khấn.
- Personal Access Client và Password Grant Client.

Tài khoản seed dùng mật khẩu `password` (chỉ dùng local/dev):

| Email | Role |
|---|---|
| `admin@gia-pha.local` | Admin |
| `mod@gia-pha.local` | Mod |
| `editor@gia-pha.local` | Editor |
| `member@gia-pha.local` | Member |
| `guest@gia-pha.local` | Guest |

## Chạy local

Chạy toàn bộ stack local từ thư mục gốn `D:\Workspace\prj_families` bằng PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\run-local.ps1
```

Script sẽ khởi động MySQL (nếu Laragon/XAMPP có sẵn), chạy migration, Laravel API tại `http://127.0.0.1:8080`, Reverb tại `ws://127.0.0.1:8081`, Laravel database queue worker và Vite tại `http://127.0.0.1:5173`. Nhấn `Ctrl+C` để dừng các tiến trình do script tự mở; các service đã chạy trước đó được giữ nguyên.

Các tuỳ chọn thường dùng:

```powershell
# Chỉ kiểm tra PHP/Node/dependency, không khởi động service
.\run-local.ps1 -Check

# Smoke-test: khởi động, kiểm tra READY rồi tự dừng process do script mở
.\run-local.ps1 -NoWait

# Cài dependency, tạo .env/key/storage link nếu thiếu, seed dữ liệu mẫu và mở trình duyệt
.\run-local.ps1 -Setup -Seed -OpenBrowser

# Bỏ qua MySQL hoặc từng service
.\run-local.ps1 -SkipMysql
.\run-local.ps1 -SkipReverb
.\run-local.ps1 -SkipQueue
.\run-local.ps1 -SkipMigrations
```

Log runtime được ghi vào thư mục temp có tên `GiaPhaOnline-local-*`; đường dẫn cụ thể được in khi script báo `READY`.

API riêng:

```bash
php artisan serve --host=127.0.0.1 --port=8080
```

Reverb riêng:

```bash
php artisan reverb:start --host=127.0.0.1 --port=8081
```

Queue worker khi dùng database queue:

```bash
php artisan queue:work
```

Health check:

```bash
curl http://127.0.0.1:8080/up
```

## Authentication

### Personal Access Token (luồng chính cho prototype)

```bash
curl -X POST http://127.0.0.1:8080/api/v1/auth/login \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gia-pha.local","password":"password","device_name":"local"}'
```

Gửi token ở request tiếp theo:

```text
Authorization: Bearer <access_token>
```

### OAuth2 Password Grant

Passport đăng ký route `POST /oauth/token` và `POST /oauth/token/refresh`. Client được tạo idempotently bởi `PassportClientSeeder`; không hard-code secret trong source control.

## API chính

Base URL: `http://127.0.0.1:8080/api/v1`.

### Public projection

- `GET /members`
- `GET /members/{member}`
- `GET /family-settings`

Các endpoint này dùng `auth.optional`: không token trả projection công khai; Bearer token hợp lệ được resolve để trả dữ liệu nội bộ theo role; Bearer token sai trả `401`.

> **Phạm vi Guest (chỉ xem được cây gia phả):** `GET /members` là nguồn dữ liệu cho màn hình cây gia phả công khai nên vẫn mở, nhưng `MemberResource` loại bỏ hoàn toàn SĐT, địa chỉ, ngày Âm-Dương chi tiết, tiểu sử, mộ phần, bản đồ và ảnh đại diện. Album, chat, lịch, văn khấn và AI **không** mở cho Guest — kể cả ảnh `visibility=public` (không token → `401`, có token role guest → `403`).

### Authenticated

- `GET/PATCH /auth/profile`
- `GET /auth/me` (alias dùng khi frontend khởi tạo session)
- `POST /auth/logout`

`GET /members` hỗ trợ query `search`, `generation`, `gender`, `is_alive`, `status` và `per_page`.

Local CORS dùng `FRONTEND_URLS=http://127.0.0.1:5173,http://localhost:5173`; production phải thay bằng domain thật và không dùng wildcard.

### Prayers (đã nối HTTP thật từ frontend)

- `GET /prayers` — hỗ trợ query `category` và `query`.
- `GET /prayers/{prayer}`
- `POST /prayers` (admin), `PUT /prayers/{prayer}` (admin), `DELETE /prayers/{prayer}` (admin)

Response luôn kèm `author_name` (quan hệ `author` được load khi tạo/đọc). Frontend map qua `prayerApiMapper.ts`.

### Pending edits (đã nối HTTP thật từ frontend)

- `GET /pending-edits` (admin, mod) — hỗ trợ query `status`.
- `POST /pending-edits` (member, editor, mod, admin)
- `POST /pending-edits/{edit}/approve` (admin, mod)
- `POST /pending-edits/{edit}/reject` (admin, mod) — body `{ "reason": "..." }`, tối thiểu 8 ký tự.

`proposed_data` bị giới hạn theo allowlist của từng `edit_type`; field ngoài allowlist bị từ chối bằng `422`. Frontend dùng `pendingEditApiMapper.ts` và `lib/pendingEditProposal.ts` để dựng payload đúng allowlist.

Duyệt đề xuất chạy trong transaction với `lockForUpdate` (`PendingEditService`) và tự động tạo/sửa Member theo `edit_type`, nên frontend phải invalidate tag `Members` sau khi approve.

### Calendar (đã nối HTTP thật từ frontend)

- `GET /calendar/events` — query `upcoming` (bool), `year`, `month`, `member_id`, `event_type`
- `GET /calendar/lunar-month` — query `year`, `month` (bắt buộc); trả nhãn ngày âm từng ngày
- `POST /calendar/events` (admin, mod, editor)
- `POST /calendar/events/{event}/register-duty` (member, editor, mod, admin) — body `{ "duty_type", "phone", "note" }`
- `DELETE /calendar/events/{event}` (admin, mod, editor)

#### Ngày giỗ luôn tính lại từ lịch âm

`App\Support\LunarCalendar` là **nguồn quyết định duy nhất** cho mọi phép tính ngày âm — dùng chung cho API calendar và job nhắc giỗ nên hai nơi không thể lệch nhau. Thuật toán dùng bảng `LUNAR_INFO` cho năm 1900–2100 (mốc: 1900-01-31 dương = 01/01 âm), hỗ trợ đầy đủ tháng nhuận.

| Hàm | Công dụng |
|---|---|
| `toLunar()` / `toSolar()` | Chuyển đổi hai chiều; trả `null` khi năm ngoài 1900–2100 hoặc ngày không tồn tại trong tháng |
| `anniversaryInYear()` | Ngày dương của lần giỗ rơi vào một năm dương cụ thể |
| `nextAnniversary()` | Lần giỗ sắp tới kể từ một ngày |
| `dayLabel()` / `monthName()` | Nhãn tiếng Việt: "Rằm tháng Giêng" |

**Quy tắc bắt buộc:** cột `lunar_events.solar_date` chỉ là ngày dương **tại thời điểm tạo bản ghi**, không dùng để hiển thị. Ngày giỗ mỗi năm phải tính lại qua `LunarEvent::nextOccurrence()` hoặc `occurrenceInYear()` — vì lịch âm trôi dần theo dương lịch, nên ngày giỗ âm giữ nguyên còn ngày dương khác nhau từng năm.

Hệ quả đã áp dụng:

- Bộ lọc `year`/`month`/`upcoming` chạy trên **ngày giỗ đã tính** trong PHP, không lọc theo `solar_date` trong SQL. Lưu ý rule `integer` của Laravel chỉ kiểm tra mà **không ép kiểu**, nên phải ép kiểu tường minh trước khi so sánh.
- `POST /calendar/events` **không nhận `solar_date`** — ngày dương do backend suy ra từ `lunar_day`/`lunar_month`; gửi kèm từ client bị bỏ qua (có test).
- Nếu mùng 30 rơi vào tháng chỉ có 29 ngày thì ngày đó không tồn tại, hệ thống tự chờ sang năm âm kế tiếp có ngày đó.
- `LunarEventResource` trả kèm `lunar_label`, `lunar_day_label`, `lunar_month_name` để frontend không phải tự tính.

`LunarEventResource` trả `member_name`, `generation`, `days_remaining` (âm nếu ngày giỗ đã qua) và `status`:

| status | điều kiện |
|---|---|
| `completed` | `days_remaining < 0` |
| `registered` | còn ít nhất 1 `event_duty_registrations` |
| `upcoming` | còn lại |

Đăng ký nhiệm vụ dùng `updateOrCreate` theo `(event_id, user_id)`, nên đăng ký lại sẽ cập nhật bản ghi cũ thay vì tạo bản ghi mới; mọi đăng ký đều ở trạng thái `confirmed`. `EventDutyRegistrationResource` trả `volunteer_name` lấy từ user đăng ký.

### Nhắc giỗ tự động trong ứng dụng

`App\Jobs\RemindUpcomingAnniversaries` chạy **mỗi ngày lúc 06:00** (`routes/console.php`, `dailyAt('06:00')->withoutOverlapping()`), phát `App\Events\AnniversaryReminderSent` cho mọi ngày giỗ còn ≤ 7 ngày.

- Broadcast trên channel nền `users.{id}` với event `anniversary.reminder`; frontend subscribe ở `src/lib/useAnniversaryReminder.ts` (tên event phải có dấu chấm dẫn đầu: `.anniversary.reminder`).
- Chỉ gửi tới tài khoản **cùng dòng họ** (`users.family_id`).
- **Chống gửi trùng**: bảng `anniversary_reminders` có unique `(lunar_event_id, reminded_for)` nên job chạy lại nhiều lần vẫn chỉ gửi một lần cho mỗi lần giỗ.
- Local cần `php artisan schedule:work`; production cần cron `schedule:run` mỗi phút (xem `docs/DEPLOY_CENTOS9.md` §11).
- Chưa có SMS/Zalo/Telegram — đây là kênh in-app, đúng theo hướng đã chốt.

### Chat/chat groups (đã nối HTTP thật từ frontend)

- `GET /chat/groups` — chỉ trả nhóm mà user hiện tại là thành viên (admin thấy tất cả)
- `POST /chat/groups` (admin, mod) — body `{ "name", "type", "member_ids" }`
- `GET /chat/groups/{group}/messages` — phân trang 50 tin/trang, response `{ data, meta, links }`
- `POST /chat/groups/{group}/messages` — multipart: `message_text` + file `image`

**`member_ids` là id của bảng `members`, không phải `users`.** Bảng `members` không có `user_id` (liên kết chỉ đi 1 chiều từ `users.member_id`), nên controller validate theo family rồi resolve sang tài khoản qua `users.member_id` và luôn tự thêm người tạo với vai trò `owner`. Thành viên chưa có tài khoản bị bỏ qua — `member_count` trả về là số tài khoản thực sự được thêm.

Ảnh đính kèm được `ImageStorage` nén sang WebP (max 1600px, quality 78) và lưu ở `chat/{group_id}/`; giới hạn 10MB với `jpeg/png/webp`. Ảnh trong tin nhắn còn phải đi qua middleware `image.upload` (xem `family_settings`), còn tin nhắn text không bị giới hạn này.

**Toàn bộ route chat khoá theo công tắc `chat_enabled`** của Admin trong `family_settings`; xem mục *Cấu hình tính năng dòng họ* bên dưới.

`MessageSent` là `ShouldBroadcastNow` nên chạy đồng bộ; controller bọc dispatch trong `try/catch` và `report()` lỗi để Reverb sập không biến một lần gửi **đã lưu** thành lỗi 500. Frontend đã có client `laravel-echo`/`pusher-js` (`src/lib/echo.ts`) nên nhận được broadcast trực tiếp; sau khi gửi, RTK Query `invalidatesTags` vẫn refetch danh sách tin nhắn.

### Album (đã nối HTTP thật từ frontend)

- `GET /album` — member, editor, mod, admin; phân trang 30 ảnh/trang; query `category`, `event_date`, `family_id`
- `GET /album/{photo}` — member, editor, mod, admin
- `POST /album` (admin, mod, editor, member — **kèm middleware `image.upload`**) — multipart: `title`, `description`, `event_date`, `category`, `visibility`, `tags[]`, file `image`
- `DELETE /album/{photo}` (admin, mod, editor; uploader gốc cũng được)

Ảnh phải là `jpeg/png/webp`, tối đa 10MB và **tối thiểu 100x100**; `ImageStorage` nén sang WebP (max 1920px) rồi lưu ở `album/{family_id}/`. `tags` lưu dạng JSON tối đa 10 thẻ, mỗi thẻ ≤ 60 ký tự.

Album là dữ liệu nội bộ nên **không mở cho Guest**: không token trả `401`, có token role `guest` trả `403`, kể cả ảnh `visibility=public`. Thành viên đã đăng nhập mới thấy `uploader_name`; controller eager load `uploader` cho các request này.

**Quyền tải ảnh do Admin cấu hình**, không gắn cứng theo role: xem `family_settings` bên dưới. Frontend dùng `useFamilySettings().canUploadImages` để ẩn/hiện nút, còn middleware `image.upload` mới là chốt chặn cuối.

### Cấu hình tính năng dòng họ (`family_settings`)

Admin (Trưởng Tộc) bật/tắt Trò chuyện nội bộ và chọn vai trò được đưa hình ảnh lên hệ thống.

| Endpoint | Quyền | Mô tả |
|---|---|---|
| `GET /family-settings` | `auth.optional` | Đọc cấu hình hiện tại; khách cũng đọc được để UI ẩn/hiện mục chat |
| `GET /family-settings/roles` | `role:admin` | Danh sách role cấu hình được kèm nhãn tiếng Việt |
| `PUT /family-settings` | `role:admin` | Lưu `{ "chat_enabled": bool, "image_upload_roles": string[] }` |

Bảng `family_settings` có `family_id` (unique), `chat_enabled`, `image_upload_roles` (JSON), `updated_by` (ai đã lưu) và timestamps. Dòng họ chưa có bản ghi thì dùng **cấu hình mặc định**: chat bật, `["admin","mod","editor"]` được tải ảnh — đọc cấu hình không ghi thêm bản ghi.

Nguồn quyết định duy nhất là `App\Support\FamilySettings`; hai middleware alias trong `bootstrap/app.php`:

- **`chat.enabled`** (`EnsureChatEnabled`) — gắn lên **mọi** route chat, nên khi Admin tắt chat thì danh sách nhóm, lịch sử và gửi tin nhắn đều trả **403**. Cổng WebSocket `chat-groups.{id}` trong `routes/channels.php` cũng kiểm tra công tắc này nên không còn ai subscribe được. Dữ liệu chat vẫn giữ nguyên, chỉ không đọc/gửi được.
- **`image.upload`** (`EnsureCanUploadImages`) — gắn lên `POST /album`. Với tin nhắn có ảnh, `ChatController::sendMessage()` chỉ gọi kiểm tra khi `hasFile('image')`, nên **tin nhắn text vẫn gửi được** khi vai trò bị thu quyền ảnh.

`guest` không bao giờ được tải ảnh dù Admin cấu hình; `PUT` validate `image_upload_roles` tối thiểu 1 phần tử và chỉ nhận `admin|mod|editor|member`.

## RBAC server-side

Role lưu trong `users.role`:

- `admin`: toàn bộ family/nhánh, duyệt pending edit, tạo group, tạo/sửa/xóa prayer.
- `mod`: quản lý nhánh được giao, duyệt pending edit, tạo group, CRUD member.
- `editor`: CRUD member trong nhánh được giao, gửi đề xuất, không duyệt.
- `member`: đọc dữ liệu nội bộ, gửi pending edit, không sửa/xóa trực tiếp.
- `guest`: chỉ xem được cây gia phả ở chế độ công khai. Không đọc SĐT, địa chỉ, maps, ngày chi tiết, tiểu sử; **không** truy cập album, chat, lịch, văn khấn hay AI (kể cả khi gọi API trực tiếp: không token → `401`, token role guest → `403`).

Các lớp bảo vệ:

- `app/Http/Middleware/CheckRole.php`: kiểm tra role.
- `app/Http/Middleware/AuthenticateApiIfPresent.php`: optional Passport cho public routes.
- `app/Http/Resources/MemberResource.php`: server-side Guest projection.
- `app/Support/FamilyScope.php`: family/branch scope.
- `app/Services/PendingEditService.php`: transaction + row lock khi duyệt đề xuất.

## Album và storage

Upload nhận `multipart/form-data`, field `image`, tối đa 10 MB:

- MIME: jpeg/jpg/png/webp.
- Resize tối đa 1920 px.
- Encode WebP quality mặc định 82.
- Lưu disk `public` tại `storage/app/public`.
- URL public qua `/storage/...` sau khi chạy `storage:link`.

Chat cũng nhận ảnh multipart và broadcast event `message.sent` qua Reverb.

## Validation

```bash
php artisan route:list
php artisan migrate:status
php artisan test
vendor/bin/pint --test
```

Smoke test local đã kiểm tra end-to-end: Guest projection, Passport login/OAuth2, RBAC 401/403, CRUD thành viên, calendar duty, prayer, pending edit transaction, chat/Reverb, upload WebP và storage cleanup. Helper smoke là script tạm và phải được xóa sau khi chạy; database phải trở về seed count.

## Cảnh báo dependency security (25/09/2026)

`composer audit --locked` hiện báo 3 advisory trên `laravel/framework` v11.56.1 (signed-URL path confusion và CRLF trong email validation). Bản sửa chỉ có ở Laravel ≥ 12.61.1.

**Quyết định 30/09/2026: chủ dự án chọn KHÔNG nâng Laravel 12** và chấp nhận rủi ro, dùng các mitigation dưới đây. Đây là ngoại lệ đã được biết và ghi nhận, không phải trạng thái đã xử lý xong.

Mitigation hiện tại:

- Không sử dụng `temporarySignedRoute`/temporary signed URL trong source.
- `app/Rules/SafeEmail.php` chặn CR/LF và mọi control character trước khi validate/lưu email ở register, login và profile update.
- Có test regression cho email header injection.
- Ràng buộc bắt buộc khi giữ Laravel 11: không thêm chức năng dùng temporary signed URL; mọi endpoint nhận email phải dùng `SafeEmail`. Nếu sau này cần nâng version thì lên thẳng 12.61.1+ (không dừng ở 12.0, vẫn dính advisory).

## Production còn cần làm

- Triển khai production: **xem hướng dẫn đầy đủ tại `../docs/DEPLOY_CENTOS9.md`** (CentOS Stream 9 + Nginx + PHP-FPM + systemd cho Reverb/queue, SELinux, firewalld, TLS, backup/restore). Repo chưa có `Dockerfile`/`compose.yaml`.
- Redis/Broadcast queue, MinIO/S3, secret manager, HTTPS, audit log và backup.
- OpenAPI contract; hoàn thiện refresh token chủ động và profile UI.
- AI/RAG thật (embeddings/vector search), Zalo/Telegram provider (hiện đã có kênh in-app qua Reverb cho nhắc giỗ).
- Cron `schedule:run` phải được bật trên production — nếu không, job `RemindUpcomingAnniversaries` sẽ không chạy.
- Toàn bộ domain đã gọi Laravel HTTP thật (không còn `queryFn` mock); không được coi token `localStorage` hay guard UI là security boundary.
