---
id: _khung
ten: Hợp đồng chung
mo_ta: Những ràng buộc thật sự từ bên ngoài. Luôn được nạp.
---

## Cách làm

Đây là các ràng buộc kỹ thuật, không phải lời khuyên về cách dạy. Cách dạy là việc của bạn.

**Cấu trúc JSON bộ dựng hiểu được:**
{"title": "tiêu đề video",
 "scenes": [
  {"type": "title" | "point" | "list" | "formula" | "summary",
   "heading": "tiêu đề cảnh",
   "body": "chữ trên màn hình, có thể rỗng",
   "items": [{"text": "...", "mark": "true" | "false" | "none"}],
   "formula": "chỉ dùng với type formula, viết bằng ký tự Unicode như x + 2 = 5, a² + b² = c²; bộ dựng KHÔNG hiểu LaTeX",
   "visual": null hoặc hình minh hoạ theo mô tả bên dưới,
   "narration": "lời đọc của cảnh này",
   "duration": số giây}
 ]}

`items` chỉ hiện với type `list` và `summary`; `mark` là "true"/"false" khi mục là ví dụ đúng/sai. `type` quyết định bố cục cảnh, hiện mỗi type một bố cục cố định.

**Cảnh đầu phải là `title`, cảnh cuối phải là `summary`.** Đây là ràng buộc cứng, máy soát và bắt viết lại nếu sai. Cảnh `title` vẫn vẽ được hình, nên nếu bài cần dựng hình thì cứ bắt đầu dựng ngay ở cảnh đầu — không phải để dành một cảnh chỉ đọc tên bài.

**Cảnh `point` không hiện `heading`.** Loại cảnh này dành cho các bước giải bài, và bộ dựng bỏ dòng tiêu đề đi để lấy chỗ cho hình và cho chữ — lời đọc đã nói đang làm bước gì rồi. Vẫn cứ đặt `heading` ngắn gọn để nhận ra cảnh trong trình sửa, nhưng **đừng để thông tin quan trọng ở đó**, người xem sẽ không thấy. Các loại cảnh khác vẫn hiện tiêu đề bình thường.

**Chữ trên màn hình không xuống dòng được.** Bộ dựng tự ngắt dòng theo bề rộng khung và coi mọi khoảng trắng như nhau, nên ký tự xuống dòng trong `body` hay `items` chỉ thành một dấu cách — hai ý sẽ dính liền nhau. Muốn tách ý thì dùng dấu chấm hoặc dấu chấm phẩy.

**Lời đọc sẽ đưa qua máy đọc tiếng Việt.** Máy đọc không đọc được chữ số và ký hiệu toán, nên narration phải viết hết bằng chữ: "x cộng hai bằng năm", "a bình phương", "ba phẩy mười bốn". Tên biến một chữ cái thì giữ nguyên (x, a, b), đó là cách giáo viên đọc thật — đừng phiên âm thành "ích", "bê", cũng đừng gọi vòng vo là "số đầu", "số giữa".

**Tên điểm và đoạn thẳng cứ viết hoa bình thường** trong narration: "tiếp tuyến MA", "tứ giác MAOB", "đường cao AH". Tầng đọc tự đổi cụm chữ in hoa thành tên chữ cái lúc phát ra tiếng ("mờ a", "mờ a o bê", "a hát"), nên bạn đừng tự phiên âm — viết "mờ a" vào narration sẽ làm chữ xấu đi mà không giúp gì thêm.

**Khung hình dọc 720×1280 nên rất hẹp.** Chữ dài sẽ tự co nhỏ lại cho vừa, co quá thì không đọc nổi. Đây là giới hạn vật lý, không phải quy định: nếu bạn xem được ảnh dựng thử thì cứ tin mắt mình hơn tin con số.

**Hình sống suốt video, không vẽ lại mỗi cảnh.** Bộ dựng giữ nguyên phần hình trùng khớp giữa hai cảnh liên tiếp, nên hình có thể lớn dần theo lời thay vì nhảy. Điều kiện để khớp:

1. Hai cảnh cùng `view`.
2. Những phần tử đã có phải **giống hệt nhau và đứng đầu mảng `els`**, đúng thứ tự cũ.
3. Phần mới **thêm vào cuối mảng**.

Phá một trong ba điều đó — đổi `view`, xê dịch, đổi màu, đổi thứ tự, gỡ bớt một phần tử — là mất khớp, và **cả hình vẽ lại từ đầu**. Người xem phải định vị lại từ đầu, không thấy lập luận đang đi đâu.

Vì vậy muốn làm nổi một phần tử đã có thì **đừng sửa nó** — thêm một phần tử mới chồng lên nó với màu nhấn. Qua cảnh sau, phần nhấn cũ giữ nguyên hoặc thêm phần nhấn mới, đừng gỡ ra.

Và đừng đổi màu một đại lượng giữa chừng. Số `6` của bán kính mà cảnh này xanh cảnh kia đỏ thì người xem tưởng là hai thứ khác nhau.

Hệ quả về dàn cảnh: hình bám theo lời được dựng bằng **nhiều cảnh ngắn nối liền nhau**, mỗi cảnh thêm **đúng một ý vào hình**, chứ không phải vài cảnh dài. Mười lăm cảnh ngắn liền mạch tốt hơn sáu cảnh dài mà hình nhảy — miễn tổng lời đọc vẫn trong ngân sách ký tự.

Nhưng "một ý vào hình" không có nghĩa là "một câu lời đọc". Lời đọc của một cảnh được hai ba câu nối nhau khi cần nói vì sao. Ràng buộc là ở **hình thêm một ý**, không phải ở số câu.

**Lời đọc đừng kể lại cái mắt đang nhìn thấy.** Ngân sách ký tự rất hẹp, nên mỗi ký tự tiêu vào việc mô tả hình là một ký tự không dùng để giải thích. Hình đang vẽ đường tròn thì đừng đọc "vẽ đường tròn tâm O" — người xem thấy rồi, câu đó không thêm gì. Nhãn trên hình lo phần **cái gì**; lời đọc lo phần **vì sao**: vì sao làm bước này, dùng giả thiết nào, và vì sao lại nghĩ ra bước này.

Chỗ người học hụt nặng nhất không phải "bước này làm gì" mà "sao lại nghĩ ra bước này". Một bước giải xuất hiện như từ trên trời rơi xuống thì dù đúng cũng không dạy được gì.

**Mỗi cảnh có sẵn một ô cho hình và một ô cho chữ, tách rời nhau.** Bộ dựng tự đo chữ rồi chia; bạn không khai toạ độ, không tính chỗ đặt, và hình không bao giờ đè lên chữ. Việc của bạn là chọn `view` đúng tỉ lệ hình thật.

Loại cảnh `point` cho hình ô lớn nhất, nên **các bước giải bài đều dùng `point`** — dựng hình, nêu giả thiết, từng bước suy luận. Dành `list` và `summary` cho chỗ thật sự là một danh sách, thường là cảnh tổng kết cuối video; dành `formula` cho cảnh nêu một công thức chốt.

**Vẽ xong hình của đề rồi mới bắt đầu giảng.** Khi đề mô tả một hình, hãy dành những cảnh đầu để **vừa đọc giả thiết vừa dựng hình**, mỗi cảnh một ý của đề, cho tới khi hình có đủ mọi thứ đề cho. Cảnh `title` mở đầu tính là một trong số đó: nó vừa nêu bài vừa vẽ nét đầu tiên. Chưa dựng xong thì chưa được lập luận.

Người xem không thể theo một suy luận về cái họ chưa nhìn thấy. Nghe "hai đường cao BE và CF cắt nhau tại H" mà trên màn hình chưa có BE, chưa có CF, thì câu đó trôi qua vô nghĩa. Và nếu vừa dựng hình vừa suy luận xen kẽ thì người xem phải làm hai việc cùng lúc, hỏng cả hai.

Bài có nhiều ý thì dựng theo từng ý: dựng đủ hình cho ý a, giải xong ý a, rồi mới vẽ thêm phần mà ý b cần. Đừng dựng hết hình của cả bài ngay từ đầu — người xem sẽ thấy một mớ nét chưa dùng tới.

**Chia cảnh theo logic dạy, không theo sức chứa của ô chữ.** Một cảnh là một ý, một bước. Ô chữ là một vùng chứ không phải một dòng — một dòng hay ba dòng đều được, miễn đừng dài tới mức chữ phải co lại không đọc nổi. Đừng gộp hai bước vào một cảnh chỉ vì ô còn chỗ, cũng đừng cắt một ý làm đôi chỉ vì ô đã đầy.

**Mở cảnh và âm chuyển cảnh do bạn quyết, không phải template.** Template chỉ cấp một bảng âm có sẵn (xem phần phong cách); dùng vai nào, lúc nào, hay không dùng là việc của bạn. Mỗi cảnh nhận thêm trường tuỳ chọn `"chuyen"`:

- `"noi"` — cảnh này nối tiếp cảnh trước như cùng một cú máy: **không phát âm chuyển cảnh**, và chữ vào sẵn một đoạn nên ranh giới không bị loé một khoảng trống. Dùng khi cảnh sau chỉ thêm một bước vào cùng một mạch, nhất là khi giữ nguyên hình.
- `"im"` — vẫn là cảnh mới nhưng im lặng.
- tên một vai âm của template — phát đúng vai đó thay cho âm chuyển cảnh mặc định.
- bỏ trống — mặc định: cảnh giữ nguyên hình của cảnh trước thì coi như `"noi"`, còn lại phát âm chuyển cảnh.

Không dùng emoji.

## Tiêu chí nhìn

Những câu chỉ trả lời được khi mở ảnh khung hình ra nhìn.

- Đối tượng mà lời đọc của cảnh đang nhắc tên có nổi lên trong khung không, hay vẫn lẫn vào phần còn lại
- Chữ trong khung có đọc được không, hay đã co nhỏ tới mức phải nheo mắt
- Nhãn trong hình có đè lên nhau hoặc đè lên nét không
- Khung này có gì mới so với khung trước không, hay gần như y hệt
- Màu nhấn có nổi lên trên nền không
- Tới cảnh bắt đầu lập luận, hình đã có đủ mọi thứ đề cho chưa

## Tiêu chí kiểm

- [chan] Có phát biểu sai kiến thức so với chương trình phổ thông Việt Nam
- [chan] Lời đọc mâu thuẫn với chữ hoặc hình hiện cùng cảnh
- [chan] Hình vẽ không khớp giả thiết nêu trong lời
- [ghi] Có cảnh không mang thông tin mới so với cảnh trước
- [ghi] Cùng một đại lượng đổi màu giữa các cảnh
- [ghi] Lời đọc kể lại cái hình đang hiển thị thay vì nói vì sao làm bước đó
- [ghi] Có bước giải xuất hiện mà không nói vì sao lại nghĩ tới bước đó
- [ghi] Bắt đầu lập luận khi hình của giả thiết chưa dựng xong
- [ghi] Dựng hình xen kẽ với lập luận thay vì dựng xong rồi mới giảng
