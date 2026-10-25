// Chế độ "Dựng kỹ": thay một lượt gọi mù bằng một phiên agent có công cụ và có mắt.
// Agent tự viết kịch bản, tự dựng ảnh thử, tự mở ảnh ra xem, tự sửa. Không ai áp quy trình.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { MODELS } from './claude.mjs';
import { kiemMay } from './checks.mjs';
import { pickSkills, TRUC, TRUC_VI } from './skills.mjs';
import { nganSach, docVisSpec } from './hopdong.mjs';
import { dinhDangLoiGiai } from './loigiai.mjs';
import { createHash } from 'node:crypto';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const VIEC = path.join(ROOT, 'data', 'viec');
const CLAUDE_BIN = process.env.CLAUDE_BIN || path.join(ROOT, 'node_modules', '@anthropic-ai', 'claude-code', 'bin', process.platform === 'win32' ? 'claude.exe' : 'claude');

function vietBrief({ jobDir, request, duration, khung, chon, lop, loiGiai }) {
  const ns = nganSach(duration);
  const boi = TRUC.map(t => chon[t] && chon[t].cach_lam ? `### ${TRUC_VI[t]}: ${chon[t].ten}\n${chon[t].cach_lam}` : '').filter(Boolean);
  // Tiêu chí nhìn: gộp của hợp đồng chung và của các trục, đánh số cho agent dễ soát.
  const nhin = [...khung.tieu_chi_nhin, ...TRUC.flatMap(t => (chon[t] && chon[t].tieu_chi_nhin) || [])]
    .map((c, i) => `${i + 1}. ${c}`).join('\n');
  return `# Việc của bạn

Viết kịch bản cho một video bài giảng dọc 9:16 bằng tiếng Việt, rồi **tự xem ảnh dựng thử và sửa cho tới khi ưng**.

## Yêu cầu của giáo viên
"""${request}"""

Người xem: học sinh lớp ${lop}.

## Bối cảnh
Phần dưới là thông tin về người xem và về môn, để bạn khỏi phải hỏi lại. Đây **không phải quy trình bắt buộc** — chia cảnh thế nào, dạy theo hướng nào, vẽ hình gì là bạn quyết.

${boi.join('\n\n')}

${loiGiai&&loiGiai.du_de?`${dinhDangLoiGiai(loiGiai)}

**Lời giải này đã khoá.** Nó được giải hai lần độc lập rồi mới tới tay bạn. Khi xem ảnh và sửa, bạn chỉ được sửa **hình và cách trình bày** — vẽ thêm nét, đổi màu nhấn, chia lại cảnh, viết lại lời đọc cho dễ hiểu. **Không đổi hướng giải, không đổi đáp số, không bỏ bước.** Thấy lời giải sai thì nói ra trong câu trả lời cuối chứ đừng tự ý giải kiểu khác. File \`loi-giai.md\` để đọc, đừng sửa.
`:''}
## Hai ràng buộc cứng

**1. Cấu trúc JSON bộ dựng hiểu được**
${khung.cach_lam}

${docVisSpec()}

**2. Thời lượng không quá ${duration} giây**
Độ dài thật do lời đọc quyết định: máy đọc khoảng 16 ký tự mỗi giây, mỗi cảnh tốn thêm 0,8 giây lặng. Nếu narration dài hơn \`duration\` thì bộ đọc tự nới cảnh ra và video sẽ tràn.
Với ${duration} giây, khoảng ${ns.canhToiThieu} đến ${ns.canhToiDa} cảnh và tổng narration cả video dưới ${ns.kyTu} ký tự là vừa. Thiếu chỗ thì thu hẹp phạm vi bài, đừng nói nhanh và đừng bỏ bước.

## Cách làm việc

Bạn **không chạy lệnh nào cả**. Hệ thống theo dõi file \`kich-ban.json\`: hễ bạn ghi hay sửa nó là nó tự dựng ảnh giúp bạn.

1. Viết \`kich-ban.json\` trong thư mục này.
2. Đợi một chút rồi đọc \`khung/${TEN_BAO_CAO}\`. Nếu còn ghi "ĐANG DỰNG" thì đọc lại file đó lần nữa cho tới khi thấy báo cáo thật (thường chỉ vài giây). Báo cáo liệt kê các ảnh và những lỗi máy đo được.
3. **Mở ẢNH CỦA MỌI CẢNH trong \`khung/\` ra xem bằng công cụ Read** — không bỏ cảnh nào, kể cả cảnh bạn nghĩ là đơn giản. Đây là bước quan trọng nhất.

Bố cục thì bộ dựng đã lo: mỗi cảnh có một ô riêng cho hình và một ô riêng cho chữ, chúng không chồng lên nhau được. Đừng mất vòng nào vào việc đó.

Việc của mắt bạn là thứ khác: **với từng ảnh, đọc lại \`narration\` của đúng cảnh ấy rồi đối chiếu lời với hình.** Lời đang gọi tên đối tượng nào thì trên khung hình đối tượng đó phải nổi lên — đừng để người xem tự dò trong đám nét. Nghe "xét tam giác OBA" mà tam giác ấy vẫn là nét trắng lẫn giữa mọi thứ thì cảnh đó hỏng, dù không máy nào đo ra được.

Soát từng ảnh theo các câu sau:

${nhin}
4. Sửa \`kich-ban.json\`, đợi dựng lại, rồi xem lại những cảnh vừa sửa.
5. Tối đa **ba vòng** xem-sửa.
6. Trả lời một câu ngắn nói bạn đã sửa những gì, và nói thật nếu có cảnh nào chưa kịp xem.

Đừng hỏi lại, cứ làm. Kết quả cuối cùng là file \`kich-ban.json\`.
`;
}

/* Agent không được chạy lệnh. Thay vào đó hệ thống theo dõi kich-ban.json: hễ nó đổi là
   tự dựng lại ảnh và ghi báo cáo. Trước đây agent phải tự gọi `node xem.mjs`, và chỉ cần
   nó gõ lệch một chút ("node ./xem.mjs", "cd ... && node ...") là bị chặn quyền, mất cả vòng lặp. */
const TEN_BAO_CAO = 'BAO-CAO.md';

function vietBaoCao(tep, canh, loi) {
  const d = [`# Đã dựng xong lúc ${new Date().toLocaleTimeString('vi-VN')}`, '',
    `${tep.length} ảnh trong thư mục \`khung/\`. Mở từng cái ra xem bằng công cụ Read:`, ''];
  canh.forEach((c, i) => d.push(`- \`khung/${tep[i]}\` — [${c.type}] ${c.heading} (${c.duration}s)`));
  d.push('', loi.length ? `## Máy soát được ${loi.length} chỗ` : '## Máy không soát thấy lỗi nào');
  for (const l of loi) d.push(`- [${l.muc}] ${l.canh ? 'cảnh ' + l.canh : 'cả video'}: ${l.tieu_chi} — ${l.van_de}`);
  d.push('', 'Máy chỉ đo được cái đếm được. Lời đọc có khớp hình không, hình có dễ hiểu không, đối tượng đang nói tới có nổi lên không — phải nhìn ảnh mới biết.');
  return d.join('\n') + '\n';
}

function batDauTheoDoi(jobDir, meta) {
  const tep = path.join(jobDir, 'kich-ban.json');
  const bao = path.join(jobDir, 'khung', TEN_BAO_CAO);
  let dangChay = false, choLai = false, hen = null;
  const chay = async () => {
    if (dangChay) { choLai = true; return; }
    dangChay = true;
    try {
      fs.writeFileSync(bao, '# ĐANG DỰNG\n\nChờ vài giây rồi đọc lại chính file này.\n');
      const script = JSON.parse(fs.readFileSync(tep, 'utf8'));
      const { dungKhung } = await import('./khung.mjs');
      const r = await dungKhung({ script, template: meta.template || 'minimal', outDir: path.join(jobDir, 'khung') });
      fs.writeFileSync(bao, vietBaoCao(r.tep, r.canh, kiemMay(script, { duration: meta.duration })));
    } catch (e) {
      fs.writeFileSync(bao, `# CHƯA DỰNG ĐƯỢC\n\n${e.message}\n\nSửa lại kich-ban.json rồi ghi lại, hệ thống sẽ tự dựng lại.\n`);
    }
    dangChay = false;
    if (choLai) { choLai = false; chay(); }
  };
  const w = fs.watch(jobDir, (ev, ten) => {
    if (ten !== 'kich-ban.json') return;
    clearTimeout(hen); hen = setTimeout(chay, 600); // đợi agent ghi xong hẳn
  });
  return { dung() { clearTimeout(hen); try { w.close(); } catch (e) {} } };
}

export function chuanBiViec({ jobId, request, duration, axes, lop, template, loiGiai }) {
  const jobDir = path.join(VIEC, jobId);
  fs.mkdirSync(path.join(jobDir, 'khung'), { recursive: true });
  const { khung, chon } = pickSkills(axes);
  fs.writeFileSync(path.join(jobDir, 'yeu-cau.md'), vietBrief({ jobDir, request, duration, khung, chon, lop, loiGiai }));
  // Để riêng một file cho agent đọc lại giữa chừng mà khỏi cuộn hết brief.
  if (loiGiai && loiGiai.du_de) fs.writeFileSync(path.join(jobDir, 'loi-giai.md'), dinhDangLoiGiai(loiGiai));
  fs.writeFileSync(path.join(jobDir, 'meta.json'), JSON.stringify({ template, duration, lop, ...axes }, null, 1));
  return { jobDir, khung, chon };
}

// Agent tự chọn xem cảnh nào và có thể quên dựng lại sau lần sửa cuối.
// Nên không tin, cứ tự dựng lại từ kịch bản cuối: rẻ, tất định, và ảnh luôn khớp kết quả thật.
export async function chayAgent({ jobDir, model, maxTurns = 40, onStep }) {
  let meta = {}; try { meta = JSON.parse(fs.readFileSync(path.join(jobDir, 'meta.json'), 'utf8')); } catch (e) {}
  const theoDoi = batDauTheoDoi(jobDir, meta);
  // Agent có Write và Edit trong thư mục này, nên khoá lời giải phải kiểm chứ không chỉ dặn.
  const bamLoiGiai = () => { try { return createHash('sha1').update(fs.readFileSync(path.join(jobDir, 'loi-giai.md'))).digest('hex'); } catch (e) { return ''; } };
  const bamTruoc = bamLoiGiai();
  let r;
  try { r = await chayPhienAgent({ jobDir, model, maxTurns, onStep }); }
  finally { theoDoi.dung(); }
  r.suaLoiGiai = !!bamTruoc && bamLoiGiai() !== bamTruoc;
  try {
    onStep && onStep('Dựng lại lần cuối để đối chiếu');
    const { dungKhung, dongTrinhDuyet } = await import('./khung.mjs');
    const k = await dungKhung({ script: r.script, template: meta.template || 'minimal', outDir: path.join(jobDir, 'khung') });
    await dongTrinhDuyet();
    r.soAnh = k.tep.length;
    r.dungLai = true;
  } catch (e) { r.dungLai = false; r.loiDungLai = e.message; }
  return r;
}

function chayPhienAgent({ jobDir, model, maxTurns = 40, onStep }) {
  return new Promise((resolve, reject) => {
    const args = ['-p', '--output-format', 'json', '--model', model,
      '--tools', 'Read', 'Write', 'Edit', 'Glob',
      '--allowedTools', 'Read', 'Write', 'Edit', 'Glob',
      '--permission-prompts', 'none',
      '--max-turns', String(maxTurns),
      '--no-session-persistence', '--strict-mcp-config', '--setting-sources', ''];
    const p = spawn(CLAUDE_BIN, args, { cwd: jobDir, windowsHide: true });
    let out = '', errs = '';
    const timer = setTimeout(() => { p.kill(); reject(new Error('Agent chạy quá lâu (quá 25 phút).')); }, 25 * 60000);
    p.stdout.on('data', d => out += d);
    p.stderr.on('data', d => errs += d);
    p.on('error', e => { clearTimeout(timer); reject(e); });
    p.on('close', () => {
      clearTimeout(timer);
      let j; try { j = JSON.parse(out); } catch (e) { return reject(new Error('Agent lỗi: ' + (errs || out).slice(0, 400))); }
      if (j.is_error) return reject(new Error('Agent: ' + String(j.result || 'lỗi').slice(0, 300)));
      const f = path.join(jobDir, 'kich-ban.json');
      if (!fs.existsSync(f)) return reject(new Error('Agent chạy xong nhưng không có kich-ban.json.'));
      let script; try { script = JSON.parse(fs.readFileSync(f, 'utf8')); }
      catch (e) { return reject(new Error('kich-ban.json không phải JSON hợp lệ: ' + e.message)); }
      const anh = fs.existsSync(path.join(jobDir, 'khung')) ? fs.readdirSync(path.join(jobDir, 'khung')).filter(x => x.endsWith('.png')).length : 0;
      resolve({
        script, loiKe: String(j.result || ''),
        usd: j.total_cost_usd || 0, ms: j.duration_ms || 0,
        luot: j.num_turns || (j.usage && j.usage.iterations && j.usage.iterations.length) || 0,
        soAnh: anh,
        tuChoi: (j.permission_denials || []).map(x => typeof x === 'string' ? x : JSON.stringify(x)).slice(0, 10)
      });
    });
    p.stdin.end('Đọc yeu-cau.md rồi làm theo.');
  });
}
