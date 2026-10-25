// Sửa một cảnh, hoặc vẽ lại hình của một cảnh, nhưng trong ngữ cảnh cả kịch bản.
//
// Trước đây việc này chạy thẳng trong trình duyệt: lời nhắc chỉ có đúng một cảnh,
// không có hợp đồng chung, không có skill, không thấy cảnh lân cận, và không qua lớp
// kiểm nào. Hệ quả là cảnh vừa sửa đổi view/box rồi phá liên tục hình của cả video mà
// không ai biết. Giờ nó đi cùng đường với lúc viết kịch bản.
import { askJson } from './claude.mjs';
import { pickSkills, TRUC, TRUC_VI } from './skills.mjs';
import { kiemMay } from './checks.mjs';
import { nganSach, docVisSpec } from './hopdong.mjs';

const nang = l => l.filter(x => x.muc === 'chan' || (x.muc === 'sua' && x.tang === 'may'));
const khoa = l => `${l.tieu_chi}|${l.canh ?? ''}`;
const els = s => (s && s.visual && Array.isArray(s.visual.els)) ? s.visual.els : null;
const doDai = s => { const n = String(s.narration || ''); return n ? 0.35 + n.length / 16 + 0.45 : (Number(s.duration) || 0); };

// Nhắc đúng cái tiền tố phải lặp lại, bằng số, để không thể hiểu nhầm.
function rangBuocHinh(scenes, k) {
  const truoc = k > 0 ? scenes[k - 1] : null, sau = k < scenes.length - 1 ? scenes[k + 1] : null;
  const d = [];
  const ta = s => `view ${JSON.stringify(s.visual.view)}, box ${JSON.stringify(s.visual.box)}, ${els(s).length} phần tử`;
  if (truoc && els(truoc)) d.push(`- Cảnh ${k} ngay trước có hình: ${ta(truoc)}. Nếu cảnh bạn sửa có hình thì phải dùng **đúng view và box đó**, và **${els(truoc).length} phần tử đầu mảng els phải giống hệt cảnh ${k}**, đúng thứ tự, không đổi màu, không xê dịch. Phần mới thêm vào cuối.`);
  if (sau && els(sau)) d.push(`- Cảnh ${k + 2} ngay sau cũng có hình: ${ta(sau)}. Đừng sửa cảnh này theo kiểu làm cảnh ${k + 2} mất khớp với nó.`);
  if (!d.length) d.push('- Các cảnh lân cận không có hình, nên bạn tự do chọn view và box.');
  return d.join('\n');
}

function loiNhacCanh({ script, k, instr, chon, khung, duration, chiHinh }) {
  const sc = script.scenes;
  const ns = nganSach(duration);
  const tongChu = sc.reduce((n, s) => n + String(s.narration || '').length, 0);
  const tongGiay = sc.reduce((n, s) => n + doDai(s), 0);
  const boiCanh = TRUC.map(t => chon[t] && chon[t].cach_lam ? `### ${TRUC_VI[t]}: ${chon[t].ten}\n${chon[t].cach_lam}` : '').filter(Boolean);

  return `Bạn là biên kịch và đạo diễn video bài giảng khổ dọc 9:16 bằng tiếng Việt. Một cảnh của kịch bản dưới đây cần sửa.

## Hợp đồng chung
${khung.cach_lam}

${docVisSpec()}

${boiCanh.length ? `## Bối cảnh\n${boiCanh.join('\n\n')}\n` : ''}
## Cả kịch bản hiện tại
Video tên "${script.title}", ${sc.length} cảnh, thời lượng cho phép ${duration} giây.
${JSON.stringify(script)}

## Cảnh cần sửa
Cảnh số **${k + 1}** (đếm từ 1) trong mảng scenes ở trên.

### Ràng buộc liên tục hình
${rangBuocHinh(sc, k)}

### Ràng buộc thời lượng
Cả video hiện dài khoảng ${Math.round(tongGiay)} giây so với giới hạn ${duration} giây, tổng lời đọc ${tongChu} ký tự so với ngân sách ${ns.kyTu} ký tự.
Máy đọc khoảng 16 ký tự mỗi giây và mỗi cảnh tốn thêm 0,8 giây lặng, nên lời đọc dài ra là video dài ra. ${tongGiay > duration - 2 ? 'Video đang sát hoặc đã vượt giới hạn, nên cảnh này KHÔNG được dài thêm; muốn giảng kỹ hơn thì phải tách bớt chữ ở chính cảnh này cho gọn.' : `Cảnh này còn khoảng ${Math.max(0, Math.round(duration - tongGiay + doDai(sc[k])))} giây là cùng.`}
Nếu yêu cầu của giáo viên là giảng kỹ hơn mà không đủ chỗ, hãy **tách thành nhiều cảnh ngắn nối tiếp** thay vì nhồi một cảnh dài.

## Yêu cầu của giáo viên
"""${instr}"""

${chiHinh
      ? `Trả về DUY NHẤT JSON dạng {"visual": {...}} — chỉ phần hình của cảnh ${k + 1}, giữ nguyên mọi trường khác của cảnh.`
      : `Trả về DUY NHẤT JSON của cảnh ${k + 1} sau khi sửa, gồm các trường type, heading, body, items, formula, visual, narration, duration, và chuyen nếu cần. Không trả về cả kịch bản, chỉ một cảnh.

Nếu phải tách thành nhiều cảnh thì trả về JSON là một MẢNG các cảnh, chúng sẽ thay chỗ cảnh ${k + 1}.`}`;
}

// Chỉ những lỗi MỚI sinh ra do lần sửa này mới tính, không đổ lỗi cũ của kịch bản lên đây.
function loiMoi(truoc, sau) {
  const cu = new Set(truoc.map(khoa));
  return sau.filter(l => !cu.has(khoa(l)));
}

export { loiNhacCanh };

export async function suaCanh({ script, k, instr, axes = {}, duration = 60, model = 'sonnet', effort = '', chiHinh = false, onStep, goi = askJson }) {
  const sc = script.scenes;
  if (!Array.isArray(sc) || !sc[k]) throw Object.assign(new Error('Không có cảnh số ' + (k + 1)), { code: 'bad_scene' });
  const { khung, chon } = pickSkills(axes);
  const calls = [];
  const buoc = s => onStep && onStep(s);

  const lnBase = { script, k, instr, chon, khung, duration, chiHinh };
  buoc(chiHinh ? 'Claude đang vẽ hình' : 'Claude đang sửa cảnh');
  const r = await goi(loiNhacCanh(lnBase), model, chiHinh ? 'Vẽ hình một cảnh' : 'Sửa một cảnh', effort);
  calls.push(...r.calls);

  const ghep = raw => {
    const moi = JSON.parse(JSON.stringify(script));
    if (chiHinh) { moi.scenes[k] = { ...sc[k], visual: (raw && raw.visual !== undefined) ? raw.visual : raw }; return moi; }
    moi.scenes.splice(k, 1, ...(Array.isArray(raw) ? raw : [raw]));
    return moi;
  };

  const truocSua = kiemMay(script, { duration });
  let nhan = r.data;          // phản hồi đang được dùng, vòng sửa có thể thay bằng cái khác
  let moi = ghep(nhan);
  let loi = loiMoi(truocSua, kiemMay(moi, { duration }));
  let vongSua = 0;

  // Một vòng sửa, đúng như lúc viết kịch bản: chỉ lỗi thật và lỗi kỹ thuật máy đo được.
  const canSua = nang(loi);
  if (canSua.length) {
    buoc(`Đang sửa ${canSua.length} lỗi của cảnh vừa làm`);
    vongSua = 1;
    const ds = canSua.map(l => `- ${l.canh ? 'Cảnh ' + l.canh : 'Cả video'}: ${l.tieu_chi}. ${l.van_de}`).join('\n');
    try {
      const f = await goi(`${loiNhacCanh({ ...lnBase, script: moi })}

---
Bạn vừa sửa cảnh ${k + 1} thành như trong kịch bản trên, nhưng lần sửa đó sinh ra các lỗi sau:
${ds}

Hãy làm lại cảnh ${k + 1} cho hết những lỗi đó, vẫn theo đúng yêu cầu của giáo viên.`, model, 'Sửa lại cảnh theo lỗi', effort);
      calls.push(...f.calls);
      const moi2 = ghep(f.data);
      const loi2 = loiMoi(truocSua, kiemMay(moi2, { duration }));
      if (nang(loi2).length <= canSua.length) { moi = moi2; loi = loi2; nhan = f.data; }
    } catch (e) { loi = loi.concat([{ tang: 'may', muc: 'ghi', tieu_chi: 'Không sửa lại được', canh: k + 1, trich_dan: '', van_de: e.message }]); }
  }

  const soCanh = (chiHinh || !Array.isArray(nhan)) ? 1 : nhan.length;
  const canh = moi.scenes.slice(k, k + soCanh);
  return { canh, script: moi, loi, vongSua, calls, usd: calls.reduce((s, c) => s + (c.usd || 0), 0) };
}
