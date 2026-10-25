---
id: hinh-hoc-khong-gian
ten: Hình học không gian
mo_ta: Khối đa diện, hình chiếu, thể tích, khoảng cách và góc trong không gian
---

## Cách làm

Sợi chỉ xuyên suốt là **một khối duy nhất, vẽ bằng hình chiếu song song, lớn dần theo lời** — y như giáo viên vẽ hình chóp lên bảng rồi kẻ thêm từng đường.

**Khối 3D của phong cách `geo3d` chỉ là nền minh hoạ, không phải hình của bài.** Mọi đỉnh, cạnh, nhãn, số liệu và đường dựng đều phải nằm ở kênh `visual` hai chiều. Đừng trông vào khối nền để chở nội dung.

### Vẽ khối bằng hình chiếu song song

Tự chọn một phép chiếu rồi **giữ nguyên nó suốt video**:

1. Chọn ba hướng trên mặt phẳng cho ba trục không gian. Thông dụng: `Ox` sang phải, `Oz` lên trên, `Oy` chéo xuống trái khoảng 30 độ và **rút ngắn còn một nửa** — đó là cách vẽ cho hình khối trông có chiều sâu mà không rối.
2. Tính toạ độ phẳng của từng đỉnh một lần, ghi nhớ, rồi mọi cảnh dùng đúng các toạ độ đó. Đỉnh xê dịch giữa hai cảnh là mất khớp và cả hình vẽ lại.
3. Nhớ `y` của `view` hướng xuống: điểm cao hơn trong không gian có `y` nhỏ hơn trong hình.

### Nét thấy và nét khuất

**Cạnh bị khối che phải vẽ `dash: true`.** Đây là quy ước bắt buộc của môn, không phải sở thích: hình chóp mà vẽ hết bằng nét liền thì người xem không đọc ra được khối nào nằm trước khối nào.

Quyết nét khuất một lần theo phép chiếu đã chọn, rồi giữ nguyên. Một cạnh đang liền mà cảnh sau thành đứt là vừa sai vừa mất khớp.

### Thứ tự dựng, mỗi cảnh thêm một lớp

1. Đáy trước — `poly` với `fill: "none"`, hoặc `line` nối các đỉnh đáy.
2. Đỉnh và các cạnh bên.
3. Nhãn đỉnh — `text` đặt **ra ngoài** khối, lệch khỏi đầu cạnh một chút, đừng đặt đúng lên điểm.
4. Số liệu đề cho, màu `a1`.
5. Đường dựng thêm theo lời: đường cao, hình chiếu của đỉnh, giao tuyến, đoạn nối trung điểm.
6. Thiết diện hoặc mặt đang xét — `poly` có `fill` màu nhấn, thêm vào cuối.

Mặt phẳng cắt nên tô bằng `poly` có `fill: "a2"`: một mặt phẳng vẽ bằng bốn nét liền thì lẫn vào các cạnh của khối, tô lên mới thấy nó là một mặt.

### Góc vuông trong không gian

Góc vuông thật trong không gian **thường không vuông trên hình chiếu**. Vì vậy đừng đánh ô vuông theo hình, mà đánh theo giả thiết, và nói rõ trong lời đọc rằng hình chiếu làm nó trông không vuông. Học sinh hụt đúng ở chỗ này.

### Màu theo vai trò

- `ink` — cạnh thấy của khối
- `muted` — cạnh khuất, đường dựng tạm
- `a1` — số liệu đề cho
- `a2` — mặt phẳng hoặc đối tượng đang xét
- `a3` — kết quả vừa suy ra, khoảng cách hoặc góc cần tìm

### Ba chỗ hỏng đặc trưng

1. Vẽ hết bằng nét liền, không phân biệt cạnh khuất, khối thành một mớ đường.
2. Đỉnh xê dịch giữa các cảnh vì tính lại toạ độ mỗi lần.
3. Trông vào khối 3D nền để chở nội dung, nên `visual` trống rỗng.

## Tiêu chí kiểm

- [chan] Hình chiếu mâu thuẫn với giả thiết của đề
- [chan] Phép chiếu đổi giữa các cảnh nên cùng một khối trông thành hai khối khác nhau
- [ghi] Cạnh khuất không vẽ bằng nét đứt
- [ghi] Nhãn đỉnh đặt đúng lên điểm hoặc lên cạnh nên không đọc được
- [ghi] Mặt phẳng đang xét không tô màu nên lẫn vào các cạnh của khối
- [ghi] Đánh dấu góc vuông theo hình chiếu thay vì theo giả thiết
- [ghi] Số liệu và nhãn trông vào khối 3D nền thay vì vẽ ở kênh `visual`
