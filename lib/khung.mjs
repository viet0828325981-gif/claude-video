// Con mắt của agent: dựng từng cảnh ra ảnh PNG thật, đúng bộ dựng mà video sẽ dùng.
// Không mô phỏng, không ước lượng — mở trang đang chạy rồi gọi thẳng renderFrame.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { kiemMay } from './checks.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CHROME = process.env.XV_CHROME || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].find(p => fs.existsSync(p));

let trinhDuyet = null;
async function moTrinhDuyet() {
  if (trinhDuyet && trinhDuyet.isConnected()) return trinhDuyet;
  if (!CHROME) throw new Error('Không tìm thấy Chrome hoặc Edge. Đặt biến XV_CHROME trỏ tới trình duyệt.');
  const { chromium } = await import('playwright-core');
  trinhDuyet = await chromium.launch({ executablePath: CHROME, headless: true });
  return trinhDuyet;
}
export async function dongTrinhDuyet() { if (trinhDuyet) { await trinhDuyet.close().catch(() => {}); trinhDuyet = null; } }

// Vẽ mỗi cảnh ở mốc 92% thời lượng, lúc mọi phần tử đã hiện ra hết.
const TRONG_TRANG = async ({ script, tplKey, thuNho }) => {
  const S = window.__studio;
  const sc = S.normScript(script);
  const tpl = S.TEMPLATES[tplKey] || S.TEMPLATES.minimal;
  const rt = tpl.gl ? S.makeGL() : null;
  const tl = S.timeline(sc), total = S.totalDur(sc);
  const cv = document.createElement('canvas'); cv.width = 720; cv.height = 1280;
  const ctx = cv.getContext('2d');
  // Ảnh giao cho agent thu nhỏ lại: vẫn đọc được chữ mà tốn ít ngữ cảnh hơn hẳn.
  const nho = document.createElement('canvas');
  nho.width = Math.round(720 * thuNho); nho.height = Math.round(1280 * thuNho);
  const nctx = nho.getContext('2d');
  try { await document.fonts.ready; } catch (e) {}
  const ra = [];
  for (let k = 0; k < tl.length; k++) {
    const s = sc.scenes[k];
    const t = tl[k].start + Math.max(0, Math.min((s.duration || 1) - 0.35, (s.duration || 1) * 0.92));
    S.renderFrame(ctx, rt, tpl, sc, tl, total, t); // vẽ hai lần cho chắc font đã nạp
    S.renderFrame(ctx, rt, tpl, sc, tl, total, t);
    nctx.drawImage(cv, 0, 0, nho.width, nho.height);
    ra.push(nho.toDataURL('image/png'));
  }
  return { anh: ra, canh: sc.scenes.map(s => ({ type: s.type, heading: s.heading || '', duration: s.duration })) };
};

export async function dungKhung({ script, template = 'minimal', outDir, thuNho = 0.75, port = process.env.PORT || 8790 }) {
  const b = await moTrinhDuyet();
  const page = await b.newPage({ viewport: { width: 420, height: 860 } });
  try {
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction('window.__studio && window.__studio.TEMPLATES', null, { timeout: 30000 });
    const r = await page.evaluate(TRONG_TRANG, { script, tplKey: template, thuNho });
    fs.mkdirSync(outDir, { recursive: true });
    for (const f of fs.readdirSync(outDir)) if (/^canh-\d+\.png$/.test(f)) fs.rmSync(path.join(outDir, f), { force: true });
    const tep = r.anh.map((d, i) => {
      const ten = `canh-${String(i + 1).padStart(2, '0')}.png`;
      fs.writeFileSync(path.join(outDir, ten), Buffer.from(d.split(',')[1], 'base64'));
      return ten;
    });
    return { tep, canh: r.canh };
  } finally { await page.close().catch(() => {}); }
}

// Lệnh agent gọi: dựng ảnh và in báo cáo lỗi máy bắt được.
export async function chayXem(jobDir) {
  const doc = n => JSON.parse(fs.readFileSync(path.join(jobDir, n), 'utf8'));
  let script, meta;
  try { script = doc('kich-ban.json'); } catch (e) { console.log('CHƯA ĐỌC ĐƯỢC kich-ban.json: ' + e.message); process.exitCode = 1; return; }
  try { meta = doc('meta.json'); } catch (e) { meta = {}; }
  const out = path.join(jobDir, 'khung');
  let r;
  try { r = await dungKhung({ script, template: meta.template || 'minimal', outDir: out }); }
  catch (e) { console.log('KHÔNG DỰNG ĐƯỢC ẢNH: ' + e.message); process.exitCode = 1; return; }
  finally { await dongTrinhDuyet(); }

  console.log(`Đã dựng ${r.tep.length} ảnh vào khung/ — mở từng ảnh ra xem.`);
  r.canh.forEach((c, i) => console.log(`  khung/${r.tep[i]}  [${c.type}] ${c.heading} (${c.duration}s)`));

  const loi = kiemMay(script, { duration: meta.duration });
  console.log(loi.length ? `\nMáy soát được ${loi.length} chỗ:` : '\nMáy không soát thấy lỗi nào. Vẫn phải tự xem ảnh.');
  for (const l of loi) console.log(`  [${l.muc}] ${l.canh ? 'cảnh ' + l.canh : 'cả video'}: ${l.tieu_chi} — ${l.van_de}`);
  console.log('\nMáy chỉ bắt được lỗi đếm được. Chữ xấu, hình khó hiểu, bố cục lệch thì phải nhìn ảnh mới thấy.');
}
