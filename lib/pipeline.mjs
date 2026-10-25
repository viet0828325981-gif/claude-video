// Đường đi của một kịch bản: chọn trục -> ghép skill -> viết -> kiểm -> sửa một vòng.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { askJson, MODELS } from './claude.mjs';
import { pickSkills, catalogue, TRUC, TRUC_VI } from './skills.mjs';
import { kiemMay } from './checks.mjs';
import { nganSach, docVisSpec } from './hopdong.mjs';
import { chuanBiViec, chayAgent } from './agent.mjs';
import { layLoiGiai, tuLoiGiaiGoc, dinhDangLoiGiai, kiemGiuDapSo } from './loigiai.mjs';
export { nganSach, docVisSpec };

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DETAILS = path.join(ROOT, 'data', 'details');

// Phiên bản mã tạo ra lần chạy này. Thiếu nó thì so số liệu giữa các lần chạy rất dễ gộp
// nhầm kết quả của hai phiên bản khác nhau, rồi kết luận như thể cùng một hệ thống.
// Đọc một lần lúc nạp module; server phải khởi động lại mới thấy commit mới.
function docPhienBan() {
  const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  try {
    const commit = git('rev-parse', '--short', 'HEAD');
    const nhanh = git('rev-parse', '--abbrev-ref', 'HEAD');
    // Có file đang sửa dở thì kết quả không ứng đúng với commit nào cả, phải nói ra.
    const sua = git('status', '--porcelain', '--', 'lib', 'skills', 'app/web/studio.html').length > 0;
    return { commit, nhanh, suaDo: sua, nhan: commit + (sua ? '+sửa dở' : '') };
  } catch (e) { return { commit: '', nhanh: '', suaDo: false, nhan: 'không rõ' }; }
}
const PHIEN_BAN = docPhienBan();
const MAX_LOI = 25;

const getVisSpec = docVisSpec;

const UU_TIEN = `Phần bối cảnh ở trên là thông tin để bạn quyết định, không phải quy trình bắt buộc. Cách dạy là việc của bạn.
Chỉ hai thứ là ràng buộc cứng: cấu trúc JSON mà bộ dựng hiểu, và giới hạn thời lượng. Không đủ chỗ thì thu hẹp phạm vi bài chứ đừng nói nhanh hay bỏ bước.`;

function ghepLoiNhac({ request, duration, khung, chon, lop, boSkill, loiGiai }) {
  const phan = [];
  if (!boSkill) for (const t of TRUC) { const s = chon[t]; if (s && s.cach_lam) phan.push(`### ${TRUC_VI[t]}: ${s.ten}\n${s.cach_lam}`); }
  // "Bối cảnh" chứ không phải "Hướng dẫn": các trục mang thông tin thường trực của người dùng,
  // để họ khỏi phải gõ lại mỗi lần, chứ không phải để ép model đi theo một quy trình.
  const ns = nganSach(duration);
  return `Bạn là biên kịch và đạo diễn video bài giảng khổ dọc 9:16 bằng tiếng Việt. Làm hết khả năng: kiến thức chính xác, lời giảng hay, dàn cảnh hợp lý, hình minh hoạ tự thiết kế.

Yêu cầu của giáo viên: """${request}"""
Đối tượng người xem: học sinh lớp ${lop}.

## Thời lượng: giới hạn cứng ${duration} giây
Tổng thời lượng mọi cảnh cộng lại KHÔNG ĐƯỢC vượt quá ${duration} giây. Đây là ràng buộc bắt buộc, không phải gợi ý.
Độ dài thật của video do LỜI ĐỌC quyết định chứ không phải trường duration: máy đọc khoảng 16 ký tự mỗi giây, và mỗi cảnh tốn thêm 0,8 giây lặng. Nếu narration dài hơn duration thì bộ đọc tự nới cảnh ra và video sẽ tràn.
Vì vậy, với ${duration} giây hãy dùng ${ns.canhToiThieu} đến ${ns.canhToiDa} cảnh, và tổng số ký tự narration của CẢ VIDEO cộng lại không quá ${ns.kyTu} ký tự.
Trước khi trả về, hãy cộng độ dài tất cả narration và kiểm tra lại con số đó. Nếu vượt, phải cắt bớt nội dung chứ không được tăng duration.
Khi không đủ chỗ để dạy trọn vẹn: THU HẸP PHẠM VI (giải một phần, chọn ví dụ đơn giản hơn, dạy một ý thay vì ba ý) chứ tuyệt đối không bỏ bước, không nhồi chữ, không nói nhanh.

## Hợp đồng chung
${khung.cach_lam}

${getVisSpec()}

${dinhDangLoiGiai(loiGiai)}

${phan.length ? `## Bối cảnh\n${phan.join('\n\n')}\n\n${UU_TIEN}` : ''}`;
}

function gomTieuChi(khung, chon) {
  const ds = [];
  const push = (nguon, list) => { for (const c of list) ds.push({ nguon, ...c }); };
  push('Chung', khung.tieu_chi);
  for (const t of TRUC) { const s = chon[t]; if (s) push(`${TRUC_VI[t]}: ${s.ten}`, s.tieu_chi); }
  return ds;
}

async function chonTruc(request, model, effort) {
  const p = `Đọc yêu cầu làm video bài giảng dưới đây và chọn trục phù hợp nhất cho nó.

Yêu cầu: """${request}"""

Các lựa chọn có sẵn:
${catalogue()}

Trả về JSON:
{${TRUC.map(t => `"${t}":"id"`).join(',')},"lop":số lớp từ 1 đến 12,"ly_do":"một câu ngắn giải thích vì sao chọn như vậy"}

Quy tắc: nếu yêu cầu nói rõ lớp mấy hoặc sức học thế nào thì theo đúng lời giáo viên. Nếu không nói gì về sức học, chọn "trung-binh". Nếu không nói lớp, suy từ nội dung.`;
  const { data, calls } = await askJson(p, model, 'Chọn trục', effort);
  const lop = Math.min(12, Math.max(1, Number(data.lop) || 9));
  return { axes: Object.fromEntries(TRUC.map(t => [t, data[t]])), lop, ly_do: String(data.ly_do || ''), calls };
}

async function kiemClaude(script, tieuChi, giai, model, effort) {
  const ds = tieuChi.map((c, i) => `${i + 1}. [${c.muc}] (${c.nguon}) ${c.noi_dung}`).join('\n');
  const doiChieu = giai && giai.goc && giai.du_de
    ? `\nBài này có LỜI GIẢI GỐC của giáo viên, đã chốt. Kết luận: "${giai.dap_so}". Các bước theo đúng thứ tự:\n${giai.cac_buoc.map((x, i) => `${i + 1}. ${x.buoc}`).join('\n')}\nKịch bản phải dạy đúng lời giải này. Nếu kịch bản đổi sang cách giải khác, bỏ một bước, đảo thứ tự bước, hoặc ra kết luận khác thì đó là lỗi mức "chan".\n`
    : giai && giai.du_de
    ? `\nMột người khác đã giải bài này độc lập và ra đáp số: "${giai.dap_so}". Nếu đáp số trong kịch bản khác đáp số này, đó là lỗi mức "chan", trừ khi lời giải độc lập kia sai rõ ràng.\n` : '';

  const p = `Dưới đây là kịch bản một video bài giảng tiếng Việt. Việc của bạn là TÌM LỖI, không phải đánh giá chất lượng. Không khen. Không chấm điểm.

Kịch bản:
${JSON.stringify(script)}
${doiChieu}
Danh sách tiêu chí cần soát, mỗi tiêu chí có sẵn mức độ:
${ds}

Trả về JSON là một mảng các lỗi tìm được:
[{"tieu_chi": số thứ tự tiêu chí, "muc": "chan" | "sua" | "ghi", "canh": số thứ tự cảnh bắt đầu từ 1, "trich_dan": "trích nguyên văn đoạn có lỗi trong kịch bản", "van_de": "sai ở đâu, một câu", "de_xuat": "sửa thành gì, một câu"}]

Quy tắc bắt buộc:
- Chỉ báo lỗi khi trích dẫn được nguyên văn một đoạn có thật trong kịch bản. Không trích được thì không phải lỗi, bỏ qua.
- "muc" phải đúng bằng mức ghi sẵn của tiêu chí đó.
- Không bịa tiêu chí mới ngoài danh sách.
- Không có lỗi nào thì trả về mảng rỗng [].
- Tối đa ${MAX_LOI} lỗi, ưu tiên mức chan rồi sua.`;

  const { data, calls } = await askJson(p, model, 'Kiểm bằng Claude', effort);
  const arr = Array.isArray(data) ? data : [];
  return {
    loi: arr.slice(0, MAX_LOI).map(x => {
      const c = tieuChi[(Number(x.tieu_chi) || 0) - 1];
      return { tang: 'claude', tieu_chi: c ? c.noi_dung : String(x.tieu_chi), nguon: c ? c.nguon : '', muc: c ? c.muc : (x.muc || 'ghi'), canh: Number(x.canh) || null, trich_dan: String(x.trich_dan || '').slice(0, 200), van_de: String(x.van_de || ''), de_xuat: String(x.de_xuat || '') };
    }), calls
  };
}

async function sua(script, loi, loiNhac, model, effort) {
  const ds = loi.map(l => `- Cảnh ${l.canh ?? '?'}: ${l.tieu_chi}. Chỗ sai: "${l.trich_dan}". ${l.van_de}${l.de_xuat ? ' Đề xuất: ' + l.de_xuat : ''}`).join('\n');
  const p = `${loiNhac}

---
Bạn đã viết kịch bản dưới đây và nó bị phát hiện các lỗi sau. Hãy sửa đúng những lỗi đó và giữ nguyên mọi thứ khác.

Kịch bản hiện tại:
${JSON.stringify(script)}

Lỗi cần sửa:
${ds}

Trả về DUY NHẤT JSON của kịch bản hoàn chỉnh đã sửa, đúng cấu trúc cũ. Không giải thích.`;
  const { data, calls } = await askJson(p, model, 'Sửa theo lỗi', effort);
  return { script: data, calls };
}

// Chỉ lỗi thật (chan) và lỗi kỹ thuật máy đo được mới được phép ép viết lại.
// Nhận xét của Claude về cách dạy chỉ báo cáo cho người dùng, không bao giờ ép sửa:
// đó là ý kiến, và ép theo ý kiến chính là thứ làm kịch bản xấu đi.
const nang = l => l.filter(x => x.muc === 'chan' || (x.muc === 'sua' && x.tang === 'may'));

export async function chayPipeline({ request, duration, modelTier, jobId, onStep, chonTay = {}, effort = '', boSkill = false, boKiem = false, che = 'nhanh', loiGiaiGoc = '' }) {
  const model = MODELS[modelTier] || MODELS.default;
  const modelRoute = modelTier === 'quick' ? MODELS.quick : MODELS.default;
  const t0 = Date.now();
  const calls = [];
  const buoc = s => { onStep && onStep(s); };

  // Người dùng chọn tay thì trục đó khỏi hỏi Claude. Đủ cả năm thì bỏ hẳn lượt định tuyến.
  const thieu = TRUC.filter(t => !chonTay[t]).concat(chonTay.lop ? [] : ['lop']);
  let r;
  if (!thieu.length) {
    r = { axes: Object.fromEntries(TRUC.map(t => [t, chonTay[t]])), lop: Number(chonTay.lop), ly_do: 'Bạn chọn tay hết nên không cần Claude định tuyến.', calls: [], tu_chon: [] };
  } else {
    buoc('Đang chọn trục');
    r = await chonTruc(request, modelRoute, effort); calls.push(...r.calls);
    for (const t of TRUC) if (chonTay[t]) r.axes[t] = chonTay[t];
    if (chonTay.lop) r.lop = Number(chonTay.lop);
    r.tu_chon = thieu;
    const tay = TRUC.filter(t => chonTay[t]);
    if (tay.length) r.ly_do = `Bạn chọn tay: ${tay.join(', ')}${chonTay.lop ? ', lớp' : ''}. Claude chọn phần còn lại: ${r.ly_do}`;
  }
  const { khung, chon } = pickSkills(r.axes);
  const tieuChi = gomTieuChi(khung, chon);
  // BƯỚC 1: có lời giải đã xác minh rồi mới tới hình và cảnh. Chạy trước nên nếu toán
  // sai thì dừng ở đây, chưa tiêu gì cho việc dàn cảnh và dựng ảnh.
  let loiGiai = null;
  if (String(loiGiaiGoc || '').trim()) {
    // Giáo viên đưa lời giải vào: không giải lại, không đối chiếu. Chỉ cắt bước và thêm "vì sao".
    try { loiGiai = await tuLoiGiaiGoc({ request, loiGiaiGoc, lop: r.lop, model, effort, onStep: buoc }); calls.push(...loiGiai.calls); }
    catch (e) { loiGiai = { goc: true, ban_goc: loiGiaiGoc, du_de: false, dap_so: '', cac_buoc: [], khop: false, loi: e.message, calls: [] }; }
  } else if (!boKiem && chon.theloai && chon.theloai.id === 'giai-bai-tap') {
    try { loiGiai = await layLoiGiai({ request, lop: r.lop, model, effort, onStep: buoc }); calls.push(...loiGiai.calls); }
    catch (e) { loiGiai = { du_de: false, dap_so: '', cac_buoc: [], khop: false, loi: e.message, calls: [] }; }
  }
  const loiNhac = ghepLoiNhac({ request, duration, khung, chon, lop: r.lop, boSkill, loiGiai });

  let script, agent = null;
  if (che === 'ky') {
    // Chế độ kỹ: agent tự viết, tự dựng ảnh thử, tự mở ảnh ra xem, tự sửa.
    buoc('Agent đang viết và tự xem lại');
    const { jobDir } = chuanBiViec({
      jobId: jobId || 'tam-' + Date.now(), request, duration, axes: r.axes, lop: r.lop, loiGiai,
      template: (chon.phongcach && chon.phongcach.template) || 'minimal'
    });
    const a = await chayAgent({ jobDir, model, onStep: buoc });
    script = a.script;
    calls.push({ label: `Agent có mắt (${a.luot} lượt, ${a.soAnh} ảnh)`, model, effort: effort || 'mặc định', ms: a.ms, usd: a.usd, chars: 0 });
    agent = { luot: a.luot, soAnh: a.soAnh, loiKe: a.loiKe, thuMuc: jobDir, dungLai: a.dungLai !== false, loiDungLai: a.loiDungLai || '', suaLoiGiai: !!a.suaLoiGiai };
  } else {
    buoc('Đang viết kịch bản');
    const w = await askJson(loiNhac, model, 'Viết kịch bản', effort); calls.push(...w.calls);
    script = w.data;
  }
  const kichBanDau = JSON.parse(JSON.stringify(script));

  let loi = [], giai = null, truocSua = [], sauSua = null, vongSua = 0;
  if (!boKiem) {
  buoc('Đang kiểm');
  // Khoá lời giải: bước sửa hình không được làm mất đáp số đã xác minh.
  loi = kiemMay(script, { duration }).concat(kiemGiuDapSo(script, loiGiai));
  giai = loiGiai;
  try { const k = await kiemClaude(script, tieuChi, giai, model, effort); calls.push(...k.calls); loi = loi.concat(k.loi); }
  catch (e) { loi.push({ tang: 'claude', tieu_chi: 'Không kiểm được bằng Claude', muc: 'ghi', canh: null, trich_dan: '', van_de: e.message }); }

  truocSua = loi;
  const canSua = nang(loi);
  if (canSua.length) {
    buoc(`Đang sửa ${canSua.length} lỗi`);
    vongSua = 1;
    try {
      const f = await sua(script, canSua, loiNhac, model, effort); calls.push(...f.calls);
      script = f.script;
      sauSua = kiemMay(script, { duration }).concat(kiemGiuDapSo(script, loiGiai)); // chỉ kiểm lại bằng máy
    } catch (e) {
      sauSua = [{ tang: 'may', tieu_chi: 'Không sửa được', muc: 'ghi', canh: null, trich_dan: '', van_de: e.message }];
    }
  }
  }

  const conLai = sauSua || truocSua;
  const detail = {
    jobId, request, duration, modelTier, model,
    phien_ban: PHIEN_BAN,
    effort: effort || 'mặc định', boSkill, boKiem, che, agent,
    batDau: t0, ms: Date.now() - t0,
    usd: calls.reduce((s, c) => s + (c.usd || 0), 0),
    truc: { ...r.axes, lop: r.lop, ly_do: r.ly_do, tu_chon: r.tu_chon || [] },
    skills: TRUC.map(t => chon[t] && ({ truc: t, truc_ten: TRUC_VI[t], id: chon[t].id, ten: chon[t].ten, mo_ta: chon[t].mo_ta, cach_lam: chon[t].cach_lam, tieu_chi: chon[t].tieu_chi })).filter(Boolean),
    tieu_chi: tieuChi,
    loi_nhac: loiNhac,
    kich_ban_dau: kichBanDau,
    loi_giai: loiGiai ? { goc: !!loiGiai.goc, du_de: !!loiGiai.du_de, dap_so: loiGiai.dap_so || '', cac_buoc: loiGiai.cac_buoc || [], khop: !!loiGiai.khop, giai_lai: !!loiGiai.giai_lai, sai_nguyen_van: loiGiai.sai_nguyen_van || [], ban_goc: loiGiai.ban_goc || '' } : null,
    giai_doc_lap: loiGiai && loiGiai.doi_chieu ? { du_de: !!loiGiai.doi_chieu.du_de, dap_so: loiGiai.doi_chieu.dap_so || '', cac_buoc: loiGiai.doi_chieu.cac_buoc || [] } : null,
    kiem: { truoc_sua: truocSua, sau_sua: sauSua },
    vong_sua: vongSua,
    con_chan: conLai.filter(x => x.muc === 'chan').length,
    con_sua: conLai.filter(x => x.muc === 'sua').length,
    con_ghi: conLai.filter(x => x.muc === 'ghi').length,
    calls
  };
  if (jobId) {
    fs.mkdirSync(DETAILS, { recursive: true });
    fs.writeFileSync(path.join(DETAILS, jobId + '.json'), JSON.stringify(detail));
  }
  // Trục phong cách quyết định template của video, không phải ô chọn trên trang.
  return { script, detail, template: (chon.phongcach && chon.phongcach.template) || '' };
}

export function docDetail(jobId) {
  const p = path.join(DETAILS, jobId + '.json');
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
}
export function xoaDetail(jobId) { fs.rmSync(path.join(DETAILS, jobId + '.json'), { force: true }); }
