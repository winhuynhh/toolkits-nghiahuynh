# Nghĩa Huỳnh · Toolkit

Portal gộp tool cá nhân. Danh sách tool lưu trên **Upstash Redis** qua 1 API serverless (`/api/tools.js`) — thêm/xoá từ máy nào cũng đồng bộ ngay, không cần sửa code.

## Cấu trúc
```
index.html        → khung trang
style.css          → giao diện
script.js          → gọi API, render, form thêm/xoá, theme
api/tools.js       → serverless function: GET / POST / DELETE
package.json       → khai báo thư viện @upstash/redis
```

## Bước 1 — Tạo Upstash Redis (miễn phí)
1. Vào https://console.upstash.com → đăng nhập (Google/GitHub được).
2. **Create Database** → đặt tên tuỳ ý → chọn Region gần bạn nhất (vd `ap-southeast-1` Singapore) → Create.
3. Vào database vừa tạo → tab **REST API** → copy 2 giá trị:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

## Bước 2 — Deploy lên Vercel

**Khuyên dùng cách GitHub** (vì project giờ có API + package.json, deploy qua Git ổn định hơn kéo-thả):

1. Tạo repo mới trên GitHub → **Add file → Upload files** → kéo hết các file/folder trong project này lên (giữ nguyên cấu trúc, đặc biệt là thư mục `api/`), Commit.
2. Vào https://vercel.com/new → **Import Git Repository** → chọn repo vừa tạo.
3. Framework Preset: để **Other** (Vercel tự nhận `api/tools.js` là serverless function, tự chạy `npm install` cho `package.json`).
4. **Trước khi bấm Deploy**, mở phần **Environment Variables**, thêm 3 biến:

   | Name | Value |
   |---|---|
   | `UPSTASH_REDIS_REST_URL` | (copy từ Upstash) |
   | `UPSTASH_REDIS_REST_TOKEN` | (copy từ Upstash) |
   | `TOOLKIT_ADMIN_PASSWORD` | mật khẩu bạn tự đặt để bảo vệ chức năng thêm/xoá |

5. Bấm **Deploy**. Xong, có link dạng `nghiahuynh-toolkit-xxxx.vercel.app`.

> Nếu quên thêm env var lúc deploy: vào Project → **Settings → Environment Variables**, thêm sau, rồi vào tab **Deployments** → bấm **Redeploy** ở bản mới nhất để áp dụng.

## Sử dụng
- Bấm nút **+** góc dưới phải → điền tên, link, icon (emoji hoặc URL ảnh), mô tả, nhóm, và **mật khẩu quản trị** (`TOOLKIT_ADMIN_PASSWORD` đã đặt ở trên) → Thêm tool.
- Hover vào card → bấm ✕ để xoá, cũng cần nhập mật khẩu.
- Ai vào xem portal cũng được (không cần mật khẩu), chỉ thêm/xoá mới cần.

## Đổi mật khẩu quản trị sau này
Vào Vercel → Settings → Environment Variables → sửa `TOOLKIT_ADMIN_PASSWORD` → Redeploy.

## Đổi tên miền
Project → Settings → Domains → Add domain bạn có → trỏ DNS theo hướng dẫn Vercel hiện ra.
