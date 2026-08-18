/**
 * ============================================================
 *  DANH SÁCH TOOLS — chỉ cần sửa file này để thêm/xoá/sửa tool
 * ============================================================
 *
 *  Mỗi tool là 1 object gồm:
 *    name        (bắt buộc) — Tên hiển thị trên card
 *    url         (bắt buộc) — Link tool (mở tab mới)
 *    icon        (bắt buộc) — 1 emoji (vd "📇") HOẶC link ảnh (https://...png/svg)
 *    description (tuỳ chọn) — Mô tả ngắn 1 dòng
 *    domain      (tuỳ chọn) — Hiện dưới card kiểu monospace. Nếu bỏ trống,
 *                              portal tự lấy hostname từ url
 *    category    (tuỳ chọn) — Dùng để lọc theo nhóm (vd "Học tập", "Tài chính")
 *                              Để trống hoặc "Khác" nếu chưa phân loại
 *
 *  Thêm tool mới = copy 1 object bên dưới, dán vào, sửa nội dung.
 *  Không cần build lại gì cả — reload trang là thấy ngay.
 * ============================================================
 */

const TOOLS = [
  {
    name: "Flashcard Việt–Anh",
    url: "https://REPLACE-WITH-YOUR-FLASHCARD-URL.vercel.app",
    icon: "📇",
    description: "Học từ vựng Việt–Anh, nhắc nhở qua Telegram, tự phân loại chủ đề bằng AI.",
    category: "Học tập",
  },
  {
    name: "Chữ ký số",
    url: "https://REPLACE-WITH-YOUR-SIGNATURE-TOOL-URL.vercel.app",
    icon: "✍️",
    description: "Tạo / chèn chữ ký số vào tài liệu.",
    category: "Văn phòng",
  },
  {
    name: "Tính lợi nhuận Yến sào",
    url: "https://REPLACE-WITH-YOUR-APPS-SCRIPT-WEBAPP-URL",
    icon: "🪺",
    description: "Tính giá vốn, lợi nhuận theo từng loại sản phẩm, xuất báo cáo.",
    category: "Kinh doanh",
  },
  // 👉 Thêm tool mới của bạn ở đây, theo đúng format phía trên.
];

// Không cần sửa dòng dưới đây
if (typeof module !== "undefined") module.exports = TOOLS;
