// Tầng kiểm bằng máy: chắc chắn, không tốn gì, chạy cho mọi video.
// Mỗi lỗi trả về {tang:'may', tieu_chi, muc, canh, trich_dan, van_de}.
import { kiemLienTuc } from './lientuc.mjs';

const SYM = /[=+×÷±≤≥≠<>√∑∫∈∉⊂⊃∪∩∀∃⇒⇔→←↔°²³¹⁰½¼%]/;
const LATEX = /\\[a-zA-Z]+|\$|\^|_\{|\{\\/;
// Vài ký hiệu toán nằm trong Extended_Pictographic của Unicode — ↔ là một — nên phép soát
// emoji báo oan chúng. Chúng là ký hiệu hợp lệ trên màn hình, chừa ra trước khi soát.
const TOAN_NHU_EMOJI = /[↔↕⤴⤵▶◀]/gu;
const EMOJI_THO = /\p{Extended_Pictographic}/u;
const EMOJI = { test: t => EMOJI_THO.test(String(t).replace(TOAN_NHU_EMOJI, '')) };
// Không soát chữ cái Latin đứng một mình: "x bằng ba", "hệ số a" là cách giáo viên đọc thật,
// và lời nhắc gốc cũng lấy "x cộng hai bằng năm" làm ví dụ đúng.
// Tầng đọc đổi cụm chữ in hoa thành tên chữ cái trước khi phát: "KBC" -> "ca bê xê".
// Bảng này chép từ TEN_CHU trong app/tts/xv_daemon.py; đếm ký tự thô là hụt, nhất là
// bài hình học nơi tên điểm dày đặc.
const TEN_CHU = { A: 'a', B: 'bê', C: 'xê', D: 'dê', E: 'e', F: 'ép', G: 'giê', H: 'hát', I: 'i',
  J: 'gi', K: 'ca', L: 'lờ', M: 'mờ', N: 'nờ', O: 'o', P: 'pê', Q: 'quy', R: 'rờ', S: 'ét',
  T: 'tê', U: 'u', V: 'vê', W: 'vê kép', X: 'ích', Y: 'i dài', Z: 'dét' };
const HOA = /(?<![0-9A-Za-zÀ-ỹ])[A-Z]{1,6}(?![0-9A-Za-zÀ-ỹ])/g;
const noTenDiem = t => String(t || '').replace(HOA, m => [...m].map(c => TEN_CHU[c] || c).join(' '));

// Đo lại trên chữ ĐÃ NỞ từ ba video biết độ dài audio thật (88,7s / 56,7s / 59,0s).
// Khớp nhất là 17,4 ký tự mỗi giây và 1,0 giây lặng mỗi cảnh, sai số lớn nhất 1,1 giây.
// Con số 16 cũ tính trên chữ THÔ nên hụt tới 8 giây ở bài hình học.
const GIAY_MOI_KY_TU = 17.4;
const LEAD = 0.35, TAIL = 0.45; // khoảng lặng đầu và cuối mỗi cảnh, khớp với xv_daemon.py
const PHU_TROI = 0.2;           // phần dôi đo được ngoài LEAD và TAIL, gồm cả làm tròn của daemon

// Độ dài thật của một cảnh sau khi ghép giọng: bộ đọc nới cảnh ra nếu lời đọc dài hơn duration.
function daiThat(s) {
  const nar = noTenDiem(s.narration), dur = Number(s.duration) || 0;
  return nar ? Math.max(dur, LEAD + nar.length / GIAY_MOI_KY_TU + TAIL + PHU_TROI) : dur;
}

const cut = (s, n = 90) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n) + '…' : s; };
const els = sc => (sc.visual && Array.isArray(sc.visual.els)) ? sc.visual.els : [];

function diemCua(e) {
  const d = [];
  if (Array.isArray(e.p)) for (const p of e.p) if (Array.isArray(p)) d.push(p);
  if (Array.isArray(e.at)) {
    const [x, y] = e.at;
    if (e.t === 'rect' && Array.isArray(e.wh)) d.push([x, y], [x + e.wh[0], y + e.wh[1]]);
    else if (e.t === 'table' && Array.isArray(e.wh)) d.push([x, y], [x + e.wh[0], y + e.wh[1]]);
    else if (e.t === 'circle' && e.r != null) d.push([x - e.r, y - e.r], [x + e.r, y + e.r]);
    else if (e.t === 'arc' && e.r != null) d.push([x - e.r, y - e.r], [x + e.r, y + e.r]);
    else if (e.t === 'ellipse') d.push([x - (e.rx || 0), y - (e.ry || 0)], [x + (e.rx || 0), y + (e.ry || 0)]);
    else d.push([x, y]);
  }
  return d;
}

// Khung chữ xấp xỉ, chỉ để phát hiện nhãn đè nhau rõ rệt.
function khungChu(e) {
  const [x, y] = e.at || [0, 0];
  const size = e.size || 1;
  const w = String(e.s || '').length * size * 1.3, h = size * 3.2;
  const x0 = e.align === 'r' ? x - w : e.align === 'c' ? x - w / 2 : x;
  return [x0, y - h / 2, x0 + w, y + h / 2];
}
const giao = (a, b) => {
  const w = Math.min(a[2], b[2]) - Math.max(a[0], b[0]), h = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
  if (w <= 0 || h <= 0) return 0;
  const nho = Math.min((a[2] - a[0]) * (a[3] - a[1]), (b[2] - b[0]) * (b[3] - b[1]));
  return nho > 0 ? (w * h) / nho : 0;
};

export function kiemMay(script, { duration } = {}) {
  const loi = [];
  const them = (tieu_chi, muc, canh, trich_dan, van_de) => loi.push({ tang: 'may', tieu_chi, muc, canh, trich_dan: cut(trich_dan), van_de });
  const sc = (script && Array.isArray(script.scenes)) ? script.scenes : [];
  if (!sc.length) { them('Kịch bản rỗng', 'chan', null, '', 'Không có cảnh nào.'); return loi; }

  if (sc[0].type !== 'title') them('Cảnh đầu phải là title', 'sua', 1, sc[0].heading, `Cảnh đầu đang là "${sc[0].type}".`);
  if (sc[sc.length - 1].type !== 'summary') them('Cảnh cuối phải là summary', 'sua', sc.length, sc[sc.length - 1].heading, `Cảnh cuối đang là "${sc[sc.length - 1].type}".`);

  let tongThat = 0;
  const daiCanh = [];
  sc.forEach((s, i) => {
    const n = i + 1, nar = String(s.narration || '');
    const that = daiThat(s);
    tongThat += that; daiCanh.push({ n, that });

    // Lời đọc: máy đọc sẽ đọc sai mọi ký hiệu và chữ số.
    let m;
    if ((m = /\d/.exec(nar))) them('Lời đọc có chữ số', 'sua', n, nar, 'Lời đọc phải viết số bằng chữ, máy đọc sẽ đọc sai chữ số.');
    if ((m = SYM.exec(nar))) them('Lời đọc có ký hiệu toán', 'sua', n, nar, `Ký hiệu "${m[0]}" sẽ bị máy đọc bỏ qua hoặc đọc sai.`);
    if (EMOJI.test(nar + s.heading + s.body)) them('Có emoji', 'sua', n, nar || s.heading, 'Kịch bản không được dùng emoji.');

    if (s.formula && LATEX.test(s.formula)) them('Công thức viết bằng LaTeX', 'sua', n, s.formula, 'Bộ dựng không hiểu LaTeX, phải viết bằng ký tự Unicode.');

    // Chữ trên màn hình: khung dọc rất hẹp, chữ dài sẽ tự co tới mức không đọc nổi.
    if ((s.heading || '').length > 60) them('Tiêu đề cảnh quá dài', 'sua', n, s.heading, `${s.heading.length} ký tự, quá 60.`);
    if ((s.body || '').length > 220) them('Chữ trên màn hình quá dài', 'sua', n, s.body, `${s.body.length} ký tự, quá 220.`);
    const items = Array.isArray(s.items) ? s.items : [];
    if (items.length > 7) them('Quá nhiều mục trong một cảnh', 'sua', n, s.heading, `${items.length} mục, quá 7.`);
    for (const it of items) if ((it.text || '').length > 90) them('Mục quá dài', 'sua', n, it.text, `${it.text.length} ký tự, quá 90.`);
    if ((s.type === 'list' || s.type === 'summary') && !items.length) them('Cảnh list hoặc summary không có mục nào', 'sua', n, s.heading, 'Type này bắt buộc có items.');

    // Thời lượng
    const uoc = noTenDiem(nar).length / GIAY_MOI_KY_TU;
    const dur = Number(s.duration) || 0;
    if (nar && dur > uoc + 3) them('Cảnh thừa thời gian', 'ghi', n, nar, `Đặt ${dur}s nhưng lời đọc chỉ khoảng ${uoc.toFixed(1)}s, màn hình sẽ đứng im.`);

    // Hình vẽ
    const e = els(s);
    if (s.visual && e.length && e.length < 2) them('Hình quá sơ sài', 'ghi', n, s.heading, 'Hình chỉ có một phần tử, nhiều khả năng là trang trí.');
    if (s.visual && Array.isArray(s.visual.view)) {
      const [vw, vh] = s.visual.view;
      for (const el of e) for (const [x, y] of diemCua(el))
        if (x < -1 || y < -1 || x > vw + 1 || y > vh + 1) {
          them('Hình vẽ tràn ra ngoài khung', 'sua', n, `${el.t} tại (${x}, ${y})`, `Khung chỉ rộng ${vw}×${vh}, phần tử này nằm ngoài và sẽ bị cắt.`);
          break;
        }
      const chu = e.filter(x => x.t === 'text' && Array.isArray(x.at));
      for (let a = 0; a < chu.length; a++) for (let b = a + 1; b < chu.length; b++)
        if (giao(khungChu(chu[a]), khungChu(chu[b])) > 0.4) {
          them('Hai nhãn trong hình đè nhau', 'sua', n, `"${chu[a].s}" và "${chu[b].s}"`, 'Hai nhãn chồng lên nhau, sẽ không đọc được.');
          a = chu.length; break;
        }
    }
  });

  // Giới hạn cứng: video sau khi ghép giọng không được dài hơn thời lượng người dùng chọn.
    // Dung sai 1,5 giây: ước lượng sai số tới 1,1 giây, mà một vòng sửa tốn khoảng 0,39 đô.
  // Tràn một hai giây thì bộ đọc tự nới, không ai nhận ra; bắt viết lại mới là đắt.
  if (duration && tongThat > duration + 1.5) {
    const dai = daiCanh.slice().sort((a, b) => b.that - a.that).slice(0, 3)
      .map(x => `cảnh ${x.n} (${x.that.toFixed(1)}s)`).join(', ');
    them('Video dài hơn thời lượng đã chọn', 'sua', null, `${Math.round(tongThat)}s / ${duration}s`,
      `Ghép giọng xong video sẽ dài khoảng ${Math.round(tongThat)} giây, vượt ${Math.round(tongThat - duration)} giây. Phải cắt bớt lời đọc hoặc bớt cảnh, dài nhất đang là ${dai}.`);
  } else if (duration && tongThat < duration * 0.5) {
    them('Video ngắn hơn nhiều so với thời lượng đã chọn', 'ghi', null, `${Math.round(tongThat)}s / ${duration}s`,
      'Còn nhiều chỗ trống, có thể giảng kỹ hơn.');
  }

  // Liên tục hình đo ở module riêng, vì nó so sánh giữa các cảnh chứ không trong một cảnh.
  return loi.concat(kiemLienTuc(script));
}
