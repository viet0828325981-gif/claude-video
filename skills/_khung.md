---
id: _khung
ten: Hợp đồng chung
mo_ta: Những ràng buộc thật sự từ bên ngoài. Luôn được nạp.
---

## Cách làm

Đây là các ràng buộc kỹ thuật, không phải lời khuyên về cách dạy. Cách dạy là việc của bạn.

**Cấu trúc JSON bộ dựng hiểu được:**
{"title": "tiêu đề video",
 "scenes": [
  {"type": "title" | "point" | "list" | "formula" | "summary",
   "heading": "tiêu đề cảnh",
   "body": "chữ trên màn hình, có thể rỗng",
   "items": [{"text": "...", "mark": "true" | "false" | "none"}],
   "formula": "chỉ dùng với type formula, viết bằng ký tự Unicode như x + 2 = 5, a² + b² = c²; bộ dựng KHÔNG hiểu LaTeX",
   "visual": null hoặc hình minh hoạ theo mô tả bên dưới,
   "narration": "lời đọc của cảnh này",
   "duration": số giây}
 ]}

`items` chỉ hiện với type `list` và `summary`; `mark` là "true"/"false" khi mục là ví dụ đúng/sai. `type` quyết định bố cục cảnh, hiện mỗi type một bố cục cố định.

**Lời đọc sẽ đưa qua máy đọc tiếng Việt.** Máy đọc không đọc được chữ số và ký hiệu toán, nên narration phải viết hết bằng chữ: "x cộng hai bằng năm", "a bình phương", "ba phẩy mười bốn". Tên biến một chữ cái thì giữ nguyên (x, a, b), đó là cách giáo viên đọc thật — đừng phiên âm thành "ích", "bê", cũng đừng gọi vòng vo là "số đầu", "số giữa".

**Tên điểm và đoạn thẳng cứ viết hoa bình thường** trong narration: "tiếp tuyến MA", "tứ giác MAOB", "đường cao AH". Tầng đọc tự đổi cụm chữ in hoa thành tên chữ cái lúc phát ra tiếng ("mờ a", "mờ a o bê", "a hát"), nên bạn đừng tự phiên âm — viết "mờ a" vào narration sẽ làm chữ xấu đi mà không giúp gì thêm.

**Khung hình dọc 720×1280 nên rất hẹp.** Chữ dài sẽ tự co nhỏ lại cho vừa, co quá thì không đọc nổi. Đây là giới hạn vật lý, không phải quy định: nếu bạn xem được ảnh dựng thử thì cứ tin mắt mình hơn tin con số.

**Mở cảnh và âm chuyển cảnh do bạn quyết, không phải template.** Template chỉ cấp một bảng âm có sẵn (xem phần phong cách); dùng vai nào, lúc nào, hay không dùng là việc của bạn. Mỗi cảnh nhận thêm trường tuỳ chọn `"chuyen"`:

- `"noi"` — cảnh này nối tiếp cảnh trước như cùng một cú máy: **không phát âm chuyển cảnh**, và chữ vào sẵn một đoạn nên ranh giới không bị loé một khoảng trống. Dùng khi cảnh sau chỉ thêm một bước vào cùng một mạch, nhất là khi giữ nguyên hình.
- `"im"` — vẫn là cảnh mới nhưng im lặng.
- tên một vai âm của template — phát đúng vai đó thay cho âm chuyển cảnh mặc định.
- bỏ trống — mặc định: cảnh giữ nguyên hình của cảnh trước thì coi như `"noi"`, còn lại phát âm chuyển cảnh.

Không dùng emoji.

## Tiêu chí kiểm

- [chan] Có phát biểu sai kiến thức so với chương trình phổ thông Việt Nam
- [chan] Lời đọc mâu thuẫn với chữ hoặc hình hiện cùng cảnh
- [chan] Hình vẽ không khớp giả thiết nêu trong lời
- [ghi] Có cảnh không mang thông tin mới so với cảnh trước
