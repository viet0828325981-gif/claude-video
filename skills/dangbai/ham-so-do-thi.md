---
id: ham-so-do-thi
ten: Hàm số và đồ thị
mo_ta: Vẽ đồ thị, tương giao, biện luận theo tham số
---

## Cách làm

Sợi chỉ xuyên suốt là **một hệ trục toạ độ duy nhất**, tồn tại suốt video: vẽ trục một lần rồi thêm dần đồ thị, giao điểm, đường phụ. Dùng cơ chế hình liên tục ở hợp đồng chung — trục và các phần đã có đứng đầu mảng `els`, phần mới thêm vào cuối.

### Đổi toạ độ toán sang toạ độ hình

**Trục `y` của `view` hướng xuống.** Đây là chỗ dạng này hỏng nhiều nhất: đưa thẳng toạ độ toán vào là đồ thị lộn ngược, parabol quay xuống, hàm đồng biến thành nghịch biến.

Chọn miền cần vẽ `x ∈ [xmin, xmax]`, `y ∈ [ymin, ymax]`, rồi lấy `view = [W, H]` **cùng tỉ lệ với miền đó** để hình không méo. Mỗi điểm `(x, y)` của toán đặt tại:

```
[ (x - xmin) * W / (xmax - xmin),  (ymax - y) * H / (ymax - ymin) ]
```

Ví dụ `x ∈ [-4, 4]`, `y ∈ [-2, 10]`: miền rộng 8 cao 12, nên `view: [160, 240]`, mỗi đơn vị là 20. Gốc `O(0,0)` nằm tại `[80, 200]`, điểm `(2, 4)` nằm tại `[120, 120]`. Kiểm nhanh: góc trái dưới `[0, 240]` phải là `(-4, -2)`.

### Thứ tự dựng, mỗi cảnh thêm một lớp

1. **Hai trục** — `line` có `arrow: true`, màu `ink`. Mũi tên Ox hướng phải, Oy hướng lên.
2. **Nhãn trục** — `text` "x", "y" cạnh đầu mũi tên, và "O" tại gốc.
3. **Vạch chia** — chỉ ở những mốc thật sự dùng tới, kèm nhãn số. Đừng vạch mọi đơn vị, khung hẹp sẽ rối.
4. **Đồ thị** — `curve` với các điểm **tính sẵn**. Tám điểm là tối thiểu; bậc hai trở lên nên mười lăm đến bốn mươi, và dày điểm hơn ở chỗ cong gấp. Tính ít điểm thì parabol thành đường gấp khúc.
5. **Giao điểm và điểm đặc biệt** — `dot` kèm `text` ghi toạ độ bên cạnh. Đỉnh parabol, giao với trục, điểm cực trị đều cần toạ độ.
6. **Đường phụ** — tiệm cận và đường gióng dùng `dash: true`, màu `muted`.

### Bảng giá trị để ở đâu

Dùng `items` của một cảnh `type: "list"`, **đừng vẽ `table` chung ô hình với hệ trục**. Chen bảng vào cùng ô thì cả hai đều chật, và hệ trục mất khớp với cảnh trước.

### Biện luận theo tham số

Mỗi trường hợp là một `curve` **mới thêm vào cuối** cùng một hệ trục, màu khác nhau, để người xem so sánh được ngay. Đừng vẽ ba hệ trục riêng cho ba trường hợp — đó là ba hình rời, người xem phải tự ghép trong đầu.

### Màu theo vai trò

- `ink` — trục, nhãn trục, gốc O
- `muted` — vạch chia, tiệm cận, đường gióng
- `a1` — đồ thị chính
- `a2` — giao điểm, nghiệm, kết quả cần tìm
- `a3` — đồ thị của trường hợp thứ hai khi biện luận

### Ba chỗ hỏng đặc trưng

1. Quên trục `y` hướng xuống, đồ thị lộn ngược.
2. `view` không khớp tỉ lệ miền, đồ thị dẹt như đường thẳng hoặc tràn ra ngoài.
3. `curve` quá ít điểm, đường cong thành đường gấp khúc.

## Tiêu chí nhìn

Những câu chỉ trả lời được khi mở ảnh khung hình ra nhìn.

- Đồ thị có đúng dáng của hàm không: parabol quay đúng chiều, đường thẳng đúng độ dốc, tiệm cận đúng phía
- Trục có đủ nhãn, mũi tên và gốc O không
- Giao điểm có chấm và toạ độ ghi kèm không
- Đường cong có mượt không hay đã thành đường gấp khúc

## Tiêu chí kiểm

- [chan] Đồ thị vẽ sai dạng so với hàm số
- [chan] Đồ thị bị lộn ngược theo trục y vì không đổi dấu khi chuyển sang toạ độ hình
- [ghi] Trục thiếu nhãn, thiếu mũi tên hoặc thiếu gốc O
- [ghi] `view` không cùng tỉ lệ với miền cần vẽ nên đồ thị bị dẹt hoặc tràn khung
- [ghi] `curve` có dưới tám điểm nên đường cong thành đường gấp khúc
- [ghi] Mỗi trường hợp biện luận vẽ một hệ trục riêng thay vì chồng lên một hệ trục
- [ghi] Giao điểm hoặc điểm đặc biệt không ghi kèm toạ độ
- [ghi] Vẽ `table` chung ô hình với hệ trục nên cả hai đều chật
