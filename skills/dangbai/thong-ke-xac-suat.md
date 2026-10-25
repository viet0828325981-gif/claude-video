---
id: thong-ke-xac-suat
ten: Thống kê và xác suất
mo_ta: Bảng số liệu, biểu đồ, số trung bình, đếm số trường hợp, tính xác suất
---

## Cách làm

Hai kiểu bài, hai sợi chỉ khác nhau:

| kiểu bài | sợi chỉ |
|---|---|
| thống kê: bảng số liệu, biểu đồ, số trung bình, mốt | **bảng mọc dần, rồi biểu đồ cột cạnh nó** |
| xác suất, đếm số trường hợp | **cây trường hợp mọc nhánh** |

Cả hai đều mọc theo lời trong cùng một `view` và một `box` cố định.

### Bảng mọc dần thì đừng dùng `table`

**Phần tử `table` không mọc dần được.** Thêm hàng vào `rows` là đổi chính phần tử đó, mất khớp tiền tố, cả hình vẽ lại.

Bảng cần đầy lên theo lời thì kẻ bằng `line` và điền bằng `text`, mỗi cảnh thêm vài `text` vào cuối mảng. Dành `table` cho bảng hiện đủ một lần rồi không đổi nữa — ví dụ bảng số liệu gốc của đề, đưa ra một lần ở đầu.

### Biểu đồ cột: nhớ trục y hướng xuống

Cột cao `h` đứng trên đường đáy ở `y0` thì viết `rect` với `at: [x, y0 - h]` và `wh: [w, h]` — **trừ** chiều cao, vì `rect` định vị bằng góc trên trái và `y` hướng xuống. Viết `at: [x, y0]` là cột mọc chúc xuống dưới.

Kèm theo cột:
- Đường đáy và trục đứng — `line`, màu `ink`.
- Nhãn từng cột dưới đáy — `text`, `align: "c"`.
- **Giá trị ghi ngay trên đầu cột** — `text` màu `a1`. Biểu đồ không có số trên cột thì người xem phải ước lượng bằng mắt, mất hẳn tác dụng.
- Số trung bình nếu có — `line` ngang `dash: true` màu `a2` cắt qua các cột, thêm vào cuối.

Mỗi cảnh thêm một cột, hoặc thêm một lớp thông tin lên biểu đồ đã có.

### Cây trường hợp

Dùng cho đếm và xác suất. Gốc bên trái hoặc trên, các nhánh mọc dần:

- Mỗi nhánh là một `line` cộng một `dot` ở đầu nhánh cộng một `text` nhãn.
- **Thêm nhánh vào cuối mảng `els`**, đừng vẽ lại cả cây. Cây mọc theo lời là cách duy nhất để người xem đếm cùng với video thay vì nhìn một cây xong không biết đếm từ đâu.
- Ghi xác suất trên từng nhánh, màu `muted`.
- Nhánh thoả điều kiện tô `a2`, nhánh bị loại tô `a3` — đếm bao nhiêu nhánh xanh là ra ngay số trường hợp thuận lợi.

Bài có hai biến thì bảng hai chiều dễ đọc hơn cây. Bài giao nhau giữa các tập thì `ellipse` có `fill: "soft"` làm sơ đồ Venn, mỗi vùng ghi số phần tử.

### Chỗ phải cẩn thận về kiến thức

- Nói rõ **có kể thứ tự hay không** trước khi đếm. Nhầm chỉnh hợp với tổ hợp là lỗi nặng nhất của dạng này.
- Phân biệt biến cố xung khắc với biến cố độc lập trước khi cộng hay nhân xác suất.
- Tổng xác suất của một hệ đầy đủ phải bằng một. Nêu ra và kiểm trên hình.
- Xác suất luôn nằm trong đoạn từ không tới một. Ra số lớn hơn một là sai, không phải làm tròn.

### Màu theo vai trò

- `ink` — khung bảng, trục, đường đáy, cây gốc
- `muted` — xác suất ghi trên nhánh, ghi chú
- `a1` — số liệu đề cho, giá trị trên cột
- `a2` — trường hợp thuận lợi, kết quả cần tìm
- `a3` — trường hợp bị loại

### Ba chỗ hỏng đặc trưng

1. Cột biểu đồ mọc chúc xuống vì quên trục `y` hướng xuống.
2. Vẽ cả cây trường hợp trong một cảnh, người xem không biết đếm từ đâu.
3. Biểu đồ không ghi số trên cột, phải ước lượng bằng mắt.

## Tiêu chí kiểm

- [chan] Tổng xác suất của một hệ đầy đủ không bằng một
- [chan] Xác suất tính ra nằm ngoài đoạn từ không tới một
- [chan] Đếm sai vì nhầm chỉnh hợp với tổ hợp
- [chan] Số liệu trong biểu đồ khác số liệu trong bảng hoặc trong đề
- [ghi] Đếm số trường hợp mà không có cây hoặc bảng nào để nhìn
- [ghi] Cây trường hợp vẽ hết trong một cảnh thay vì mọc dần theo lời
- [ghi] Cột biểu đồ không ghi giá trị trên đầu cột
- [ghi] Biểu đồ thiếu nhãn cột hoặc thiếu đường đáy
- [ghi] Dùng `table` cho bảng cần mọc dần nên cả hình vẽ lại mỗi cảnh
- [ghi] Không nói rõ có kể thứ tự hay không trước khi đếm
