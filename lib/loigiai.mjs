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

const soTrong = s => (String(s || '').match(/-?\d+(?:[.,]\d+)?/g) || []).map(x => x.replace(',', '.'));
// Bỏ hết dấu và chữ có dấu, giữ lại bộ xương của đẳng thức: "AC² = AH · AB" -> "ac²=ah·ab".
const xuong = s => String(s || '').toLowerCase().replace(/[^a-z0-9²³·=+\-\/⊥∥]/g, '');
// Các đẳng thức và quan hệ trong một câu chữ: "H là trung điểm của CD (HC = HD) và AC = AD"
// cho ra "hc=hd" và "ac=ad". Phần chữ quanh chúng không bao giờ được chép lên màn hình nguyên si.
const cacDangThuc = s => (String(s || '').match(/[^\s=⊥∥,;]+(?:\s*[=⊥∥]\s*[^\s=⊥∥,;]+)+/g) || [])
  .map(xuong).filter(x => x.length >= 3 && /[=⊥∥]/.test(x));

// Ba kết quả chứ không phải hai: bài chứng minh không có đáp số bằng số, nên "không đo
// được" phải khác "lệch nhau". Coi nhầm thành lệch là giải lại một lượt vô ích.
function soSanhDapSo(a, b) {
  if (!a || !b) return 'khong-do-duoc';
  if (chuan(a) === chuan(b)) return 'khop';
  const sa = soTrong(a), sb = soTrong(b);
  if (sa.length && sb.length) {
    return (sa.length === sb.length && sa.every((x, i) => Number(x) === Number(sb[i]))) ? 'khop' : 'lech';
  }
  // Không bên nào có số: bài chứng minh. So bộ xương đẳng thức, bên này chứa bên kia là khớp.
  const xa = xuong(a), xb = xuong(b);
  if (xa && xb && (xa.includes(xb) || xb.includes(xa))) return 'khop';
  return 'khong-do-duoc';
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

  let ket = (!lg.du_de || !cheo.du_de) ? 'khong-do-duoc' : soSanhDapSo(lg.dap_so, cheo.dap_so);
  let lanHai = null;
  // Chỉ giải lại khi hai bên THẬT SỰ lệch. "Không đo được" thì giải lại cũng không sáng ra.
  if (ket === 'lech') {
    buoc('Hai lời giải lệch nhau, đang giải lại');
    const p2 = { request: `${request}\n\n(Hai lần giải trước ra hai đáp số khác nhau: "${lg.dap_so}" và "${cheo.dap_so}". Hãy giải lại thật cẩn thận. Chỉ trả về lời giải đúng, đừng bình luận về hai lần giải trước.)`, lop, model, effort };
    lanHai = await vietLoiGiai(p2); calls.push(...lanHai.calls);
    lg = lanHai;
    ket = soSanhDapSo(lg.dap_so, cheo.dap_so);
  }

  return {
    du_de: !!lg.du_de, dap_so: lg.dap_so || '', cac_buoc: lg.cac_buoc || [],
    doi_chieu: { dap_so: cheo.dap_so || '', du_de: !!cheo.du_de, cac_buoc: cheo.cac_buoc || [] },
    khop: ket === 'khop', doi_chieu_duoc: ket !== 'khong-do-duoc', ket, giai_lai: !!lanHai, calls
  };
}

// Luồng có lời giải gốc: giáo viên đưa lời giải vào, hệ thống KHÔNG giải lại và không
// đối chiếu. Chỉ cắt lời giải gốc thành từng bước, giữ nguyên văn, rồi thêm phần "vì sao"
// cho lời đọc — đúng chỗ mà lời giải viết vào vở không bao giờ có.
const gon = s => String(s || '').replace(/\s+/g, ' ').trim();

export async function tuLoiGiaiGoc({ request, loiGiaiGoc, lop, model, effort = '', onStep }) {
  const calls = [];
  onStep && onStep('Đang đọc lời giải gốc');
  const nhac = (them = '') => `Dưới đây là một đề toán và lời giải gốc của giáo viên. Lời giải này đã đúng và đã chốt. **Không giải lại, không đổi cách giải, không sửa ký hiệu, không thêm phép biến đổi mới.**

Đề: """${request}"""

Lời giải gốc: """${loiGiaiGoc}"""

Việc của bạn chỉ có hai:
1. Cắt lời giải gốc thành từng bước theo đúng thứ tự. Trường "buoc" phải là **nguyên văn** một đoạn liền trong lời giải gốc — chép y hệt, kể cả ký hiệu và thứ tự đỉnh, không viết lại cho gọn hay cho rõ.
2. Với mỗi bước, viết trường "vi_sao": vì sao làm được bước này, và vì sao lại nghĩ tới nó. Nếu lời giải gốc gộp nhiều suy luận vào một dòng thì "vi_sao" được nói ra các suy luận ngầm đó, nhưng không thêm phép toán mới và không đổi hướng giải.

Viết "vi_sao" chặt chẽ kiểu toán học, căn cứ trước kết luận sau: "ta có tam giác EFX vuông tại F và tam giác EXB vuông tại X, nên góc EFX bằng góc EXB bằng 90°". Gọi tên đầy đủ đối tượng và tính chất của nó.

Trả về JSON:
{"dap_so": "kết luận cuối cùng của lời giải gốc, chép nguyên văn",
 "cac_buoc": [{"buoc": "nguyên văn bước trong lời giải gốc", "vi_sao": "..."}]}${them}`;

  let r = await askJson(nhac(), model, 'Cắt lời giải gốc thành bước', effort); calls.push(...r.calls);
  let cac = Array.isArray(r.data.cac_buoc) ? r.data.cac_buoc : [];
  // Khoá nguyên văn bằng máy: bước nào không phải một đoạn của bản gốc là đã bị viết lại.
  const goc = gon(loiGiaiGoc);
  const saiNguyenVan = ds => ds.filter(x => !goc.includes(gon(x.buoc)));
  let sai = saiNguyenVan(cac);
  if (sai.length) {
    onStep && onStep('Có bước bị viết lại, đang cắt lại cho đúng nguyên văn');
    const ke = sai.map(x => `- "${x.buoc}"`).join('\n');
    r = await askJson(nhac(`\n\nLần trước các bước sau KHÔNG phải nguyên văn trong lời giải gốc, chúng đã bị viết lại:\n${ke}\nHãy chép y hệt từ lời giải gốc.`), model, 'Cắt lại cho đúng nguyên văn', effort);
    calls.push(...r.calls);
    cac = Array.isArray(r.data.cac_buoc) ? r.data.cac_buoc : cac;
    sai = saiNguyenVan(cac);
  }

  return {
    goc: true, ban_goc: loiGiaiGoc, du_de: true,
    dap_so: r.data.dap_so || '', cac_buoc: cac,
    sai_nguyen_van: sai.map(x => x.buoc),
    // Luồng này không đối chiếu: giáo viên đã chốt lời giải.
    khop: false, doi_chieu_duoc: false, ket: 'goc', giai_lai: false, doi_chieu: null, calls
  };
}

// Đưa vào lời nhắc, cho cả chế độ nhanh lẫn brief của agent.
export function dinhDangLoiGiai(lg) {
  if (!lg || !lg.du_de || !lg.cac_buoc.length) return '';
  const b = lg.cac_buoc.map((x, i) => `${i + 1}. ${x.buoc || x}${x.vi_sao ? `\n   *Vì sao:* ${x.vi_sao}` : ''}`).join('\n');
  if (lg.goc) return `## Lời giải gốc của giáo viên — đã khoá
Đây là lời giải giáo viên đưa vào. **Không giải lại, không đổi cách giải, không thêm phép biến đổi mới**, kể cả khi bạn biết một cách ngắn hơn.

- **Chữ trên màn hình** (\`body\`, \`formula\`) lấy đúng từ các bước dưới đây, giữ nguyên ký hiệu, thứ tự đỉnh và **cả dấu câu** — quy tắc tách ý bằng dấu chấm phẩy ở hợp đồng chung không áp vào đây, vì lời giải gốc đã có dấu câu của nó. Được cắt một bước dài ra nhiều cảnh, không được viết lại.
- **Lời đọc** là phần giảng mà tờ giấy không có: nói vì sao làm được bước đó và vì sao lại nghĩ tới nó, theo phần "Vì sao" bên dưới. Được nói ra các suy luận ngầm mà lời giải gốc viết gộp, nhưng không thêm phép toán mới và không đổi hướng.
- Chia cảnh bám theo các bước này, đúng thứ tự.

Kết luận: **${lg.dap_so}**

${b}

Bản gốc nguyên văn:
"""${lg.ban_goc}"""
`;
  return `## Lời giải đã xác minh
Lời giải này đã được giải hai lần độc lập${lg.khop ? ' và hai lần ra cùng đáp số' : lg.doi_chieu_duoc ? ', nhưng hai lần ra đáp số KHÁC NHAU' : ' (bài chứng minh nên không đối chiếu được bằng đáp số)'}. **Đừng giải lại theo hướng khác.** Việc của bạn là dựng nó thành video: chia cảnh theo các bước dưới đây, và đưa phần "vì sao" vào lời đọc, vì đó mới là chỗ học sinh hụt.

Đáp số: **${lg.dap_so}**

${b}
${lg.khop || !lg.doi_chieu_duoc ? '' : '\n**Cảnh báo:** hai lần giải độc lập ra hai đáp số khác nhau. Hãy tự kiểm lại trước khi dựng.\n'}`;
}

// Khoá: sau khi agent nhìn ảnh và sửa, đáp số phải còn nguyên trong kịch bản.
// Phần chữ thật sự hiện ra: cảnh point không vẽ heading, còn lời đọc thì không lên màn hình.
const chuManHinh = sc => sc.map(s => `${s.type === 'point' ? '' : (s.heading || '')} ${s.body || ''} ${s.formula || ''} ${(s.items || []).map(i => i.text).join(' ')}`).join(' ');
// Kết luận cuối của một chuỗi suy luận "A ⇒ B ⇒ C" là C.
const ketLuanCuoi = s => String(s || '').split(/⇒|=>|\bsuy ra\b/).pop();

export function kiemGiuDapSo(script, lg) {
  if (!lg || !lg.du_de || !lg.dap_so) return [];
  const sc = (script && Array.isArray(script.scenes)) ? script.scenes : [];
  const chu = chuManHinh(sc);

  // Lời giải gốc: chữ trên màn hình phải lấy từ nó, nên soát được từng bước chứ không chỉ
  // kết luận. Với bài chứng minh, kết luận đã nằm sẵn trong đề ở cảnh mở đầu, nên chỉ soát
  // kết luận thì gần như luôn qua. Một bước được cắt ra nhiều cảnh liền nhau vẫn khớp, vì
  // chữ các cảnh được nối theo đúng thứ tự trước khi so.
  if (lg.goc && Array.isArray(lg.cac_buoc) && lg.cac_buoc.length) {
    const xChu = xuong(chu);
    const thieu = lg.cac_buoc.map(b => b.buoc || '').filter(b => xuong(b).length >= 3 && !xChu.includes(xuong(b)));
    return thieu.length ? [{
      tang: 'may', muc: 'sua', canh: null,
      tieu_chi: 'Bước của lời giải gốc không xuất hiện trên màn hình',
      trich_dan: thieu[0].slice(0, 120),
      van_de: `${thieu.length} bước của lời giải gốc không có trên màn hình, hoặc đã bị viết lại: ${thieu.map(x => `"${x}"`).join('; ')}. Chữ trên màn hình phải lấy nguyên văn từ lời giải gốc, theo đúng thứ tự.`
    }] : [];
  }

  const so = soTrong(lg.dap_so);
  let mat;
  if (so.length) {
    // Bài tính: thiếu HẾT các con số của đáp số mới là lỗi.
    const co = new Set(soTrong(chu).map(Number));
    mat = so.every(x => !co.has(Number(x)));
  } else {
    // Bài chứng minh không có số để so. So các đẳng thức trong kết luận, bỏ phần chữ — so cả
    // câu thì không bao giờ khớp và báo oan. Thiếu HẾT mới là lỗi, như bài tính.
    const dt = cacDangThuc(ketLuanCuoi(lg.dap_so));
    if (!dt.length) return [];
    const xChu = xuong(chu);
    mat = dt.every(x => !xChu.includes(x));
  }
  if (!mat) return [];
  return [{
    tang: 'may', muc: 'sua', canh: null,
    tieu_chi: 'Kịch bản không còn đáp số của lời giải đã xác minh',
    trich_dan: lg.dap_so,
    van_de: `Kết luận "${ketLuanCuoi(lg.dap_so).trim()}" của lời giải không xuất hiện trên màn hình ở cảnh nào. Bước sửa hình không được đổi hay bỏ nội dung toán.`
  }];
}
