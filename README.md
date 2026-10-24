# Xưởng Video Bài Giảng — bản chạy local

Chạy "Xưởng Video Bài Giảng" (bản Artifact gốc nằm trong `app/web/studio.html`) ngay trên máy, không cần mở claude.ai.

## Lần đầu
1. `cai-dat.bat`: cài Claude Code CLI vào thư mục này và tạo `.venv` cho giọng đọc VieNeu. Mọi cache để trong `.cache\`, không ghi vào ổ C.
2. `dang-nhap-claude.bat`: đăng nhập Claude một lần. Viết kịch bản và vẽ hình sẽ tính vào hạn mức tài khoản Claude của bạn.

## Mỗi lần dùng
`chay.bat` mở http://localhost:8790. Đóng cửa sổ đen để tắt.

Hãy dùng Chrome hoặc Edge (cần WebCodecs để xuất MP4).

## Cách bản local thay cho Artifact
| Trên claude.ai | Bản local (`server.mjs` + `local-shim.js`) |
|---|---|
| `sample` (Claude viết kịch bản, vẽ hình, sửa cảnh) | `claude -p` (Claude Code CLI). Model Nhanh/Mặc định/Mạnh nhất tương ứng haiku/sonnet/opus |
| `db` (collection `jobs`) | `data\jobs\<id>.json`, đồng bộ trang qua SSE |
| `assets` (MP4, giọng đọc) | `data\assets\` |
| `mcp` + scheduled task tạo giọng (~2 phút) | `app\tts\xv_daemon.py` chạy thường trực: nạp mô hình một lần (~10 giây), sau đó vài giây mỗi video |
| `downloads` | Tải file thẳng qua trình duyệt |

Mô hình VieNeu (~300MB) nằm ở `.cache\hf`. Muốn giọng fp32 (chậm hơn) thì đặt biến môi trường `XV_PREC=fp32` trước khi chạy `chay.bat`.

## Nhập yêu cầu và hàng đợi

Ô nhập là **một video**, không phải mỗi dòng một video. Dán cả đề bài nhiều dòng, có công thức, có xuống dòng đều được.

Muốn nhiều video thì bấm **Thêm vào hàng đợi**. Hàng đợi chạy **lần lượt**, không song song, vì mỗi video giờ tốn 3 đến 5 lượt gọi Claude. Mỗi mục nhớ đúng thời lượng và bốn trục lúc bạn xếp hàng, nên đổi ô chọn sau đó không ảnh hưởng những mục đang chờ. Hàng đợi được lưu lại, tải lại trang vẫn còn và có nút "Chạy tiếp".

## Triết lý

Lõi của hệ thống là **agent Claude**. Trục, thông số và tiêu chí tồn tại để **giảm việc gõ lại** và **kiểm soát chất lượng** — không phải để ép model đi theo một quy trình.

Hệ quả cụ thể trong mã:

- Skill trong `skills/` mô tả **bối cảnh** (người xem là ai, môn này có quy ước gì), không quy định cấu trúc cảnh hay cách dạy.
- Tiêu chí chia ba mức, và chỉ hai mức đầu được phép ép viết lại: `chan` là sai thật (sai toán, đáp số lệch, hình mâu thuẫn lời), `sua` chỉ dành cho lỗi kỹ thuật **máy đo được** (chữ tràn, LaTeX lọt vào, video quá thời lượng). Mọi nhận xét về cách dạy đều là `ghi` — báo cho bạn biết, không bao giờ tự sửa.
- Ràng buộc cứng chỉ còn hai: cấu trúc JSON bộ dựng hiểu được, và thời lượng bạn chọn.

## Hai cách dựng

Ô **Cách dựng** cạnh các ô trục:

- **Nhanh · một lượt** — gọi Claude một lượt như cũ. Khoảng 1–2 phút, rẻ.
- **Kỹ · agent tự xem lại** — mở một phiên agent thật trong `data/viec/<id>/`. Agent viết `kich-ban.json`, chạy `node xem.mjs` để dựng **từng cảnh thành ảnh PNG thật** bằng đúng bộ dựng của video, rồi **mở ảnh ra nhìn** và tự sửa, tối đa ba vòng. Khoảng 2–4 phút, đắt hơn.

**Agent không được chạy lệnh nào.** Công cụ của nó chỉ có Read, Write, Edit, Glob, và nó bị nhốt trong thư mục job của mình. Thay vì bắt nó tự gọi bộ dựng, hệ thống **theo dõi `kich-ban.json`**: hễ file đổi là tự dựng lại ảnh và ghi `khung/BAO-CAO.md` (danh sách ảnh cộng lỗi máy đo được). Agent chỉ việc ghi file rồi đọc báo cáo và xem ảnh.

Lối cũ cho phép đúng một lệnh `node xem.mjs` rất giòn: chỉ cần agent gõ `node ./xem.mjs` hay thêm `cd` phía trước là mẫu cho phép trượt, lệnh bị từ chối, và **mất cả vòng lặp mà không ai biết**. Bỏ hẳn Bash vừa an toàn hơn vừa không còn hỏng được.

Sau khi phiên agent kết thúc, hệ thống **luôn dựng lại một lần nữa** từ kịch bản cuối, không tin agent đã tự làm.

Con mắt nằm ở `lib/khung.mjs`: mở trang đang chạy bằng playwright rồi gọi thẳng `renderFrame`, nên ảnh agent nhìn thấy đúng bằng khung hình video sẽ xuất ra.

## Bố cục do kịch bản quyết, không do template

Trước đây `type` của cảnh quyết định cứng chỗ đặt và kích thước hình, nên mười video trông như một. Giờ `visual` nhận thêm trường **`box`** tuỳ chọn:

```json
"visual": { "view": [180, 156], "box": [0.05, 0.14, 0.9, 0.78], "els": [...] }
```

`box` là `[trái, trên, rộng, cao]` theo tỉ lệ 0..1 của khung 720×1280 — kịch bản tự nói hình nằm đâu và to bằng nào. Bỏ `box` thì template đặt vào chỗ mặc định như cũ, nên các kịch bản cũ không bị ảnh hưởng.

Giá trị sai bị kẹp lại trong `normVisual` nên hình không bao giờ vẽ ra ngoài khung. Cả bốn template đều theo, vì mọi đường vẽ hình đều dồn về một hàm `drawVis`.

Chữ của cảnh vẫn vẽ ở chỗ cũ, nên đặt `box` đè lên chữ thì phải rút ngắn chữ. Ở chế độ **Dựng kỹ**, agent nhìn ảnh nên tự thấy và tự xử lý.

## Hình tồn tại suốt video

Trước đây mỗi cảnh vẽ lại hình từ đầu, người xem phải định vị lại mỗi lần. Giờ bộ dựng **giữ nguyên phần hình trùng khớp giữa hai cảnh liên tiếp**: cảnh sau lặp lại y hệt những phần tử đầu của cảnh trước (cùng `view`, cùng `box`, cùng thứ tự) thì phần đó đã nằm sẵn trên màn hình, chỉ phần tử mới mới chạy hoạt ảnh.

Kịch bản không cần khai thêm cú pháp nào — chỉ cần lặp lại đúng phần tử và thêm cái mới vào cuối mảng `els`. Muốn tô đậm một đoạn đã có thì thêm một phần tử mới trùng lên nó với màu nhấn, đừng sửa phần tử cũ.

Chạy thử một bài chứng minh hình học: hình lớn dần 11 → 15 → 15 → 16 → 22 → 26 → 27 → 28 phần tử qua các cảnh, không cảnh nào vẽ lại.

## Dựng lại rẻ

Kịch bản lưu có cấu trúc trong `data/jobs/<id>.json`, nên ba việc sau **không tốn lượt gọi Claude nào**:

- **Đổi template rồi dựng lại** — chọn template khác trên thẻ video rồi bấm "Dựng lại". Kịch bản giữ nguyên.
- **Sửa một cảnh** — nút "Sửa cảnh" chỉ gửi đúng cảnh đó cho Claude, không gửi cả kịch bản.
- **Đọc lại giọng** — giọng cất theo từng cảnh trong `data/giong-cache/`, khoá là giọng cộng lời đọc.

Nhờ kho giọng, sửa lời một cảnh chỉ phải đọc lại cảnh đó:

```
đọc mới 15 cảnh, lấy lại  0 cảnh, mất 27s   ← lần đầu
đọc mới  0 cảnh, lấy lại 15 cảnh, mất  0s   ← đọc lại y nguyên
đọc mới  1 cảnh, lấy lại 14 cảnh, mất  1s   ← sửa một cảnh
```

Kho cất bằng int16, khoảng 5MB cho một video một phút rưỡi. Xoá `data/giong-cache/` lúc nào cũng được, chỉ mất tốc độ chứ không mất dữ liệu.

Lưu ý: khi lời đọc dài ra, bộ đọc nới `duration` của cảnh và ghi lại vào kịch bản. Rút lời đọc ngắn lại thì `duration` **không tự co**, phải tự đặt nhỏ rồi để bộ đọc nới đúng bằng lời.

## Năm trục và lớp kiểm

Khi bạn gõ một yêu cầu, server không gửi thẳng cho Claude nữa mà chạy qua `lib/pipeline.mjs`:

1. **Chọn trục** — Claude đọc yêu cầu và chọn thể loại, môn học, **dạng bài**, trình độ, phong cách, lớp mấy. Trục dạng bài (`skills/dangbai/`) tả tính chất riêng của từng dạng: hình học phẳng và hàm số cần một hình sống suốt video, còn đại số thì sợi chỉ là dòng biến đổi chứ không phải hình.
2. **Ghép skill** — mỗi trục góp một mảnh hướng dẫn từ `skills/`, cộng dồn chứ không phải ma trận. Mâu thuẫn thì theo thứ tự ưu tiên ghi trong pipeline: hợp đồng chung thắng tất cả, ngôn ngữ theo trình độ, cấu trúc theo thể loại, ký hiệu theo môn học.
3. **Viết kịch bản.**
4. **Kiểm** — tầng máy (`lib/checks.mjs`, chạy luôn, không tốn gì) rồi tầng Claude. Với bài tập, Claude giải lại độc lập chỉ từ đề để đối chiếu đáp số, không nhìn lời giải có sẵn.
5. **Sửa một vòng** rồi kiểm lại bằng máy. Tối đa một vòng, không lặp.

Mỗi lỗi có một trong ba mức: **chặn** (sai nội dung), **sửa** (đúng nhưng trình bày hỏng), **ghi nhận**. Không có thang điểm.

Bấm **Chi tiết** trên thẻ video để xem toàn bộ: trục đã chọn và lý do, skill đã ghép, lời nhắc đầy đủ, kết quả kiểm trước và sau khi sửa, lời giải độc lập, và chi phí từng lượt gọi.

## Sửa và thêm skill

Mỗi skill là một file markdown trong `skills/<trục>/`, khai báo hai phần: `## Cách làm` và `## Tiêu chí kiểm`. Tiêu chí viết dạng `- [chan|sua|ghi] nội dung`. Sửa file là có hiệu lực ngay, không cần khởi động lại server.

Thêm một phong cách hoặc môn học mới chỉ là thêm một file. Riêng phong cách cần `template:` trỏ tới một template có sẵn trong `studio.html`.

## Thư mục
- `app\`: mã gốc từ file zip (web, tts, sfx, test)
- `skills\`: bốn trục, mỗi skill một file
- `lib\`: pipeline, lớp kiểm, bộ nạp skill, lớp gọi Claude
- `data\`: video, giọng đọc, job và chi tiết pipeline. Muốn sao lưu thì chép thư mục này.
- `server.mjs`, `local-shim.js`, `local-ui.js`: lớp chạy local

## Chưa làm

- Chưa có type cảnh riêng cho bước giải; một bước đang mượn type `formula` hoặc `point`. Thêm type mới sẽ phải sửa `renderFrame` trong `studio.html`.
- Phong cách cắt giấy và hoạt hình nhân vật chưa có. DSL vẽ hình hiện không có trục thời gian nên hoạt hình cần viết lại bộ dựng.
- Chưa có bộ bài kiểm cố định để đo xem sửa skill là tốt lên hay xấu đi.
