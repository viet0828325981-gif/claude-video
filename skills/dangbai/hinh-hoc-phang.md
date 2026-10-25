---
id: hinh-hoc-phang
ten: Hình học phẳng
mo_ta: Chứng minh, tính toán trên hình phẳng — tam giác, đường tròn, tứ giác, tiếp tuyến
---

## Cách làm

Sợi chỉ xuyên suốt của dạng này là **một hình duy nhất lớn dần**, và nó là nhân vật chính của video chứ không phải minh hoạ kèm theo. Nói tới đâu, hình mọc thêm tới đó. Nghe "nối OA và OB" thì đúng lúc ấy hai đoạn đó xuất hiện. Nghe "hai góc này bù nhau" thì đúng lúc ấy hai góc được tô.

Dùng cơ chế hình liên tục ở hợp đồng chung, và đặt `"chuyen": "noi"` cho các cảnh tiếp nối — cả chuỗi sẽ chạy như **một cú máy liên tục**, chỉ có nét mới xuất hiện theo lời.

### Nói về cái gì thì tô cái đó

Đây là chỗ hình học hay hỏng nhất. Khi lời đọc nói "xét hai tam giác OBA và OCA", mà trên màn hình cả hai tam giác vẫn là nét trắng mảnh lẫn giữa đường tròn và các đoạn khác, thì người xem **không tách ra được hai tam giác ấy**. Hình có đủ nét nhưng không nói được gì.

Quy tắc: **đối tượng đang bàn phải nổi lên khỏi phần còn lại.**

- So sánh hai hình với nhau thì tô **hai màu khác nhau** — `poly` có `fill` là `a2` và `a3` chồng lên đúng ba đỉnh của mỗi tam giác. Hai mảng màu cạnh nhau là thấy ngay chúng đối xứng.
- Nhấn một đoạn thì thêm `line` màu nhấn trùng lên nó.
- Nhấn một góc thì thêm `arc` màu nhấn tại đỉnh.

Phần nhấn là phần tử **thêm vào cuối**, không phải sửa phần tử cũ.

### Màu theo vai trò, giữ nhất quán cả video

- `ink` — hình gốc: đường tròn, các đoạn dựng theo giả thiết
- `muted` — đoạn phụ, nét dựng tạm
- `a1` — số liệu đề cho
- `a2` — đối tượng đang chứng minh, hoặc hình thứ nhất khi so sánh
- `a3` — hình thứ hai khi so sánh, hoặc kết quả vừa suy ra

### Hình là nhân vật chính, đừng để khung trống

Ở dạng này hình chiếm phần lớn khung, không phải nằm nép ở đáy. Sau tiêu đề là tới hình ngay — **đừng chừa dải trống giữa chữ và hình**, nhìn rất rời rạc.

Chữ của cảnh vẫn vẽ ở chỗ cố định theo `type`, nên `box` phải **tránh hẳn vùng chữ**, không được chồng lên. Cảnh có `body` dài thì chừa phần dưới cho chữ; cảnh chỉ có `heading` ngắn thì cho `box` chạy gần hết khung. Dựng ảnh thử xong hãy nhìn kỹ xem nhãn trong hình có lọt vào giữa dòng chữ không.

Hình nên đặt `box` lớn và **cố định suốt video**, vì nó phải sống cùng mọi cảnh. Chừa đủ chỗ cho chữ ở phần còn lại của khung.

### Về lập luận

Vẽ hình theo giả thiết trước, rồi mỗi bước nói rõ **đang dùng giả thiết nào** và **suy ra chi tiết nào trên hình**. Chỗ học sinh hụt là lúc một đoạn thẳng mới xuất hiện mà không biết nó ở đâu ra, nên câu lời đọc và nét mới phải khớp nhau từng cảnh một.

### Ba chỗ hỏng đặc trưng

1. Hình đủ nét nhưng không tô gì, nên nói về tam giác nào người xem cũng không tìm ra tam giác đó.
2. Hình nhỏ nép ở đáy khung trong khi hai phần ba khung trên để trống.
3. Một cảnh vẽ thêm bốn năm đoạn cùng lúc, lời đọc chỉ kịp nhắc một đoạn.

## Tiêu chí kiểm

- [chan] Hình vẽ mâu thuẫn với giả thiết của đề
- [ghi] Cảnh so sánh hai hình mà không tô hai hình đó bằng hai màu khác nhau
- [ghi] Lời đọc nhắc tới một đoạn, một góc hay một tam giác mà hình không làm nổi nó lên
- [ghi] Khung còn dải trống lớn giữa chữ và hình
- [ghi] Hình chỉ chiếm một phần nhỏ khung dù cảnh không có nhiều chữ
- [ghi] Có bước suy luận không nói rõ dùng giả thiết nào
