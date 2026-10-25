---
id: dai-so-bien-doi
ten: Đại số, biến đổi
mo_ta: Giải phương trình, hệ, bất phương trình, rút gọn biểu thức, phân tích nhân tử
---

## Cách làm

Sợi chỉ xuyên suốt của dạng này là **cột biến đổi**: một cột các dòng biểu thức mọc dần từ trên xuống, dòng cũ không bao giờ biến mất. Người xem phải thấy được cả đường đi từ đề tới đáp số trong một khung hình, và biết mỗi lần đổi là nhờ phép gì.

Đừng nghĩ đại số thì không có hình. Cột biến đổi **là** một hình, và nó dùng được nguyên vẹn cơ chế hình liên tục ở hợp đồng chung: cùng `view`, dòng cũ đứng đầu mảng `els` giống hệt nhau, dòng mới thêm vào cuối. Làm đúng thì cả video là một cột lớn dần, không cảnh nào vẽ lại.

### Dựng cột biến đổi

- `view` khoảng `[180, 210]`, giữ cố định suốt video. Ô đặt hình do bộ dựng lo.
- Mỗi dòng là một `text` tại `[8, y]`, `align: "l"`, `y` bắt đầu từ 20 và **cách nhau 24 đơn vị**. Tám dòng là vừa khung; cần hơn tám bước thì tách bài nhỏ hơn chứ đừng bóp khoảng cách dòng.
- Tên phép vừa dùng ghi bên phải **cùng dòng đó**: `text` tại `[172, y]`, `align: "r"`, `size: 1`, màu `muted`. Ví dụ "chuyển vế", "nhân hai vế với x", "đặt nhân tử chung".
- Muốn chỉ rõ chỗ vừa đổi thì **khoanh viền**, đừng tô kín: `rect` với `fill: "none"` và `c: "a2"`, hoặc gạch dưới bằng `line` màu nhấn. Phần tử tô kín vẽ sau sẽ **đè lên chữ** và che mất dòng.
- Nối hai dòng để chỉ vừa biến đổi từ đâu tới đâu: `line` có `arrow: true`, màu `muted`, đi dọc bên phải cột.

### Cảnh nào dùng cột, cảnh nào không

Cảnh có cột biến đổi thì nên dùng `type: "point"`, để trường `formula` khỏi lặp lại đúng dòng cuối của cột — lặp hai lần cùng một biểu thức trên một khung là thừa và chật.

Dành `type: "formula"` cho cảnh nêu một công thức chốt mà cột chưa có, ví dụ công thức nghiệm hay hằng đẳng thức sắp dùng.

### Màu theo vai trò

- `ink` — các dòng biến đổi
- `muted` — tên phép, mũi tên nối dòng
- `a1` — hệ số và số liệu lấy từ đề
- `a2` — nghiệm nhận, kết quả cuối
- `a3` — nghiệm bị loại, nhánh xét rồi bỏ

Nghiệm bị loại phải khác màu nghiệm nhận. Bài có điều kiện xác định mà hai nghiệm cùng một màu thì người xem không biết cái nào bị loại.

### Giữ cách viết không đổi

Giữ nguyên cách viết biểu thức qua các bước để mắt bám theo được. Nếu đổi cách trình bày giữa chừng — đổi thứ tự hạng tử, đổi tên ẩn, đổi cách nhóm — thì người xem tưởng là biểu thức khác. Muốn đổi thì phải nói ra.

### Ba chỗ hỏng đặc trưng

1. Mỗi cảnh viết lại biểu thức ở một chỗ khác trong khung, nên không ai thấy được đường đi.
2. Một dòng nhảy hai phép cùng lúc, học sinh không biết vừa làm gì.
3. Nhấn bằng phần tử tô kín, chữ bị che mất.

## Tiêu chí nhìn

Những câu chỉ trả lời được khi mở ảnh khung hình ra nhìn.

- Cột biến đổi có đọc được từ trên xuống không
- Tên phép ghi bên phải có dính vào biểu thức không
- Chỗ vừa đổi có được khoanh hoặc gạch dưới không
- Phần khoanh có che mất chữ không

## Tiêu chí kiểm

- [chan] Một phép biến đổi làm sai lệch nghiệm
- [ghi] Cách viết cùng một biểu thức đổi giữa chừng mà không nói
- [ghi] Một cảnh làm nhiều phép biến đổi cùng lúc nên không rõ vừa dùng phép gì
- [ghi] Có dòng biến đổi mà không ghi tên phép vừa dùng
- [ghi] Nghiệm bị loại không phân biệt màu với nghiệm nhận
- [ghi] Dùng phần tử có `fill` chồng lên chữ nên che mất chữ
- [ghi] Cột biến đổi lặp lại đúng dòng cuối ở trường `formula` của cùng cảnh
- [ghi] Có hình nhưng hình không chở thông tin gì hơn phần chữ
