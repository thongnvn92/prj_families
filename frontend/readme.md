# Gia Phả Online

> Nơi lưu giữ, kết nối và tìm hiểu dòng họ của bạn.

Hệ thống quản lý gia phả dòng họ: lưu trữ và tra cứu cây gia phả, nhắc lịch giỗ âm, hồ sơ
thành viên, album gia đình, trò chuyện nội bộ, văn cúng – nghi lễ và trợ lý AI.

## 1. Tính năng

| Tính năng | Mô tả |
|---|---|
| Cây gia phả | Cây nhiều đời, tìm kiếm theo tên, xem hồ sơ thành viên |
| Danh sách thành viên | Tra cứu, lọc; thêm / sửa / xóa theo quyền |
| Lịch âm & Nhắc giỗ | Ngày dương/âm, đếm ngược ngày giỗ, đăng ký nhiệm vụ |
| Album gia đình | Thư viện ảnh, lọc theo chủ đề/ngày, tải ảnh lên, phân quyền xem |
| Trò chuyện nội bộ | Chat nhóm thời gian thực, gửi tin nhắn kèm ảnh |
| Văn cúng & Nghi lễ | Thư viện bài cúng, tìm kiếm, sao chép và in |
| Trợ lý AI Gia tộc | Hỏi đáp về gia phả bằng tiếng Việt |
| Quản lý & Đề xuất | Tiếp nhận đề xuất cập nhật, so sánh, duyệt hoặc từ chối |
| Cấu hình tính năng | Ban Quản trị bật/tắt chat và chọn vai trò được phép đăng ảnh |
| Phân quyền 5 vai trò | Kiểm soát truy cập, kiểm tra ở máy chủ |

## 2. Công nghệ

Giao diện web: React 19, TypeScript, Vite, Tailwind CSS, Redux Toolkit.
Máy chủ ứng dụng: Laravel 11, PHP 8.2+, MySQL 8, Passport, Reverb (WebSocket).

| Dịch vụ | Địa chỉ mặc định |
|---|---|
| Giao diện web | `http://127.0.0.1:5173` |
| Máy chủ API | `http://127.0.0.1:8080` |
| Thời gian thực | `ws://127.0.0.1:8081` |
| MySQL | `127.0.0.1:3306` |

## 3. Yêu cầu

Node.js 20+ · npm 10+ · PHP 8.2+ (cần `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`, `gd`) ·
Composer 2 · MySQL 8+.

---

## 4. Cài đặt

```bash
# 1. Thư viện giao diện web
npm install

# 2. Cơ sở dữ liệu
# CREATE DATABASE gia_pha_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 3. Thư viện máy chủ ứng dụng
cd laravel_api && composer install

# 4. Tạo tệp cấu hình
cp .env.example .env
cp laravel_api/.env.example laravel_api/.env

# 5. Khởi tạo máy chủ ứng dụng
cd laravel_api
php artisan key:generate       # khóa mã hóa
php artisan passport:keys      # khóa xác thực
php artisan storage:link       # truy cập tệp ảnh đã tải lên
php artisan migrate --seed     # tạo bảng + dữ liệu mẫu
```

> Trên Windows dùng `Copy-Item .env.example .env` thay cho `cp`.

---

## 5. Cấu hình

Hai tệp cấu hình độc lập: `.env` (giao diện web) và `laravel_api/.env` (máy chủ ứng dụng).
Mặc định đã khớp sẵn với nhau.

### Giao diện web — `.env`

```dotenv
VITE_API_URL=http://127.0.0.1:8080/api/v1

VITE_REVERB_APP_KEY=gia-pha-dev-key
VITE_REVERB_HOST=127.0.0.1
VITE_REVERB_PORT=8081
VITE_REVERB_SCHEME=http
```

| Biến | Ý nghĩa |
|---|---|
| `VITE_API_URL` | Địa chỉ máy chủ API, gồm tiền tố `/api/v1` |
| `VITE_REVERB_APP_KEY` | Khóa kết nối thời gian thực — **phải khớp** máy chủ |
| `VITE_REVERB_HOST` | Tên máy chủ dịch vụ thời gian thực |
| `VITE_REVERB_PORT` | Cổng kết nối (mặc định `8081`) |
| `VITE_REVERB_SCHEME` | `http` → `ws://`, `https` → `wss://` |

### Máy chủ ứng dụng — `laravel_api/.env`

```dotenv
APP_ENV=local
APP_DEBUG=true
APP_TIMEZONE=Asia/Ho_Chi_Minh
APP_URL=http://127.0.0.1:8080

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=gia_pha_db
DB_USERNAME=root
DB_PASSWORD=

# Địa chỉ giao diện web được phép gọi API (nhiều địa chỉ, cách nhau bằng dấu phẩy)
FRONTEND_URLS=http://127.0.0.1:5173,http://localhost:5173

# Kết nối thời gian thực
BROADCAST_CONNECTION=reverb
REVERB_APP_KEY=gia-pha-dev-key
REVERB_APP_SECRET=gia-pha-dev-secret
REVERB_HOST=127.0.0.1
REVERB_PORT=8081
REVERB_SCHEME=http

QUEUE_CONNECTION=database
CACHE_STORE=database
SESSION_DRIVER=database
FILESYSTEM_DISK=public

# Trợ lý AI — để trống nếu không dùng dịch vụ AI bên ngoài
AI_API_KEY=
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
AI_TIMEOUT=20
```

Một vài lưu ý:

- **Sau khi sửa `.env`**, chạy `php artisan config:clear` để thay đổi có hiệu lực.
- `REVERB_APP_KEY` phải khớp `VITE_REVERB_APP_KEY`; lệch một trong hai là chat không kết
  nối được.
- `FRONTEND_URLS` phải là địa chỉ đầy đủ, **không dùng `*`**. Lỗi CORS khi địa chỉ này
  không khớp.
- `AI_API_KEY` để trống → trả lời bằng dữ liệu có sẵn trong hệ thống, dùng được ngay ở
  máy cá nhân. Có key → gửi tới dịch vụ AI tương thích OpenAI.
- Ảnh được nén WebP và lưu trên máy chủ. Triển khai thật nên chuyển sang S3/MinIO.

---

## 6. Chạy hệ thống

Mở nhiều terminal và chạy từng dịch vụ:

```bash
php artisan serve --host=127.0.0.1 --port=8080     # máy chủ API
php artisan reverb:start --host=127.0.0.1 --port=8081   # thời gian thực
php artisan queue:work                             # hàng đợi
npm run dev                                        # giao diện web
```

Các lệnh thường dùng:

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy giao diện web ở chế độ phát triển |
| `npm run build` | Đóng gói bản triển khai |
| `npm run lint` | Kiểm tra lỗi kiểu dữ liệu |
| `npm test` | Chạy kiểm thử giao diện |
| `php artisan migrate --seed` | Tạo/cập nhật bảng, nạp dữ liệu mẫu |
| `php artisan config:clear` | Áp dụng thay đổi trong `.env` |
| `php artisan test` | Chạy kiểm thử máy chủ |

Kiểm tra máy chủ còn hoạt động: `curl http://127.0.0.1:8080/up`

---

## 7. Vai trò và tài khoản mẫu

| Vai trò | Dành cho | Quyền chính |
|---|---|---|
| `admin` | Ban Quản trị | Toàn quyền, duyệt đề xuất, cấu hình tính năng |
| `mod` | Trưởng Chi | Quản lý nhánh phụ trách, duyệt đề xuất |
| `editor` | Tác viên nhập liệu | Thêm sửa thành viên trong nhánh, không duyệt |
| `member` | Thành viên | Xem dữ liệu nội bộ, gửi đề xuất |
| `guest` | Khách | Chỉ xem thông tin công khai |

Tài khoản mẫu, mật khẩu đều là `password` (**chỉ dùng ở máy cá nhân**):

`admin@gia-pha.local` · `mod@gia-pha.local` · `editor@gia-pha.local` ·
`member@gia-pha.local` · `guest@gia-pha.local`

---

## 8. Triển khai lên máy chủ thật

Hướng dẫn chi tiết: **`docs/DEPLOY_CENTOS9.md`** (CentOS Stream 9, Nginx + PHP-FPM +
systemd, có SELinux, tường lửa, chứng thư và sao lưu).

Các bước chính:

```bash
npm run build                                    # đóng gói giao diện
cd laravel_api
composer install --no-dev --optimize-autoloader
php artisan key:generate && php artisan passport:keys
php artisan migrate --force
php artisan storage:link
php artisan config:cache && php artisan route:cache
```

Trước khi lên mạng thật: đặt `APP_ENV=production`, `APP_DEBUG=false`, thay `FRONTEND_URLS`
bằng tên miền thật (không dùng `*`), đổi bộ đệm/hàng đợi sang `redis`, dùng khóa ngẫu nhiên
cho `APP_KEY` và `REVERB_APP_SECRET`, đặt `VITE_REVERB_SCHEME=https`, và bảo đảm đã thử
khôi phục bản sao lưu thành công.

> Có cảnh báo bảo mật từ thư viện Laravel chưa được khắc phục — xem `laravel_api/README.md`.

---

## 9. Xử lý sự cố

| Hiện tượng | Cách xử lý |
|---|---|
| Không kết nối MySQL / lỗi `Unknown database` | Bật MySQL, tạo database, kiểm tra `DB_*` |
| Lỗi CORS trên trình duyệt | Thêm đúng địa chỉ giao diện web vào `FRONTEND_URLS` |
| Chat không kết nối | Đối chiếu `REVERB_APP_KEY` với `VITE_REVERB_APP_KEY`; chạy `reverb:start` |
| Lỗi upload ảnh | Chạy `php artisan storage:link` |
| Lỗi thiếu khóa | `php artisan key:generate` và `php artisan passport:keys` |
| Sửa `.env` không có hiệu lực | `php artisan config:clear` |
| Máy chủ báo lỗi 500 | Xem `laravel_api/storage/logs/` |
| Cổng đã bị dùng | Đóng dịch vụ đó hoặc đổi cổng trong `.env` |

---

## 10. Tài liệu khác

`docs/DEPLOY_CENTOS9.md` — triển khai máy chủ · `laravel_api/README.md` — chi tiết API và
phân quyền · `docs/test-cases/` — bộ test case.

Phần chưa hoàn thiện: lịch âm dùng mô hình ước lượng, thông báo nhắc ngày giỗ chưa gửi tự
động.

### 11. Hồ sơ cá nhân

Mở **Hồ sơ cá nhân** trong menu tài khoản (góc trên bên phải). Hồ sơ luôn thể hiện
theo thứ tự ưu tiên sau:

| # | Thông tin | Ví dụ |
|---|---|---|
| 1 | Họ và tên | `Nguyễn Văn A` |
| 2 | Quê quán | `An Lão, Kiến An, Hải Phòng` |
| 3 | Ngày sinh | `21/05/1962 (Nhâm Dần)` |
| 4 | Ngày mất (chưa mất thì `-`) | `19/08/1974 (Giáp Tý)` |

- Ngày hiển thị theo **dương lịch** kèm **can - chi của năm âm** trong ngoặc; năm
  âm ưu tiên hơn năm dương vì Tết rơi vào tháng 1-2 dương. Con giáp do máy chủ tính
  (`App\Support\Zodiac`), frontend chỉ hiển thị.
- Quê quán là trường riêng `members.birthplace`, tách khỏi `address` (nơi ở/địa chỉ
  liên hệ hiện tại).
- Muốn sửa thông tin: **Danh sách thành viên** → tìm tên → **Sửa**. Tài khoản
  `member` gửi *đề xuất* để Ban quản trị duyệt; `admin`/`mod`/`editor` cập nhật
  trực tiếp trong phạm vi được phân công.
- Hồ sơ đọc được hồ sơ thành viên đã liên kết qua `users.member_id`; tài khoản chưa
  liên kết sẽ được nhắc trước khi hiển thị các trường đó.
