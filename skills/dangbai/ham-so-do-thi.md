---
id: ham-so-do-thi
ten: Hàm số và đồ thị
mo_ta: Vẽ đồ thị, tương giao, biện luận theo tham số
---

## Cách làm

Sợi chỉ xuyên suốt là **hệ trục toạ độ**, và nó nên tồn tại suốt video giống như hình ở bài hình học: vẽ trục một lần rồi thêm dần đồ thị, giao điểm, đường phụ.

Bộ dựng giữ nguyên phần hình trùng khớp giữa hai cảnh liên tiếp, nên hãy để trục và các phần đã có **đứng đầu mảng `els`, giống hệt nhau, cùng `view` và cùng `box`**, rồi thêm phần mới vào cuối.

Đồ thị phải tính sẵn điểm rồi đưa vào `curve`. Trục cần nhãn và mũi tên. Giao điểm nên có toạ độ ghi kèm.

Khi biện luận theo tham số, mỗi trường hợp là một đường mới thêm vào cùng một hệ trục, để người xem so sánh được, chứ đừng vẽ ba hệ trục riêng.

## Tiêu chí kiểm

- [chan] Đồ thị vẽ sai dạng so với hàm số
- [ghi] Trục thiếu nhãn hoặc thiếu mũi tên
- [ghi] Mỗi trường hợp biện luận vẽ một hệ trục riêng thay vì chồng lên một hệ trục
- [ghi] Hệ trục bị vẽ lại giữa chừng vì đổi `view` hoặc `box`
