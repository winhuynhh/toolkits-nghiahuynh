# LP Toolkit

Trang portal gộp tất cả tools cá nhân vào 1 nơi. Card hiện tự động từ `tools-config.js` — không cần đụng vào HTML/CSS để thêm tool mới.

## Cấu trúc
```
index.html        → khung trang
style.css          → giao diện
script.js          → logic render, search, filter, theme
tools-config.js    → 👉 FILE DUY NHẤT CẦN SỬA để thêm/xoá/sửa tool
```

## Thêm 1 tool mới
Mở `tools-config.js`, copy 1 block trong mảng `TOOLS`, sửa lại:

```js
{
  name: "Tên tool",
  url: "https://your-tool.vercel.app",
  icon: "🔧",              // emoji hoặc link ảnh https://...png
  description: "Mô tả ngắn 1 dòng.",
  category: "Học tập",     // dùng để lọc theo nhóm, tự tạo nhóm mới thoải mái
},
```

Lưu file, reload trang — card mới xuất hiện ngay, không cần build gì thêm.

## Deploy lên Vercel (chỉ cần trình duyệt)

**Cách 1 — kéo thả (nhanh nhất, không cần GitHub):**
1. Vào https://vercel.com/new, đăng nhập.
2. Chọn "Deploy" → kéo cả thư mục này vào ô upload (hoặc dùng "Browse").
3. Vercel tự nhận đây là static site, bấm Deploy. Xong, có link dạng `xxx.vercel.app`.

**Cách 2 — qua GitHub (khuyên dùng nếu sẽ sửa thường xuyên):**
1. Tạo repo mới trên GitHub, upload 5 file trong thư mục này (dùng nút "Add file → Upload files" trên GitHub, không cần Git CLI).
2. Vào https://vercel.com/new → "Import Git Repository" → chọn repo vừa tạo.
3. Framework Preset để "Other" — không cần build command, để trống. Output directory để trống (root).
4. Deploy. Từ giờ mỗi lần sửa `tools-config.js` trên GitHub (Edit trực tiếp trên web), Vercel tự deploy lại.

### Đổi sang domain phụ của laphanblog.com sau này
Vercel → Project → Settings → Domains → Add `tools.laphanblog.com` → thêm CNAME record tương ứng ở nơi quản lý DNS của laphanblog.com (giống cách đã cấu hình QUIC.cloud trước đây, chỉ khác đích trỏ).

## Việc cần làm tiếp
Trong `tools-config.js`, 3 tool mẫu đang có URL placeholder (`REPLACE-WITH-...`) — thay bằng link thật của Flashcard, Chữ ký số, và Yến sào, hoặc xoá nếu chưa có link.
