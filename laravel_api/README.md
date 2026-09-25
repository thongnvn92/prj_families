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
- `GET /album`
- `GET /album/{photo}`

Các endpoint này dùng `auth.optional`: không token trả projection công khai; Bearer token hợp lệ được resolve để trả dữ liệu nội bộ theo role; Bearer token sai trả `401`.

### Authenticated

- `GET/PATCH /auth/profile`
- `GET /auth/me` (alias dùng khi frontend khởi tạo session)
- `POST /auth/logout`

`GET /members` hỗ trợ query `search`, `generation`, `gender`, `is_alive`, `status` và `per_page`.

Local CORS dùng `FRONTEND_URLS=http://127.0.0.1:5173,http://localhost:5173`; production phải thay bằng domain thật và không dùng wildcard.

### Member/calendar/chat/prayer/pending edit

- `GET /calendar/events`
- `POST /calendar/events/{event}/register-duty`
- `GET/POST /chat/groups`
- `GET/POST /chat/groups/{group}/messages`
- `GET/POST /pending-edits`
- `GET /prayers`
- `GET /prayers/{prayer}`

CRUD nhạy cảm và pending approval dùng middleware `auth:api` + `role:*`; controller/service kiểm tra family/branch scope.

## RBAC server-side

Role lưu trong `users.role`:

- `admin`: toàn bộ family/nhánh, duyệt pending edit, tạo group, tạo/sửa/xóa prayer.
- `mod`: quản lý nhánh được giao, duyệt pending edit, tạo group, CRUD member.
- `editor`: CRUD member trong nhánh được giao, gửi đề xuất, không duyệt.
- `member`: đọc dữ liệu nội bộ, gửi pending edit, không sửa/xóa trực tiếp.
- `guest`: chỉ public projection; không đọc SĐT, địa chỉ, maps, ngày chi tiết, tiểu sử và chat history.

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

`composer audit --locked` hiện báo 3 advisory trên `laravel/framework` v11.56.1 (signed-URL path confusion và CRLF trong email validation). Laravel 11.56.1 là bản 11 mới nhất và advisory chưa có bản sửa trong nhánh 11; dự án giữ Laravel 11 theo yêu cầu nên chưa thể nâng lên Laravel 12 để loại bỏ cảnh báo.

Mitigation hiện tại:

- Không sử dụng `temporarySignedRoute`/temporary signed URL trong source.
- `app/Rules/SafeEmail.php` chặn CR/LF và mọi control character trước khi validate/lưu email ở register, login và profile update.
- Có test regression cho email header injection.
- Không được triển khai production trước khi lên phiên bản framework có upstream fix hoặc được áp dụng vendor patch đã review.

## Production còn cần làm

- Docker Compose + Nginx reverse proxy (máy dev hiện dùng `artisan serve` port 8080 và Reverb 8081).
- Redis/Broadcast queue, MinIO/S3, secret manager, HTTPS, audit log và backup.
- OpenAPI contract; chuyển các domain còn lại từ mock `queryFn` sang HTTP và hoàn thiện refresh token/profile UI.
- AI/RAG thật, Zalo/Telegram provider, chuyển đổi âm lịch chuẩn và cron/queue nhắc giỗ.
- Auth + Members đã dùng Passport HTTP thật; không được coi các service mock còn lại hoặc token `localStorage` là security boundary.
