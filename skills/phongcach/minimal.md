---
id: minimal
ten: Tối giản
template: minimal
mo_ta: Nét trắng mảnh trên nền đen, vẽ dần. Mặc định, hợp mọi môn.
---

## Cách làm

Nét mảnh, nền đen, hình vẽ hiện dần theo thứ tự phần tử trong `els` — nên thứ tự mảng chính là thứ tự kể chuyện.

Nét mảnh không hợp với vùng tô lớn. Khoảng trống ở phong cách này là cố ý, không phải chỗ cần lấp.

Màu khai báo theo vai trò: `ink` phần chính, `muted` phần phụ, `a1` `a2` `a3` khi cần phân biệt. Màu thật do template quyết định.

**Bảng âm template này cấp** (dùng cho `"chuyen"` của cảnh): `scene` tiếng trầm gõ, `click` tiếng bấm, `draw` tiếng vẽ, `chime` tiếng chuông, `item` tiếng gõ nhẹ, `true` chuông đúng, `false` trầm sai, `formula` tiếng vẽ, `visual` tiếng vẽ, `intro` tiếng trầm mở đầu. Có nhạc nền ambient chạy suốt video.

Nền đen tĩnh và nhạc ambient liền mạch, nên phong cách này chịu được chuỗi cảnh `"noi"` dài mà không thấy rời rạc.

## Tiêu chí kiểm

- [ghi] Một cảnh dùng quá ba màu nhấn khác nhau
