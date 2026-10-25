# Kế hoạch nâng cấp trục dạng bài

Mục tiêu: biến `skills/dangbai/` từ bốn file lệch nhau thành trục mạnh nhất của xưởng, và
**đo được** là nó mạnh hơn thật chứ không phải cảm giác.

---

## Phần 1 — Chẩn đoán

Năm điều đọc được từ mã, không phải phỏng đoán.

### 1.1 Lệch cấp độ năm lần

| file | cỡ | trạng thái |
|---|---|---|
| `hinh-hoc-phang.md` | 5762 B | đã iterate, có quy tắc vận hành cụ thể |
| `ham-so-do-thi.md` | 1314 B | đúng hướng, thiếu chi tiết thao tác |
| `dai-so-bien-doi.md` | 1130 B | mới nêu nguyên tắc |
| `khac.md` | 684 B | một đoạn chung chung |

Chỉ một trong bốn file thật sự làm việc của trục dạng bài. Ba file còn lại *nhắc tới* cơ chế
hình liên tục mà không nói cách làm.

### 1.2 Tiêu chí dạng bài hiện không đổi được một video nào

Đây là phát hiện quan trọng nhất.

`lib/pipeline.mjs:140`:

```js
const nang = l => l.filter(x => x.muc === 'chan' || (x.muc === 'sua' && x.tang === 'may'));
```

Chỉ `chan`, hoặc `sua` **do tầng máy** sinh ra, mới được ép viết lại. Nhưng `kiemClaude`
luôn gán `tang: 'claude'`. Hệ quả:

- `[ghi]` — chỉ báo cáo, đúng như thiết kế.
- `[sua]` viết trong file skill — **bị lọc bỏ hoàn toàn**. Không có tác dụng gì. (Đúng là
  hiện cả 18 file skill không dùng `[sua]` lần nào — 58 tiêu chí, 0 cái `sua`.)
- `[chan]` — có lực.

Trong `skills/dangbai/` có **3 `[chan]` và 14 `[ghi]`**. Nghĩa là 14/17 tiêu chí của trục
quyết định chất lượng hình chỉ để người đọc xem ở tab "Chi tiết", không bao giờ vào vòng sửa.

**Suy ra:** muốn tiêu chí dạng bài có lực mà không phá triết lý "không ép theo ý kiến", thì
phải đẩy những tiêu chí **máy đo được** xuống `lib/checks.mjs`. Viết thêm markdown không
đủ — nó chỉ tác động qua lời nhắc, không qua vòng sửa.

### 1.3 Cơ chế hình liên tục bị chép bốn lần, mỗi lần nhạt hơn

Quy tắc "cùng `view` cùng `box`, tiền tố `els` giống hệt, thêm vào cuối, `chuyen:"noi"`,
nhấn bằng phần tử chồng lên chứ không sửa phần tử cũ" là **sự thật về bộ dựng**, không phải
đặc thù của hình học phẳng. Hiện nó nằm đủ trong `hinh-hoc-phang`, rút gọn trong
`ham-so-do-thi`, một câu trong `khac`, và vắng mặt trong `dai-so-bien-doi`.

Mỗi dạng bài mới sẽ phải tự chép lại cơ chế này, và sẽ chép tệ hơn.

### 1.4 Một lỗ hổng chéo và một fallback sai

- `skills/phongcach/geo3d.md` tồn tại (template 3D) nhưng **không có dạng bài hình học không
  gian**. Video 3D đang bị hướng dẫn bằng file yếu nhất.
- `lib/skills.mjs:59`: `chon[t] = list.find(...) || list[0]`. `list` sắp theo thứ tự chữ cái,
  nên `list[0]` của trục dạng bài là **`dai-so-bien-doi`**. Router trả về một id lạ thì bài
  hình học được hướng dẫn bằng đại số, âm thầm. Fallback đúng phải là `khac`.

### 1.5 `thi-nghiem.mjs` đang đo sai thứ

Nó so bốn nhánh trên **một** đề và in: số cảnh, số ký tự, giây, tiền. Không chỉ số nào nói
video **hay hơn**. Không dựng ảnh. README đã tự ghi nhận:

> Chưa có bộ bài kiểm cố định để đo xem sửa skill là tốt lên hay xấu đi.

Kế hoạch này lấp đúng chỗ đó trước, rồi mới sửa skill.

---

## Phần 2 — Thứ tự làm

Hạ tầng đo đi trước. Không có nó thì mọi nâng cấp đều là cảm tính, và sửa skill là đi trong tối.

### Giai đoạn 0 — Hạ tầng đo (không tốn lượt Claude để viết)

**0.1 `lib/lientuc.mjs` — đo liên tục hình bằng máy**

Tính thẳng từ kịch bản, không cần render:

| chỉ số | nghĩa |
|---|---|
| `tiLeNoi` | tỉ lệ cặp cảnh liên tiếp (cả hai có hình) giữ được tiền tố `els` |
| `tangDan` | `els.length` có đơn điệu tăng qua chuỗi không |
| `themMoiMoiCanh` | số phần tử thêm mới mỗi cảnh — trung vị và lớn nhất |
| `phaTienTo` | tiền tố bị đổi thứ tự, đổi `c`, hoặc đổi `fill` |
| `doiKhung` | số lần `view` hoặc `box` đổi giữa hai cảnh có hình |
| `vungTrong` | dải trống dọc giữa đáy chữ và đỉnh `box` |

`tiLeNoi` là chỉ số cốt lõi: nó đo chính xác khác biệt giữa "một video" và "một tập ảnh rời".

**0.2 Nối vào `lib/checks.mjs`**

Chỉ đẩy lên `[sua]` những gì máy **chắc chắn** đúng, vì `sua` + `tang:'may'` là ép viết lại:

- `[sua]` — `view` hoặc `box` đổi giữa các cảnh có hình (đo cứng, không tranh luận được)
- `[sua]` — tiền tố bị đổi thứ tự hoặc đổi màu (so sánh deep-equal, cũng cứng)
- `[ghi]` — một cảnh thêm quá nhiều phần tử; dải trống lớn

Đây là bước biến tiêu chí dạng bài từ ý kiến thành lực. Ba tiêu chí `[ghi]` quan trọng nhất
của `hinh-hoc-phang` trở thành `[sua]` đo được, nên vòng sửa thật sự chạy vì chúng.

**0.3 `danh-gia.mjs` — bộ kiểm cố định**

- `bo-de/*.json`: mỗi đề `{id, de, giay, truc, dap_so?}`. Ba đề mỗi dạng.
- Chạy ma trận **đề × nhánh**, các nhánh chỉ khác nhau **đúng một id dạng bài**.
  Ghim cả năm trục bằng `chonTay` để router không chạy — loại hẳn biến nhiễu định tuyến.
- Sau mỗi lần sinh, gọi `dungKhung` trong `lib/khung.mjs` để ra **ảnh thật** (cần
  `server.mjs` đang chạy), rồi ghi:
  chỉ số 0.1, đếm `chan`/`sua`/`ghi`, thời lượng thật so với thời lượng đặt, khớp `dap_so`
  khai trong đề, số giây, tiền.
- Kết quả vào `data/danh-gia/<mốc>/` kèm `bang.md` so sánh.

`dap_so` khai sẵn trong bộ đề là chỉ số đúng/sai **cứng** duy nhất — không nhờ Claude tự
xác nhận mình.

**0.4 `trong-tai.mjs` — trọng tài mù theo cặp**

- Lấy dải ảnh của hai nhánh cho cùng đề, **bỏ nhãn**, hỏi một lượt Claude riêng: video nào
  dạy tốt hơn cho học sinh lớp N, và vì sao — buộc trích cảnh cụ thể làm chứng.
- Chạy hai lần, **đảo thứ tự**. Chỉ tính là thắng khi cả hai lần cùng kết luận. Triệt bias
  vị trí, vốn là bệnh nặng nhất của trọng tài LLM.
- Báo cáo thắng / hoà / thua trên cả bộ đề. **Không chấm thang điểm** — giữ đúng triết lý
  "không có thang điểm" của xưởng; so cặp là đủ để quyết giữ hay bỏ.

### Giai đoạn 1 — Rút cơ chế dùng chung ra khỏi dạng bài

- Thêm mục "Hình sống suốt video" vào `skills/_khung.md`: bốn quy tắc tiền tố, `chuyen:"noi"`,
  nhấn bằng phần tử chồng lên, "đừng sửa phần tử cũ". Đặt ở `_khung.md` vì nó là ràng buộc
  của bộ dựng, và `_khung.md` luôn được nạp cho mọi video.
- Xoá phần trùng khỏi bốn file dạng bài. Mỗi file chỉ còn hai việc: **sợi chỉ của dạng này là
  gì**, và **dạng này hỏng ở đâu**.
- Đo trước/sau bằng 0.3. Giả thuyết kiểm chứng được: `tiLeNoi` của ba dạng yếu tăng rõ, còn
  `hinh-hoc-phang` không tụt.

Giai đoạn này rẻ, và nó là phép thử xem hạ tầng đo có nói được điều gì hay không.

### Giai đoạn 2 — Nâng ba file yếu lên cùng cấp

Viết theo một bộ xương cố định, để sau này thêm dạng chỉ là điền chỗ trống:

1. Sợi chỉ của dạng này là gì — một câu, chỉ rõ đối tượng
2. Sợi chỉ mọc thế nào theo lời — thứ tự cụ thể
3. Vai màu của dạng này
4. `view` và `box` nên thế nào
5. Ba chỗ hỏng đặc trưng
6. Tiêu chí kiểm, ưu tiên cái máy đo được

Cụ thể:

- **`dai-so-bien-doi`** — đảo luận điểm hiện tại. File đang nói "hình không bắt buộc"; thật
  ra sợi chỉ của dạng này **cũng là một hình**: cột biến đổi. Mỗi cảnh thêm một dòng `text`
  vào cuối `els`, dòng cũ giữ nguyên màu (đổi màu là phá tiền tố), phép vừa dùng ghi bên phải
  bằng `muted`, `line` mũi tên nối hai dòng, chỗ vừa đổi nhấn bằng `rect` fill `soft` chồng
  lên. Cơ chế tiền tố dùng được nguyên vẹn cho đại số — hiện không file nào nói thế.
- **`ham-so-do-thi`** — chốt thứ tự dựng: trục → nhãn và mũi tên → bảng giá trị → `curve` →
  giao điểm kèm toạ độ → đường tham số. Mỗi trường hợp biện luận một màu, chồng cùng hệ trục.
  Nói rõ cách chọn `view` theo miền thật của hàm, và tính 8–40 điểm trước khi đưa vào `curve`.
- **`khac`** — biến thành thủ tục bốn câu hỏi để tự tìm sợi chỉ, kèm bảng ánh xạ ví dụ:
  dãy số → bảng; xác suất → cây trường hợp; hoá → sơ đồ mol; lý → hình lực.

### Giai đoạn 3 — Thêm dạng còn thiếu

Thêm **ba đề vào bộ kiểm trước**, rồi mới viết file, rồi đo. Thứ tự theo lợi ích:

| ưu tiên | dạng | lý do |
|---|---|---|
| 1 | `hinh-hoc-khong-gian` | lấp lỗ hổng chéo với `phongcach/geo3d` |
| 1 | `bai-toan-loi-van` | sợi chỉ là **bảng đại lượng**, không phải hình — khác hẳn bốn dạng hiện có |
| 2 | `luong-giac` | hay gặp, có đường tròn đơn vị làm sợi chỉ rõ ràng |
| 2 | `thong-ke-xac-suat` | `table` và `rect` đã đủ để dựng bảng và cột |
| 3 | `ly-co-hoc` | hình lực; DSL không có vector riêng, dùng `line` + `arrow` |
| 3 | `hoa-tinh-theo-pthh` | sơ đồ mol |

Ưu tiên 3 chỉ làm nếu thực sự dạy Lý và Hoá.

Kèm theo: sửa fallback `lib/skills.mjs:59` về `khac` — một dòng.

### Giai đoạn 4 — Chốt mốc và chống thụt lùi

- Lưu `data/danh-gia/moc-chuan.json`. Mỗi lần sửa skill về sau chạy lại và so với mốc.
- Quy tắc nhận một thay đổi, cả ba phải đạt:
  1. không tăng số lỗi `chan`
  2. `tiLeNoi` không giảm
  3. trọng tài mù không thua

---

## Phần 3 — Cách A/B mà không sửa code

Đặt bản mới thành id riêng (`hinh-hoc-phang-v2`) nằm cạnh bản cũ, rồi **ghim
`chonTay.dangbai`** khi đánh giá. Thắng thì đổi tên đè bản cũ, thua thì xoá.

Lưu ý: trong lúc A/B, `catalogue()` sẽ thấy cả hai id nên người dùng thật có thể bị router
chọn bản đang thử. Vì vậy làm A/B trong một **nhánh git riêng**, không phải trên nhánh đang dùng.

---

## Phần 4 — Chi phí ước lượng

Số ước lượng, không phải số đo.

| việc | lượt | ước tiền |
|---|---|---|
| Viết hạ tầng giai đoạn 0 | 0 | 0 |
| Một lần chạy bộ kiểm 12 đề × 2 nhánh, Opus | ~24 pipeline, mỗi cái 3–5 lượt | 15–40 $ |
| Trọng tài mù 12 đề × 2 lần | 24 lượt có ảnh | 3–8 $ |

Cách rẻ hơn: chạy bộ kiểm bằng **sonnet** để bắt lỗi cơ chế (tiền tố, khung, thời lượng — đều
là chỉ số máy, không phụ thuộc model mạnh), chỉ dùng **opus** cho vòng chốt cuối.
