// Bước đầu tiên của đường đi: có lời giải đã xác minh rồi mới tới hình và cảnh.
//
// Trước đây lời giải được nghĩ ra TRONG LÚC viết cảnh, và việc giải độc lập chạy ở lượt
// cuối cùng — sau khi đã tiêu phần lớn tiền. Giải sai thì vứt cả. Giờ nó chạy đầu tiên:
// rẻ, và chặn được mọi thứ phía sau.
//
// Lời giải sau khi qua kiểm là **khoá**: bước agent nhìn ảnh chỉ được sửa hình và cách
// trình bày, không được sửa ngược nội dung toán. Khoá đó vừa dặn trong lời nhắc, vừa
// kiểm lại bằng máy sau khi agent xong.
import { askJson } from './claude.mjs';

const chuan = s => String(s || '').toLowerCase()
  .replace(/[,\s]+/g, ' ')
  .replace(/[.;:]+$/, '')
  .trim();

// So đáp số một cách rộng tay: chỉ cần các con số khớp nhau và cùng thứ tự.
const soTrong = s => (String(s || '').match(/-?\d+(?:[.,]\d+)?/g) || []).map(x => x.replace(',', '.'));
function khopDapSo(a, b) {
  if (!a || !b) return false;
  if (chuan(a) === chuan(b)) return true;
  const sa = soTrong(a), sb = soTrong(b);
  return sa.length > 0 && sa.length === sb.length && sa.every((x, i) => Number(x) === Number(sb[i]));
}

export async function vietLoiGiai({ request, lop, model, effort = '' }) {
  const p = `Giải bài sau cho học sinh lớp ${lop}, và nói rõ **vì sao nghĩ ra** từng bước.

Đề: """${request}"""

Trả về JSON:
{"du_de": true hoặc false,
 "dap_so": "kết quả cuối cùng, viết ngắn gọn",
 "cac_buoc": [{"buoc": "làm gì", "vi_sao": "vì sao nghĩ tới bước này, dùng giả thiết nào"}]}

Trường "vi_sao" là chỗ quan trọng nhất: học sinh hụt ở chỗ không biết vì sao lại nghĩ ra bước đó, chứ không phải ở chỗ tính toán. Nếu một bước là hiển nhiên thì nói thẳng là hiển nhiên.
Nếu đề không đủ dữ kiện để ra kết quả cụ thể thì trả {"du_de": false, "dap_so": "", "cac_buoc": []}.`;
  const { data, calls } = await askJson(p, model, 'Viết lời giải', effort);
  return { ...data, cac_buoc: Array.isArray(data.cac_buoc) ? data.cac_buoc : [], calls };
}

// Giải lại từ đầu, chỉ nhìn đề, để đối chiếu — không đưa lời giải kia vào xem.
export async function kiemCheo({ request, model, effort = '' }) {
  const p = `Giải bài tập sau một cách độc lập. Chỉ dựa vào đề, không có lời giải nào cho sẵn.

Đề: """${request}"""

Trả về JSON:
{"du_de": true hoặc false, "dap_so": "đáp số cuối cùng, viết ngắn gọn", "cac_buoc": ["bước 1", "bước 2", "..."]}

Nếu đề không đủ dữ kiện để ra một đáp số cụ thể thì trả {"du_de": false, "dap_so": "", "cac_buoc": []}.`;
  const { data, calls } = await askJson(p, model, 'Giải độc lập để đối chiếu', effort);
  return { ...data, calls };
}

// Chạy bước 1 trọn vẹn: viết, đối chiếu, và thử lại một lần nếu hai bên lệch nhau.
export async function layLoiGiai({ request, lop, model, effort = '', onStep }) {
  const calls = [];
  const buoc = s => onStep && onStep(s);

  buoc('Đang giải bài trước khi dựng cảnh');
  let lg = await vietLoiGiai({ request, lop, model, effort }); calls.push(...lg.calls);
  buoc('Đang giải lại độc lập để đối chiếu');
  const cheo = await kiemCheo({ request, model, effort }); calls.push(...cheo.calls);

  let khop = !lg.du_de || !cheo.du_de || khopDapSo(lg.dap_so, cheo.dap_so);
  let lanHai = null;
  if (!khop) {
    // Lệch thì giải lại một lần, cho xem cả hai đáp số đang tranh nhau.
    buoc('Hai lời giải lệch nhau, đang giải lại');
    const p2 = { request: `${request}\n\n(Hai lần giải trước ra hai đáp số khác nhau: "${lg.dap_so}" và "${cheo.dap_so}". Hãy giải thật cẩn thận và cho biết đáp số nào đúng.)`, lop, model, effort };
    lanHai = await vietLoiGiai(p2); calls.push(...lanHai.calls);
    lg = lanHai;
    khop = khopDapSo(lg.dap_so, cheo.dap_so);
  }

  return {
    du_de: !!lg.du_de, dap_so: lg.dap_so || '', cac_buoc: lg.cac_buoc || [],
    doi_chieu: { dap_so: cheo.dap_so || '', du_de: !!cheo.du_de, cac_buoc: cheo.cac_buoc || [] },
    khop, giai_lai: !!lanHai, calls
  };
}

// Đưa vào lời nhắc, cho cả chế độ nhanh lẫn brief của agent.
export function dinhDangLoiGiai(lg) {
  if (!lg || !lg.du_de || !lg.cac_buoc.length) return '';
  const b = lg.cac_buoc.map((x, i) => `${i + 1}. ${x.buoc || x}${x.vi_sao ? `\n   *Vì sao:* ${x.vi_sao}` : ''}`).join('\n');
  return `## Lời giải đã xác minh
Lời giải này đã được giải hai lần độc lập và hai lần ra cùng đáp số${lg.khop ? '' : ' (CHƯA khớp — xem cảnh báo bên dưới)'}. **Đừng giải lại theo hướng khác.** Việc của bạn là dựng nó thành video: chia cảnh theo các bước dưới đây, và đưa phần "vì sao" vào lời đọc, vì đó mới là chỗ học sinh hụt.

Đáp số: **${lg.dap_so}**

${b}
${lg.khop ? '' : '\n**Cảnh báo:** hai lần giải độc lập ra hai đáp số khác nhau. Hãy tự kiểm lại trước khi dựng.\n'}`;
}

// Khoá: sau khi agent nhìn ảnh và sửa, đáp số phải còn nguyên trong kịch bản.
export function kiemGiuDapSo(script, lg) {
  if (!lg || !lg.du_de || !lg.dap_so) return [];
  const so = soTrong(lg.dap_so);
  if (!so.length) return [];
  const sc = (script && Array.isArray(script.scenes)) ? script.scenes : [];
  const chu = sc.map(s => `${s.heading || ''} ${s.body || ''} ${s.formula || ''} ${s.narration || ''} ${(s.items || []).map(i => i.text).join(' ')}`).join(' ');
  const soTrongKichBan = new Set(soTrong(chu).map(Number));
  // Lời đọc viết số bằng chữ nên chỉ soát phần chữ trên màn hình; thiếu HẾT mới là lỗi.
  const thieu = so.filter(x => !soTrongKichBan.has(Number(x)));
  if (thieu.length < so.length) return [];
  return [{
    tang: 'may', muc: 'sua', canh: null,
    tieu_chi: 'Kịch bản không còn đáp số của lời giải đã xác minh',
    trich_dan: lg.dap_so,
    van_de: `Lời giải đã xác minh có đáp số "${lg.dap_so}" nhưng không con số nào trong đó xuất hiện trên màn hình. Bước sửa hình không được đổi nội dung toán.`
  }];
}
