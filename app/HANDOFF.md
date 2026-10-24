# Bàn giao cho Claude Code

Đọc `CLAUDE.md` trước để nắm kiến trúc. File này chỉ ghi những gì cần biết để tiếp tục công việc.

## Trạng thái hiện tại
- Artifact "Xưởng Video Bài Giảng" đã publish bản 9 tại https://claude.ai/artifact/ARTIFACT_ID. `web/studio.html` là đúng bản đó.
- Bản 9 vừa gỡ giới hạn nội dung cho Claude (tối đa 60 cảnh, chữ dài hơn, hình tối đa 300 phần tử, thêm nét curve/arc/ellipse, model mặc định "Mạnh nhất"). Đã test hiển thị ở cả 4 template, chưa test phần gọi Claude trong trang.
- Scheduled task giọng đọc: `trig_SCHEDULED_TASK_ID`, chạy Sonnet.

## Ba điều cần biết
1. Artifact: vẫn nằm ở đường dẫn cũ. Claude Code chỉ sửa và xuất bản lại được nếu phiên đó có công cụ Artifact (publish cùng URL để giữ link). Nếu không, dán lại `web/studio.html` vào artifact.
2. Test: các script trong `test/` trỏ cứng `ROOT='/home/claude/studio'` và đường dẫn Chromium của môi trường cũ. Sửa lại cho máy bạn, chạy `npm install` trong `test/` trước.
3. Giọng đọc: tác vụ đã lên lịch vẫn chạy như cũ, không phụ thuộc nơi bạn làm việc. Muốn đổi cách tạo giọng thì sửa `tts/xv_worker.py` rồi cập nhật lời nhắc của tác vụ (`tts/trigger_prompt2.txt` là bản đang dùng, script nhúng trong đó phải khớp với `xv_worker.py`).

## Chưa làm
- Dựng bản HQ tự động bằng Remotion/Manim (nút "Gửi Claude dựng bản HQ" mới chỉ đánh dấu yêu cầu).
- Máy chủ VieNeu thường trực trên PC để giọng đọc gần như tức thì (hiện ~2 phút mỗi lần vì mỗi lần là một phiên mới).
- Nghe lại giọng int8; nếu kém hơn thì đặt `XV_PREC=fp32` (chậm hơn).
- Chưa kiểm chứng được ngoài app Claude: gọi `sample` trong trang (viết kịch bản, vẽ hình, sửa cảnh) và hộp xác nhận quyền `mcp` lần đầu.
