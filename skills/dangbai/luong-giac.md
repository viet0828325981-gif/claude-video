---
id: luong-giac
ten: Lượng giác
mo_ta: Giá trị lượng giác, biến đổi và chứng minh đẳng thức, phương trình lượng giác, giải tam giác
---

## Cách làm

Dạng này có ba kiểu bài khác nhau, và sợi chỉ xuyên suốt khác nhau theo kiểu. Chọn đúng một kiểu rồi giữ:

| kiểu bài | sợi chỉ |
|---|---|
| giá trị lượng giác, phương trình lượng giác | **đường tròn đơn vị** |
| biến đổi, chứng minh đẳng thức | **cột biến đổi**, như dạng đại số |
| giải tam giác, định lý sin và cosin | **hình tam giác mọc dần**, như dạng hình học phẳng |

Kiểu thứ nhất là kiểu riêng của dạng này, nên phần dưới nói về nó.

### Dựng đường tròn đơn vị

Khung vuông: `view: [200, 200]` với `box` khoảng `[0.08, 0.26, 0.84, 0.47]` — hai cái cùng tỉ lệ, và giữ cố định suốt video.

- Tâm `O` tại `[100, 100]`, bán kính 80.
- `circle` tại `[100, 100]`, `r: 80`, `fill: "none"`, màu `ink`.
- Hai trục `line` có `arrow: true`: ngang từ `[10, 100]` tới `[190, 100]`, dọc từ `[100, 190]` tới `[100, 10]`.
- Nhãn bốn mốc: `text` cho 1 và −1 trên mỗi trục, và "O" tại tâm.

Điểm ứng với góc `α` nằm tại `[100 + 80·cos α, 100 − 80·sin α]` — **trừ** ở toạ độ thứ hai, vì `y` của `view` hướng xuống.

### Cung vẽ ngược chiều nếu không để ý

`arc` có 0 độ hướng sang phải và **tăng theo chiều kim đồng hồ**. Góc lượng giác thì tăng **ngược** chiều kim đồng hồ. Hai chiều trái nhau.

Nên cung của một góc dương `α` phải viết `"from": -α, "to": 0`, chứ không phải `"from": 0, "to": α`. Viết xuôi là cung hiện ở nửa dưới, sai hẳn góc phần tư.

### Nghiệm và họ nghiệm

Mỗi nghiệm là một `dot` **thêm vào cuối** mảng `els`, màu `a2`. Đường tròn giữ nguyên, chỉ các điểm nghiệm mọc thêm — đó là lợi thế lớn nhất của việc lấy đường tròn làm sợi chỉ.

Họ nghiệm thì đánh dấu đủ các điểm trong một chu kỳ rồi nói rõ chu kỳ là bao nhiêu. Viết `x = π/6 + k·2π` ra chữ mà không chỉ được điểm nào trên đường tròn thì học sinh vẫn không hiểu `k` để làm gì.

Nghiệm bị loại do điều kiện tô `a3`, đừng cùng màu với nghiệm nhận.

### Độ hay radian, chọn một

Chọn một đơn vị cho cả video và giữ. Lẫn hai đơn vị trong một video là chỗ học sinh nhầm nhiều nhất, và nó không giúp gì cả.

Lời đọc thì đọc thành chữ: "pi chia sáu", "ba mươi độ", "hai k pi".

### Chỗ phải cẩn thận về kiến thức

- Dấu của sin, cos, tan theo từng góc phần tư — nói rõ đang ở phần tư nào trước khi lấy dấu.
- Chia hai vế cho `cos x` hay `sin x` thì **phải nêu điều kiện** và xét riêng trường hợp nó bằng không. Bỏ bước này là mất nghiệm.
- Đổi `sin` sang `cos` bằng công thức bình phương thì nhớ dấu căn hai nghiệm.

### Màu theo vai trò

- `ink` — đường tròn, hai trục, nhãn mốc
- `muted` — đường gióng xuống trục, cung phụ
- `a1` — góc hoặc giá trị đề cho
- `a2` — nghiệm nhận, cung đang xét
- `a3` — nghiệm bị loại

### Ba chỗ hỏng đặc trưng

1. Cung vẽ ngược chiều, góc hiện sai phần tư.
2. Giải phương trình hoàn toàn bằng chữ, không có đường tròn nào để nhìn nghiệm.
3. Lẫn độ với radian giữa các cảnh.

## Tiêu chí kiểm

- [chan] Dấu của giá trị lượng giác sai so với góc phần tư
- [chan] Bỏ mất một họ nghiệm của phương trình lượng giác
- [chan] Chia hai vế cho `sin` hoặc `cos` mà không nêu điều kiện
- [ghi] Giải phương trình lượng giác mà không có đường tròn đơn vị để nhìn nghiệm
- [ghi] Cung vẽ sai chiều vì `arc` tăng theo chiều kim đồng hồ còn góc lượng giác tăng ngược chiều
- [ghi] Lẫn độ và radian trong cùng một video
- [ghi] Họ nghiệm viết ra mà không chỉ được điểm nào trên đường tròn
- [ghi] Nghiệm bị loại không phân biệt màu với nghiệm nhận
