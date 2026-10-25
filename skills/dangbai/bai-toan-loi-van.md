---
id: bai-toan-loi-van
ten: Bài toán có lời văn
mo_ta: Lập phương trình hoặc hệ từ đề bằng lời — chuyển động, năng suất, phần trăm, tuổi, hình học thực tế
---

## Cách làm

Dạng này khó ở chỗ **chuyển lời thành số**, không phải ở chỗ giải. Học sinh đọc đề xong không biết đặt ẩn là gì, nên nhìn phương trình xuất hiện thì thấy như phép phù thuỷ.

Vì vậy sợi chỉ xuyên suốt là **bảng đại lượng mọc dần**, rồi phương trình sinh ra từ bảng, rồi cột biến đổi mọc tiếp bên dưới — **một hình duy nhất cho cả video**, không phải ba hình rời.

### Bố cục một hình cho cả video

Chọn `view` cao, ví dụ `[180, 235]`, giữ cố định suốt video. Ô đặt hình do bộ dựng lo; bạn chia bên trong `view` theo chiều cao:

- `y` 10 đến 110 — bảng đại lượng
- `y` khoảng 135 — phương trình lập được
- `y` 160 trở xuống — cột biến đổi

Nhờ vậy cả video là một hình lớn dần: bảng đầy lên, phương trình hiện ra, rồi các dòng giải mọc xuống. Không cảnh nào vẽ lại.

### Bảng mọc dần thì đừng dùng `table`

**Phần tử `table` không mọc dần được.** Thêm một hàng vào `rows` là đổi chính phần tử đó, nên mất khớp tiền tố và cả hình vẽ lại.

Muốn bảng đầy lên theo lời thì dựng bằng tay:

1. Cảnh đầu kẻ khung và tiêu đề cột — `line` cho các đường kẻ, `text` cho tiêu đề. Đây là tiền tố cố định.
2. Mỗi cảnh sau thêm **một hàng**, tức là thêm vài `text` vào cuối mảng `els`.

Dành `table` cho bảng hiện đủ một lần và không đổi nữa.

Ba cột thường đủ: **đại lượng | ký hiệu | giá trị**. Bài chuyển động thì bốn cột: **quãng đường | vận tốc | thời gian** cho từng đối tượng.

### Đặt ẩn phải nói đơn vị

Viết ẩn vào bảng kèm đơn vị ngay: "vận tốc xe thứ nhất — x — ki lô mét mỗi giờ". Đặt ẩn mà không nói đơn vị là nguồn gốc của hầu hết đáp số sai đơn vị ở dạng này.

Nêu luôn điều kiện của ẩn lúc đặt, không để tới cuối: vận tốc dương, thời gian dương, số người nguyên dương.

### Cảnh đối chiếu với thực tế là bắt buộc

Giải ra nghiệm chưa xong. Phải có một cảnh **đối chiếu từng nghiệm với điều kiện thực tế** rồi mới kết luận. Nghiệm bị loại tô `a3`, nghiệm nhận tô `a2`, và nói rõ loại vì sao — "vận tốc không thể âm", "số người phải là số nguyên".

Đây là bước bị bỏ nhiều nhất, và cũng là bước làm bài này khác một bài giải phương trình thuần.

Đáp số cuối **luôn kèm đơn vị**.

### Màu theo vai trò

- `ink` — khung bảng, tiêu đề cột, các dòng biến đổi
- `muted` — tên phép biến đổi, ghi chú
- `a1` — số liệu lấy trực tiếp từ đề
- `a2` — ẩn, phương trình lập được, nghiệm nhận, đáp số
- `a3` — nghiệm bị loại

### Ba chỗ hỏng đặc trưng

1. Đi thẳng từ lời đề sang phương trình, không ai thấy phương trình ở đâu ra.
2. Bảng điền hết một lúc ở một cảnh, mất hẳn tác dụng dẫn dắt.
3. Giải ra nghiệm rồi kết luận luôn, không đối chiếu điều kiện thực tế.

## Tiêu chí nhìn

Những câu chỉ trả lời được khi mở ảnh khung hình ra nhìn.

- Bảng đại lượng có đọc được không, các cột có thẳng hàng không
- Ô đã điền và ô còn trống có phân biệt được không

## Tiêu chí kiểm

- [chan] Phương trình lập ra không khớp dữ kiện đề
- [chan] Đáp số vi phạm điều kiện thực tế mà vẫn được nhận
- [ghi] Đặt ẩn mà không nói rõ ẩn là gì và đơn vị nào
- [ghi] Đi thẳng từ lời đề sang phương trình, không có bảng hay sơ đồ nào gom dữ kiện
- [ghi] Bảng đại lượng điền hết một lúc thay vì mọc dần theo lời
- [ghi] Dùng phần tử `table` cho bảng cần mọc dần nên cả hình vẽ lại mỗi cảnh
- [ghi] Thiếu cảnh đối chiếu nghiệm với điều kiện thực tế
- [ghi] Đáp số không kèm đơn vị
