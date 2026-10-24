# Xưởng Video Bài Giảng

Xem thêm `HANDOFF.md` (trạng thái, việc chưa làm).

Hệ thống tự động tạo video bài giảng 2D ngắn (khổ dọc 9:16, chữ + hình vẽ) từ một yêu cầu ngắn. Claude viết kịch bản, vẽ hình minh hoạ, trang dựng ra MP4 thật. Người dùng nói tiếng Việt, thích câu trả lời trực tiếp, tối giản, không over-engineering.

## Kiến trúc (6 lớp)
1. Giao diện: `web/studio.html` (một file duy nhất, ~500KB, đã publish làm Artifact: https://claude.ai/artifact/ARTIFACT_ID). Nhập yêu cầu, chọn template/model/giọng/SFX, lưới job, cửa sổ sửa cảnh.
2. Bộ não Claude: capability `sample` của Artifact. `S.sample.json(prompt,{cache:false,modelTier})`. Lời nhắc: `scriptPrompt`, `sceneFixPrompt`, `visualPrompt`, `VIS_SPEC`. Kết quả qua `normScript`/`normScene`/`normVisual` (nơi đặt các giới hạn).
3. Bộ dựng trong trình duyệt: Canvas2D 720x1280 @30fps (`renderFrame`), Three.js r128 cho template geo3d, WebCodecs + mp4-muxer -> MP4, trộn lời đọc + SFX + nhạc (`mixTrack`). Tối đa 5 video song song (`MAX_PARALLEL`).
4. Lưu trữ: capability `db` (collection `jobs`, mỗi video một doc), `assets` (MP4, WebM/Opus giọng đọc), localStorage cho tuỳ chọn riêng. Đồng bộ qua onSnapshot.
5. Giọng đọc: trang đặt `tts.status='requested'` -> `S.mcp.callTool('Claude Code Remote','fire_trigger',...)` -> scheduled task `trig_SCHEDULED_TASK_ID` (prompt trong `tts/trigger_prompt2.txt`, chạy `tts/xv_worker.py` với VieNeu-TTS int8) -> tải audio lên assets, ghi `tts.status='ready'` -> trang tự dựng lại có tiếng. ~2 phút.
6. Thủ công: nút "Gửi Claude dựng bản HQ" chỉ đặt `job.hq.status='requested'`; dựng bằng Remotion/Manim chưa tự động.

## Nguyên tắc nội dung
- Template chỉ là PHONG CÁCH (hình nét, màu, chuyển động, âm thanh). Nội dung và hình minh hoạ do Claude quyết định qua DSL `visual` (line, curve, arc, ellipse, poly, circle, rect, dot, text, table; màu theo vai trò ink/muted/a1/a2/a3). Không thêm hình trang trí riêng của template.
- BỐ CỤC hình cũng do kịch bản quyết: `visual.box = [trái, trên, rộng, cao]` theo tỉ lệ 0..1 của khung 720x1280. Không khai `box` thì template đặt vào chỗ mặc định như trước. Mọi template đều theo vì cùng dồn về `drawVis`; `normVisual` kẹp giá trị sai.
- Người dùng muốn Claude dùng hết khả năng: đừng thu hẹp giới hạn trong `normScene`/`normVisual`/`scriptPrompt` nếu không được yêu cầu. Chữ tự co để vừa khung (`fit`, `listSize`).
- Thời lượng cảnh bị lời đọc chi phối: `dur = max(dur, 0.35 + audio + 0.45)`.

## Template
`TEMPLATES`: minimal (mặc định), kinetic, chalk, geo3d. Mỗi template `{key,name,desc,gl,sfx,music?,bg,scene,chrome}`. SFX nhúng base64 (`SFX_DATA`, `SFX_VERSION`), build bằng `sfx/build_*.py` (Kenney Interface Sounds CC0 + âm tự tổng hợp).

## Chạy thử cục bộ (headless)
`test/` dùng playwright-core. Các script đang trỏ cứng `ROOT='/home/claude/studio'` và đường dẫn chrome: sửa lại cho máy của bạn. Trang cần secure context (WebCodecs): test phục vụ HTML ở https://studio.local qua route của Playwright. `SCRIPT='<json>' node test/shots.mjs` xuất ảnh từng cảnh của 4 template vào `test/out/`.
`npm install` trong `test/` trước (playwright-core). Font Be Vietnam Pro, Patrick Hand, IBM Plex Mono nằm trong `test/fonts`.

## Việc chưa làm / lưu ý
- Gọi `sample` trong trang và hộp xác nhận `mcp` lần đầu chỉ chạy trong app Claude, không test được headless.
- Giọng int8 nhanh hơn fp32 nhưng có thể kém hơn: đổi bằng `XV_PREC=fp32` trong `tts/xv_worker.py`.
- Chưa tự động: dựng HQ bằng Remotion/Manim; máy chủ VieNeu thường trực trên PC để giọng đọc gần như tức thì.
- Sửa artifact: publish lại cùng URL bằng công cụ Artifact (Claude Code cần có công cụ đó); nếu chỉ có file thì sửa `web/studio.html` rồi dán lại vào artifact.
