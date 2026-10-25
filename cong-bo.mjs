// Nạp 5 kịch bản vào trang dưới tên "Nhánh 1..5" theo thứ tự xáo ngẫu nhiên.
// Đáp án nhánh nào là nhánh nào nằm trong data/thi-nghiem/dap-an.json, KHÔNG hiện trên giao diện.
// Chạy khi server đang bật: node cong-bo.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const RA = path.join('data', 'thi-nghiem');
const CONG = process.env.PORT || 8790;
const VOICE = 'Ngọc Huyền';

const kq = JSON.parse(fs.readFileSync(path.join(RA, 'ket-qua.json'), 'utf8'));
const E = JSON.parse(fs.readFileSync(path.join(RA, 'E.json'), 'utf8'));

const nhanh = kq.ketQua.filter(k => !k.loi).map(k => ({ ma: k.ma, ten: k.ten, script: k.script, detail: k.detail }))
  .concat([{ ma: 'E', ten: 'Claude viết trong chat', script: E, detail: null }]);

// Xáo thứ tự để người chấm không đoán được
for (let i = nhanh.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [nhanh[i], nhanh[j]] = [nhanh[j], nhanh[i]]; }

const now = Date.now();
const key = [];
const api = (p, body, method = 'PUT') => fetch(`http://127.0.0.1:${CONG}${p}`, {
  method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body)
}).then(r => r.ok ? r.json() : r.text().then(t => { throw new Error(t); }));

const main = async () => {
  // Dọn các job thí nghiệm cũ để nạp lại từ đầu
  for (const f of fs.readdirSync(path.join('data', 'jobs'))) {
    if (!f.startsWith('tn') || !f.endsWith('.json')) continue;
    await api(`/api/db/jobs/${f.slice(0, -5)}?client=thinghiem`, undefined, 'DELETE').catch(() => {});
  }
  for (let i = 0; i < nhanh.length; i++) {
    const n = nhanh[i], so = i + 1;
    const id = 'tn' + crypto.randomBytes(6).toString('hex');
    const job = {
      id, prompt: kq.de, title: `Nhánh ${so}`, template: 'minimal', duration: kq.giay,
      status: 'ready', script: n.script, assetId: '', error: '',
      createdAt: now + so, updatedAt: now + so, hq: null, voice: VOICE, tts: null, sfx: true
    };
    await api(`/api/db/jobs/${id}`, { data: job, client: 'thinghiem' });
    const chu = n.script.scenes.reduce((s, x) => s + (x.narration || '').length, 0);
    // KHÔNG in mã nhánh: kết quả lệnh có thể hiện ra cho người chấm, làm hỏng tính mù.
    console.log(`Nhánh ${so}: ${n.script.scenes.length} cảnh, ${chu} ký tự lời đọc`);
    key.push({ hienThi: `Nhánh ${so}`, jobId: id, ma: n.ma, ten: n.ten, canh: n.script.scenes.length, kyTu: chu, detail: n.detail });
  }
  fs.writeFileSync(path.join(RA, 'dap-an.json'), JSON.stringify({ de: kq.de, giay: kq.giay, key }, null, 1));
  console.log('\nĐáp án đã cất vào data/thi-nghiem/dap-an.json. Mở trang để xem và chấm.');
};
main().catch(e => { console.error('Lỗi:', e.message); process.exit(1); });
