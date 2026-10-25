// Hai ràng buộc cứng dùng chung cho cả chế độ nhanh lẫn chế độ kỹ.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Ngân sách lời đọc: bộ đọc nới cảnh ra nếu narration dài hơn duration, nên muốn khống chế
// độ dài video thì phải khống chế số ký tự lời đọc, không phải trường duration.
export function nganSach(duration) {
  const canhToiDa = Math.max(3, Math.min(20, Math.round(duration / 6)));
  const canhToiThieu = Math.max(3, canhToiDa - 2);
  // Cùng hằng số với bộ kiểm trong checks.mjs: 17,4 ký tự mỗi giây trên chữ ĐÃ NỞ tên điểm,
  // 1,0 giây lặng mỗi cảnh. Người viết đếm chữ thô, mà tên điểm nở ra dài thêm tới 17% ở bài
  // hình học ("KBC" đọc "ca bê xê"), nên chia 1,15 cho chắc. Trước đây ngân sách dùng 16
  // ký tự thô và 0,8 giây: người viết tuân thủ đủ mà bộ kiểm vẫn phạt, tốn một vòng sửa.
  return { canhToiThieu, canhToiDa, kyTu: Math.floor((duration - 1.0 * canhToiDa) * 17.4 / 1.15) };
}

// VIS_SPEC lấy thẳng từ studio.html để chỉ có một nguồn sự thật về DSL vẽ hình.
let visSpec = null;
export function docVisSpec() {
  if (visSpec) return visSpec;
  const h = fs.readFileSync(path.join(ROOT, 'app/web/studio.html'), 'utf8');
  const m = /const VIS_SPEC=`([\s\S]*?)`;/.exec(h);
  if (!m) throw new Error('Không tìm thấy VIS_SPEC trong studio.html.');
  return (visSpec = m[1]);
}
