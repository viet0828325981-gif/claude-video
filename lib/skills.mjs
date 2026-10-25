// Nạp skill từ thư mục skills/. Mỗi file khai báo hai thứ: cách làm, và tiêu chí kiểm.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIR = path.join(ROOT, 'skills');
export const TRUC = ['theloai', 'monhoc', 'dangbai', 'trinhdo', 'phongcach'];
export const TRUC_VI = { theloai: 'Thể loại', monhoc: 'Môn học', dangbai: 'Dạng bài', trinhdo: 'Trình độ', phongcach: 'Phong cách' };
const MUC = { chan: 'chan', sua: 'sua', ghi: 'ghi' };
// Rơi về đâu khi không khớp id nào. Không có bảng này thì fallback là phần tử đầu theo
// thứ tự chữ cái, nên bài hình học lạc vào "bài toán có lời văn" và học sinh yếu lạc vào
// "khá giỏi" — âm thầm, không ai biết.
const MAC_DINH = { theloai: 'bai-giang', monhoc: 'chung', dangbai: 'khac', trinhdo: 'trung-binh', phongcach: 'minimal' };

function parse(file, truc) {
  const raw = fs.readFileSync(file, 'utf8');
  const fm = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(raw);
  const meta = {};
  if (fm) for (const line of fm[1].split(/\r?\n/)) {
    const m = /^(\w+):\s*(.*)$/.exec(line.trim()); if (m) meta[m[1]] = m[2];
  }
  const body = fm ? raw.slice(fm[0].length) : raw;
  const parts = {};
  for (const chunk of body.split(/^## /m).slice(1)) {
    const nl = chunk.indexOf('\n');
    parts[chunk.slice(0, nl < 0 ? chunk.length : nl).trim()] = nl < 0 ? '' : chunk.slice(nl + 1).trim();
  }
  const sec = s => parts[s] || '';
  const cach_lam = sec('Cách làm');
  const tieu_chi = sec('Tiêu chí kiểm').split(/\r?\n/)
    .map(l => /^-\s*\[(chan|sua|ghi)\]\s*(.+)$/.exec(l.trim()))
    .filter(Boolean).map(m => ({ muc: MUC[m[1]], noi_dung: m[2].trim() }));
  // Tiêu chí nhìn: câu hỏi chỉ trả lời được khi mở ảnh khung hình ra xem, nên không có
  // mức chan/sua/ghi và không đi vào vòng sửa tự động — chỉ agent có mắt mới dùng tới.
  const tieu_chi_nhin = sec('Tiêu chí nhìn').split(/\r?\n/)
    .map(l => /^-\s*(.+)$/.exec(l.trim())).filter(Boolean).map(m => m[1].trim());
  return { id: meta.id || path.basename(file, '.md'), ten: meta.ten || meta.id, mo_ta: meta.mo_ta || '', template: meta.template || '', truc, cach_lam, tieu_chi, tieu_chi_nhin };
}

let cache = null, stamp = 0;
export function loadSkills() {
  // Đọc lại khi file đổi, để sửa skill là có hiệu lực ngay, không cần khởi động lại.
  let newest = 0;
  const files = [];
  const walk = d => { for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p); else if (f.name.endsWith('.md')) { files.push(p); newest = Math.max(newest, fs.statSync(p).mtimeMs); } } };
  walk(DIR);
  if (cache && newest === stamp) return cache;
  const khung = parse(path.join(DIR, '_khung.md'), '_khung');
  const truc = Object.fromEntries(TRUC.map(t => [t, []]));
  for (const f of files) {
    const t = path.basename(path.dirname(f));
    if (TRUC.includes(t)) truc[t].push(parse(f, t));
  }
  for (const t of TRUC) truc[t].sort((a, b) => a.id.localeCompare(b.id));
  stamp = newest; cache = { khung, truc };
  return cache;
}

export function pickSkills(axes) {
  const { khung, truc } = loadSkills();
  const chon = {};
  for (const t of TRUC) {
    const list = truc[t];
    chon[t] = list.find(s => s.id === axes[t]) || list.find(s => s.id === MAC_DINH[t]) || list[0] || null;
  }
  return { khung, chon };
}

// Danh mục rút gọn để Claude chọn trục.
export function catalogue() {
  const { truc } = loadSkills();
  return TRUC.map(t => `${t}: ` + truc[t].map(s => `"${s.id}" (${s.ten} — ${s.mo_ta})`).join(', ')).join('\n');
}
