// Đo liên tục hình: bộ dựng giữ nguyên phần hình trùng khớp giữa hai cảnh liên tiếp,
// nên "hình có sống suốt video không" là một con số đếm được, không phải ý kiến.
//
// Tiền tố khớp = hai cảnh cùng view, và cảnh sau lặp lại y hệt toàn bộ els
// của cảnh trước ở đầu mảng. Phá một trong ba điều đó là cả hình vẽ lại.

const eq = (a, b) => JSON.stringify(a === undefined ? null : a) === JSON.stringify(b === undefined ? null : b);
const elsOf = s => (s && s.visual && Array.isArray(s.visual.els) && s.visual.els.length) ? s.visual.els : null;

// Tỉ lệ bao nhiêu phần trăm els của cảnh trước được lặp lại, để phân biệt
// "đứt vì đổi khung" với "cảnh sau là một hình hoàn toàn khác".
function soSanh(truoc, sau) {
  const a = elsOf(truoc), b = elsOf(sau);
  if (!a || !b) return null;
  // Chỉ so `view`. Bộ dựng đã bỏ `box`, nên hai cảnh khác `box` vẫn vẽ liền mạch —
  // so cả `box` là báo oan những kịch bản viết từ trước.
  const khungGiong = eq(truoc.visual.view, sau.visual.view);
  let k = 0;
  while (k < a.length && k < b.length && eq(a[k], b[k])) k++;
  return {
    khungGiong, khop: k, daiTruoc: a.length, daiSau: b.length,
    noi: khungGiong && k === a.length,
    themMoi: b.length - k,
    tiLeGiuLai: a.length ? k / a.length : 1
  };
}

export function doLienTuc(script) {
  const sc = (script && Array.isArray(script.scenes)) ? script.scenes : [];
  const cap = [];
  for (let i = 1; i < sc.length; i++) {
    const r = soSanh(sc[i - 1], sc[i]);
    if (r) cap.push({ truoc: i, sau: i + 1, ...r });
  }
  const noi = cap.filter(c => c.noi).length;
  const coHinh = sc.filter(s => elsOf(s)).length;
  return {
    cap, soCap: cap.length, soNoi: noi,
    tiLeNoi: cap.length ? noi / cap.length : null,
    soCanhCoHinh: coHinh,
    themMoiLonNhat: cap.reduce((m, c) => Math.max(m, c.themMoi), 0),
    // els có đơn điệu tăng không: hình teo lại giữa chừng gần như luôn là tai nạn
    tangDan: cap.every(c => c.daiSau >= c.daiTruoc)
  };
}

const MIN_CAP = 3;      // dưới ba cặp thì "đa số" không có nghĩa gì
const NGUONG_NOI = 0.6; // video giữ liên tục từ mức này trở lên thì chỗ đứt là tai nạn
const THEM_TOI_DA = 6;  // thêm nhiều hơn chừng này trong một cảnh thì lời không theo kịp hình

// Trả về mảng lỗi cùng dạng với kiemMay. Mức được chọn theo bằng chứng, không theo cảm tính:
// chỉ khi chính video này giữ liên tục ở đa số các cặp thì một chỗ đứt mới là lỗi phải sửa.
export function kiemLienTuc(script) {
  const loi = [];
  const them = (tieu_chi, muc, canh, trich_dan, van_de) =>
    loi.push({ tang: 'may', tieu_chi, muc, canh, trich_dan, van_de });

  const d = doLienTuc(script);
  if (!d.soCap) return loi;

  const dut = d.cap.filter(c => !c.noi);
  const dayDuBangChung = d.soCap >= MIN_CAP && d.tiLeNoi >= NGUONG_NOI;

  for (const c of dut) {
    const vi = c.khungGiong
      ? `cảnh ${c.sau} chỉ giữ lại ${c.khop}/${c.daiTruoc} phần tử của cảnh ${c.truoc}`
      : `canh ${c.truoc}`;
    const van_de = dayDuBangChung
      ? `Video này giữ hình liên tục ở ${d.soNoi}/${d.soCap} chỗ nhưng đứt ở đây: ${vi}. Cả hình sẽ vẽ lại, người xem phải định vị lại từ đầu.`
      : `${vi}, nên cả hình vẽ lại ở ranh giới này.`;
    them('Hình bị vẽ lại giữa chừng', dayDuBangChung ? 'sua' : 'ghi', c.sau,
      `view ${JSON.stringify(c.khungGiong ? 'giữ nguyên' : 'đổi')}, tiền tố khớp ${c.khop}/${c.daiTruoc}`, van_de);
  }

  if (!d.tangDan) {
    const teo = d.cap.filter(c => c.daiSau < c.daiTruoc)
      .map(c => `cảnh ${c.sau} (${c.daiTruoc} xuống ${c.daiSau})`).join(', ');
    them('Hình teo lại giữa chừng', 'ghi', null, teo,
      `Số phần tử của hình giảm đi ở ${teo}. Hình đang lớn dần thì không nên bớt phần tử.`);
  }

  for (const c of d.cap) if (c.themMoi > THEM_TOI_DA)
    them('Một cảnh thêm quá nhiều vào hình', 'ghi', c.sau, `thêm ${c.themMoi} phần tử`,
      `Cảnh ${c.sau} thêm ${c.themMoi} phần tử cùng lúc, quá ${THEM_TOI_DA}. Một câu lời đọc không kịp dẫn chừng đó nét.`);

  return loi;
}
