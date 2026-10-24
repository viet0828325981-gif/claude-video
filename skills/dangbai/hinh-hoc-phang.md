---
id: hinh-hoc-phang
ten: Hình học phẳng
mo_ta: Chứng minh, tính toán trên hình phẳng — tam giác, đường tròn, tứ giác, tiếp tuyến
---

## Cách làm

Ở dạng này **hình là sợi chỉ xuyên suốt cả video**, không phải minh hoạ kèm theo từng cảnh. Người xem phải nhìn một hình duy nhất lớn dần lên: nói tới đâu, hình mọc thêm tới đó. Nghe "nối OA và OB" thì đúng lúc ấy hai đoạn đó xuất hiện. Nghe "hai góc này bù nhau" thì đúng lúc ấy hai góc được tô.

Nếu mỗi cảnh vẽ lại hình từ đầu, người xem phải định vị lại từ đầu mỗi lần và không thấy lập luận đang đi đâu.

### Cách làm cho hình bám theo lời

Bộ dựng cho phép dựng hiệu quả này bằng **nhiều cảnh ngắn nối liền nhau**, không phải vài cảnh dài:

1. Mỗi cảnh mang **đúng một câu lời đọc** và **thêm đúng một ý vào hình** — một đoạn thẳng, một ký hiệu bằng nhau, một góc được tô, một nhãn.
2. Mọi cảnh có hình dùng **cùng `view` và cùng `box`**.
3. Những phần tử đã có phải **giống hệt nhau và đứng đầu mảng `els`**, đúng thứ tự, không đổi màu, không xê dịch. Phần mới **thêm vào cuối mảng**.
4. Đặt `"chuyen": "noi"` cho các cảnh tiếp nối. Khi đó cảnh không phát âm chuyển cảnh, không mờ đi ở ranh giới, và hình đang có nằm nguyên trên màn hình — cả chuỗi chạy như **một cú máy liên tục**, chỉ có nét mới xuất hiện theo lời.

Muốn làm nổi một đoạn đã có thì **đừng sửa phần tử cũ** — thêm một phần tử mới trùng lên nó với màu `a2` hoặc `a3`. Sửa phần tử cũ là mất khớp, cả hình sẽ vẽ lại.

### Nói về cái gì thì tô cái đó

Đây là chỗ hình học hay hỏng nhất. Khi lời đọc nói "xét hai tam giác OBA và OCA", mà trên màn hình cả hai tam giác vẫn là nét trắng mảnh lẫn giữa đường tròn và các đoạn khác, thì người xem **không tách ra được hai tam giác ấy**. Hình có đủ nét nhưng không nói được gì.

Quy tắc: **đối tượng đang bàn phải nổi lên khỏi phần còn lại.**

- So sánh hai hình với nhau thì tô **hai màu khác nhau** — `poly` có `fill` là `a2` và `a3` chồng lên đúng ba đỉnh của mỗi tam giác. Hai mảng màu cạnh nhau là thấy ngay chúng đối xứng.
- Nhấn một đoạn thì thêm `line` màu nhấn trùng lên nó.
- Nhấn một góc thì thêm `arc` màu nhấn tại đỉnh.
- Qua cảnh sau, phần nhấn cũ **giữ nguyên hoặc thêm phần nhấn mới** — đừng gỡ ra, vì gỡ là mất khớp tiền tố và cả hình vẽ lại.

### Màu theo vai trò, giữ nhất quán cả video

- `ink` — hình gốc: đường tròn, các đoạn dựng theo giả thiết
- `muted` — đoạn phụ, nét dựng tạm
- `a1` — số liệu đề cho
- `a2` — đối tượng đang chứng minh, hoặc hình thứ nhất khi so sánh
- `a3` — hình thứ hai khi so sánh, hoặc kết quả vừa suy ra

Đừng đổi màu một đại lượng giữa chừng. Số `6` của bán kính mà cảnh này xanh cảnh kia đỏ thì người xem tưởng là hai thứ khác nhau.

### Hình là nhân vật chính, đừng để khung trống

Ở dạng này hình chiếm phần lớn khung, không phải nằm nép ở đáy. Sau tiêu đề là tới hình ngay — **đừng chừa dải trống giữa chữ và hình**, nhìn rất rời rạc.

Chữ của cảnh vẫn vẽ ở chỗ cố định theo `type`, nên `box` phải **tránh hẳn vùng chữ**, không được chồng lên. Cảnh có `body` dài thì chừa phần dưới cho chữ; cảnh chỉ có `heading` ngắn thì cho `box` chạy gần hết khung. Dựng ảnh thử xong hãy nhìn kỹ xem nhãn trong hình có lọt vào giữa dòng chữ không.

Vì các cảnh nối liền nhau nên **được phép dùng nhiều cảnh hơn con số gợi ý**, miễn tổng lời đọc vẫn trong ngân sách ký tự. Mười lăm cảnh ngắn liền mạch tốt hơn sáu cảnh dài mà hình nhảy.

Hình nên đặt `box` lớn và **cố định suốt video**, vì nó phải sống cùng mọi cảnh. Chừa đủ chỗ cho chữ ở phần còn lại của khung.

### Về lập luận

Vẽ hình theo giả thiết trước, rồi mỗi bước nói rõ **đang dùng giả thiết nào** và **suy ra chi tiết nào trên hình**. Chỗ học sinh hụt là lúc một đoạn thẳng mới xuất hiện mà không biết nó ở đâu ra, nên câu lời đọc và nét mới phải khớp nhau từng cảnh một.

## Tiêu chí kiểm

- [chan] Hình vẽ mâu thuẫn với giả thiết của đề
- [ghi] Các cảnh có hình dùng `view` hoặc `box` khác nhau nên hình bị vẽ lại giữa chừng
- [ghi] Phần tử của hình gốc bị đổi thứ tự hoặc đổi màu giữa các cảnh
- [ghi] Một cảnh thêm nhiều ý vào hình cùng lúc nên lời và hình không khớp nhau
- [ghi] Cảnh so sánh hai hình mà không tô hai hình đó bằng hai màu khác nhau
- [ghi] Lời đọc nhắc tới một đoạn, một góc hay một tam giác mà hình không làm nổi nó lên
- [ghi] Cùng một đại lượng đổi màu giữa các cảnh
- [ghi] Khung còn dải trống lớn giữa chữ và hình
- [ghi] Có bước suy luận không nói rõ dùng giả thiết nào
