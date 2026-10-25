---
id: khac
ten: Dạng khác
mo_ta: Dùng khi bài không thuộc các dạng đã có
---

## Cách làm

Không có dạng sẵn thì việc đầu tiên là **tự tìm sợi chỉ xuyên suốt** cho bài này, trước khi viết cảnh nào. Trả lời bốn câu, theo đúng thứ tự:

1. **Suốt video này người xem cần nhìn cái gì?** Một hình, một bảng, một cột biến đổi, một cây trường hợp, hay một trục số. Chọn **một**, không phải mỗi cảnh một thứ.
2. **Cái đó mọc dần theo thứ tự nào?** Viết ra thứ tự trước khi dàn cảnh.
3. **Mỗi cảnh thêm đúng một thứ gì vào nó?** Một dòng, một nhánh, một hàng, một nét.
4. **Cái gì không bao giờ đổi từ đầu đến cuối?** Phần đó là tiền tố, phải giống hệt nhau qua mọi cảnh.

Rồi dùng cơ chế hình liên tục ở hợp đồng chung để giữ nó.

### Ánh xạ sẵn cho vài dạng hay gặp

| bài về | sợi chỉ | dựng bằng |
|---|---|---|
| dãy số, cấp số | bảng giá trị mọc thêm hàng | `line` kẻ khung + `text` từng ô |
| xác suất, tổ hợp, đếm | cây trường hợp mọc nhánh | `line` + `dot` + `text` |
| tập hợp | sơ đồ Venn thêm vùng | `ellipse` với `fill` |
| số học, chia hết, số nguyên tố | bảng phân tích hoặc trục số | `line` + `text`, hoặc `line` + `dot` |
| bất đẳng thức, bất phương trình | trục số với các khoảng | `line`, `dot`, `arc` |
| đạo hàm, khảo sát hàm | bảng biến thiên cạnh đồ thị | `line` + `text` rồi `curve` |
| hình học toạ độ | hệ trục với điểm và đường mọc dần | như dạng hàm số |

**Bảng nào cần mọc dần thì đừng dùng phần tử `table`.** Thêm hàng vào `rows` là đổi chính phần tử đó, nên mất khớp tiền tố và cả hình vẽ lại. Kẻ khung bằng `line` rồi điền từng ô bằng `text`, mỗi cảnh thêm vài `text` vào cuối mảng. `table` chỉ dành cho bảng hiện đủ một lần rồi không đổi nữa.

### Khi thật sự không có gì để nhìn

Có bài mà hình nào cũng là trang trí — ví dụ một định nghĩa thuần hoặc một quy ước ký hiệu. Lúc đó **đừng bịa hình**. Để `visual: null`, giữ chữ sạch và dùng `type: "formula"` hay `"list"` cho tử tế. Một hình trang trí tệ hơn không có hình: nó chiếm chỗ và kéo mắt khỏi chữ.

## Tiêu chí kiểm

- [ghi] Mỗi cảnh một kiểu hình khác nhau, không có gì nối các cảnh lại
- [ghi] Không xác định được sợi chỉ nào xuyên suốt video
- [ghi] Có hình nhưng hình không chở thông tin gì hơn phần chữ
