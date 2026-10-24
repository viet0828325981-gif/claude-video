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
  return { canhToiThieu, canhToiDa, kyTu: Math.floor((duration - 0.8 * canhToiDa) * 16) };
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
