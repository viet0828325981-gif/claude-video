// Thí nghiệm mù: cùng một đề, cùng model, đổi từng biến một để xem biến nào quyết định chất lượng.
// Chạy: node thi-nghiem.mjs
import fs from 'node:fs';
import path from 'node:path';
import { chayPipeline } from './lib/pipeline.mjs';

const DE = 'Cho tam giác ABC vuông tại A, đường cao AH. Biết AB = 6cm, AC = 8cm. Tính BC, AH, HB và HC.';
const GIAY = 60;
const TRUC = { theloai: 'giai-bai-tap', trinhdo: 'trung-binh', monhoc: 'toan', phongcach: 'minimal', lop: '9' };
const TIER = 'complex'; // Opus cho mọi nhánh, để loại biến nhiễu model
const RA = path.join('data', 'thi-nghiem');

// Mỗi nhánh đổi đúng một thứ so với nhánh A.
const NHANH = [
  { ma: 'A', ten: 'Xưởng hiện tại', opt: {} },
  { ma: 'B', ten: 'Như A, thêm effort max', opt: { effort: 'max' } },
  { ma: 'C', ten: 'Không skill, không lớp kiểm (gần bản gốc)', opt: { boSkill: true, boKiem: true } },
  { ma: 'D', ten: 'Có skill, bỏ lớp kiểm và vòng sửa', opt: { boKiem: true } },
];

const log = (...a) => console.log(new Date().toLocaleTimeString('vi-VN'), ...a);

const soCanh = s => (s && Array.isArray(s.scenes)) ? s.scenes.length : 0;
const soChu = s => soCanh(s) ? s.scenes.reduce((n, x) => n + (x.narration || '').length, 0) : 0;

async function main() {
  fs.mkdirSync(RA, { recursive: true });
  const ketQua = [];
  for (const n of NHANH) {
    log(`=== Nhánh ${n.ma}: ${n.ten}`);
    const t0 = Date.now();
    try {
      const { script, detail } = await chayPipeline({
        request: DE, duration: GIAY, modelTier: TIER, chonTay: TRUC, ...n.opt,
        onStep: s => log('   ', s)
      });
      ketQua.push({ ...n, script, detail });
      log(`   xong ${((Date.now() - t0) / 1000).toFixed(0)}s | ${soCanh(script)} cảnh | ${soChu(script)} ký tự lời đọc | $${detail.usd.toFixed(3)}`);
    } catch (e) {
      log(`   LỖI: ${e.message}`);
      ketQua.push({ ...n, loi: e.message });
    }
  }
  fs.writeFileSync(path.join(RA, 'ket-qua.json'), JSON.stringify({ de: DE, giay: GIAY, truc: TRUC, tier: TIER, ketQua }, null, 1));
  log('--- TỔNG ---');
  let tien = 0;
  for (const k of ketQua) {
    if (k.loi) { log(`${k.ma}: lỗi — ${k.loi}`); continue; }
    tien += k.detail.usd;
    log(`${k.ma}: ${soCanh(k.script)} cảnh, ${soChu(k.script)} ký tự, ${(k.detail.ms / 1000).toFixed(0)}s, $${k.detail.usd.toFixed(3)}, lời nhắc ${k.detail.loi_nhac.length} ký tự, vòng sửa ${k.detail.vong_sua}`);
  }
  log(`Tổng chi phí 4 nhánh: $${tien.toFixed(3)}`);
}
main();
