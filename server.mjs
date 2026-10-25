// Xưởng Video Bài Giảng — bản chạy local.
// Phục vụ app/web/studio.html và thay các capability của Artifact bằng API local:
//   sample -> Claude Code CLI (đăng nhập bằng tài khoản Claude), db -> data/jobs/*.json + SSE,
//   assets -> data/assets, mcp fire_trigger -> bộ đọc VieNeu (app/tts/xv_daemon.py) chạy thường trực.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runClaude, extractJson, MODELS } from './lib/claude.mjs';
import { chayPipeline, docDetail, xoaDetail } from './lib/pipeline.mjs';
import { suaCanh } from './lib/canh.mjs';
import { loadSkills, TRUC, TRUC_VI } from './lib/skills.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8790);
const DATA = path.join(ROOT, 'data');
const JOBS_DIR = path.join(DATA, 'jobs');
const ASSETS_DIR = path.join(DATA, 'assets');
const TTS_OUT = path.join(DATA, 'tts_out');
const CLAUDE_CWD = path.join(DATA, 'claude-cwd');
const PYTHON = process.env.XV_PYTHON || path.join(ROOT, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
for (const d of [JOBS_DIR, ASSETS_DIR, TTS_OUT, CLAUDE_CWD]) fs.mkdirSync(d, { recursive: true });

const log = (...a) => console.log(new Date().toLocaleTimeString('vi-VN'), ...a);

/* ---------------- page ---------------- */
const FONTS = [['Be Vietnam Pro', 400, 'BeVietnamPro-Regular'], ['Be Vietnam Pro', 600, 'BeVietnamPro-SemiBold'], ['Be Vietnam Pro', 700, 'BeVietnamPro-Bold'],
  ['Be Vietnam Pro', 800, 'BeVietnamPro-ExtraBold'], ['IBM Plex Mono', 500, 'IBMPlexMono-Medium'], ['Patrick Hand', 400, 'PatrickHand-Regular']];
const FONT_CSS = '<style>' + FONTS.map(([f, w, n]) => `@font-face{font-family:'${f}';font-weight:${w};font-display:swap;src:url(/fonts/${n}.ttf) format('truetype')}`).join('') + '</style>';
function pageHtml() {
  let h = fs.readFileSync(path.join(ROOT, 'app/web/studio.html'), 'utf8');
  h = h.replace(/<link rel="preconnect"[^>]*>\s*/g, '')
    .replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/, FONT_CSS)
    .replace('https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/build/mp4-muxer.js', '/vendor/mp4-muxer.js')
    // local-shim.js phải nạp trước mã của trang, nên neo vào thẻ vendor đầu tiên.
    .replace('<script src="/vendor/mp4-muxer.js">', '<script src="/local-shim.js"></script>\n<script src="/vendor/mp4-muxer.js">');
  return h + '\n<script src="/local-ui.js"></script>\n'; // studio.html không có thẻ </body>, nối vào cuối
}
const STATIC = {
  '/local-shim.js': [path.join(ROOT, 'local-shim.js'), 'text/javascript; charset=utf-8'],
  '/local-ui.js': [path.join(ROOT, 'local-ui.js'), 'text/javascript; charset=utf-8'],
  '/vendor/mp4-muxer.js': [path.join(ROOT, 'app/test/vendor/mp4-muxer.js'), 'text/javascript; charset=utf-8'],
};

/* ---------------- db ---------------- */
const jobs = new Map();
for (const f of fs.readdirSync(JOBS_DIR)) if (f.endsWith('.json')) {
  try { jobs.set(f.slice(0, -5), JSON.parse(fs.readFileSync(path.join(JOBS_DIR, f), 'utf8'))); } catch (e) { log('Bỏ qua job hỏng', f); }
}
const safeId = id => /^[\w.-]{1,128}$/.test(id) ? id : null;
const jobFile = id => path.join(JOBS_DIR, id + '.json');
const clients = new Set();
const steps = new Map(); // jobId -> bước pipeline đang chạy, để trang hiện tiến độ
function broadcast(changes, origin) {
  const msg = `data: ${JSON.stringify({ changes, origin })}\n\n`;
  for (const c of clients) c.write(msg);
}
function putJob(id, data, origin) {
  const type = jobs.has(id) ? 'modified' : 'added';
  jobs.set(id, data);
  fs.writeFileSync(jobFile(id), JSON.stringify(data));
  broadcast([{ type, id, data }], origin);
}
function delJob(id, origin) {
  if (!jobs.has(id)) return;
  jobs.delete(id); fs.rmSync(jobFile(id), { force: true }); xoaDetail(id);
  broadcast([{ type: 'removed', id, data: null }], origin);
}

/* ---------------- assets ---------------- */
const newId = () => crypto.randomBytes(16).toString('hex');
const assetPath = id => /^[0-9a-f]{32}$/.test(id) ? path.join(ASSETS_DIR, id) : null;
function serveAsset(req, res, id) {
  const p = assetPath(id);
  if (!p || !fs.existsSync(p)) return send(res, 404, 'not found');
  let type = 'application/octet-stream';
  try { type = fs.readFileSync(p + '.type', 'utf8').trim() || type; } catch (e) {}
  const size = fs.statSync(p).size;
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
  if (m) {
    const start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
    const end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
    return fs.createReadStream(p, { start, end }).pipe(res);
  }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes' });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(p).pipe(res);
}
function saveAsset(req, res) {
  const id = newId(), p = path.join(ASSETS_DIR, id);
  const out = fs.createWriteStream(p);
  req.pipe(out);
  out.on('finish', () => { fs.writeFileSync(p + '.type', req.headers['content-type'] || 'application/octet-stream'); send(res, 200, { id, url: '/_blob/' + id }); });
  out.on('error', e => send(res, 500, { code: 'write_failed', message: e.message }));
}
function removeAsset(id) { const p = assetPath(id); if (p) { fs.rmSync(p, { force: true }); fs.rmSync(p + '.type', { force: true }); } }

/* ---------------- voice (VieNeu daemon) ---------------- */
let daemon = null, daemonBuf = '', daemonWaiters = [], ttsBusy = false, ttsAgain = false;
function getDaemon() {
  if (daemon) return daemon;
  if (!fs.existsSync(PYTHON)) throw new Error('Chưa cài môi trường giọng đọc (.venv). Chạy cai-dat.bat.');
  const env = { ...process.env, HF_HOME: path.join(ROOT, '.cache', 'hf'), PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', HF_HUB_DISABLE_SYMLINKS_WARNING: '1' };
  daemon = spawn(PYTHON, [path.join(ROOT, 'app/tts/xv_daemon.py')], { cwd: ROOT, env, windowsHide: true });
  daemon.stdout.setEncoding('utf8');
  daemon.stdout.on('data', d => {
    daemonBuf += d; let i;
    while ((i = daemonBuf.indexOf('\n')) >= 0) {
      const line = daemonBuf.slice(0, i).trim(); daemonBuf = daemonBuf.slice(i + 1);
      if (!line) continue;
      let m; try { m = JSON.parse(line); } catch (e) { log('[tts]', line); continue; }
      if (m.log) { log('[tts]', m.log); continue; }
      const w = daemonWaiters[0]; if (!w) continue;
      if (m.done) { daemonWaiters.shift(); w.resolve(w.results); } else w.results.push(m);
    }
  });
  daemon.stderr.setEncoding('utf8');
  daemon.stderr.on('data', d => process.stderr.write('[tts] ' + d));
  daemon.on('close', code => {
    log('[tts] bộ đọc dừng, mã', code); daemon = null;
    for (const w of daemonWaiters.splice(0)) w.reject(new Error('Bộ đọc giọng dừng đột ngột (mã ' + code + ').'));
  });
  return daemon;
}
function synth(ids) {
  return new Promise((resolve, reject) => {
    const d = getDaemon();
    daemonWaiters.push({ resolve, reject, results: [] });
    d.stdin.write(JSON.stringify({ ids, jobs_dir: JOBS_DIR, out_dir: TTS_OUT }) + '\n');
  });
}
async function runTTS() {
  if (ttsBusy) { ttsAgain = true; return; }
  ttsBusy = true;
  try {
    do {
      ttsAgain = false;
      const now = Date.now();
      const sel = [...jobs.entries()].filter(([, j]) => j.tts && (j.tts.status === 'requested' || (j.tts.status === 'processing' && now - (j.tts.startedAt || 0) > 20 * 60000)) && j.script).map(([id]) => id);
      if (!sel.length) break;
      for (const id of sel) { const j = jobs.get(id); putJob(id, { ...j, tts: { ...j.tts, status: 'processing', startedAt: now }, updatedAt: now }, 'server'); }
      log('[tts] đọc giọng cho', sel.join(', '));
      let results;
      try { results = await synth(sel); }
      catch (e) { results = sel.map(id => ({ id, ok: false, error: e.message })); }
      for (const r of results) {
        const j = jobs.get(r.id);
        if (!j || !j.tts || j.tts.status !== 'processing') { if (r.wav) fs.rmSync(r.wav, { force: true }); continue; }
        const t = Date.now();
        if (r.ok) {
          const aid = newId();
          fs.renameSync(r.wav, path.join(ASSETS_DIR, aid)); fs.writeFileSync(path.join(ASSETS_DIR, aid + '.type'), 'audio/wav');
          if (j.tts.audioId) removeAsset(j.tts.audioId);
          putJob(r.id, { ...j, script: r.script, voice: r.voice, tts: { voice: r.voice, basis: r.basis, seconds: r.seconds, requestedAt: j.tts.requestedAt, status: 'ready', audioId: aid, readyAt: t }, updatedAt: t }, 'server');
          log('[tts] xong', r.id, r.voice, r.seconds + 's');
        } else {
          putJob(r.id, { ...j, tts: { status: 'error', voice: j.tts.voice, note: String(r.error || 'lỗi').slice(0, 300) }, updatedAt: t }, 'server');
          log('[tts] lỗi', r.id, r.error);
        }
      }
    } while (ttsAgain);
  } finally { ttsBusy = false; }
}

/* ---------------- http ---------------- */
function send(res, code, body) {
  if (res.headersSent) return;
  const isObj = typeof body === 'object';
  res.writeHead(code, { 'Content-Type': isObj ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(isObj ? JSON.stringify(body) : String(body));
}
const readJson = req => new Promise((resolve, reject) => {
  let s = ''; req.setEncoding('utf8'); req.on('data', d => s += d);
  req.on('end', () => { try { resolve(s ? JSON.parse(s) : {}); } catch (e) { reject(e); } }); req.on('error', reject);
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const p = decodeURIComponent(url.pathname);
  try {
    if (req.method === 'GET' && (p === '/' || p === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(pageHtml());
    }
    if (req.method === 'GET' && STATIC[p]) {
      res.writeHead(200, { 'Content-Type': STATIC[p][1] });
      return fs.createReadStream(STATIC[p][0]).pipe(res);
    }
    if (req.method === 'GET' && p.startsWith('/fonts/') && /^[\w-]+\.ttf$/.test(p.slice(7))) {
      res.writeHead(200, { 'Content-Type': 'font/ttf', 'Cache-Control': 'max-age=86400' });
      return fs.createReadStream(path.join(ROOT, 'app/test/fonts', p.slice(7))).pipe(res);
    }
    if ((req.method === 'GET' || req.method === 'HEAD') && p.startsWith('/_blob/')) return serveAsset(req, res, p.slice(7));
    if (p === '/api/assets' && req.method === 'POST') return saveAsset(req, res);
    if (p.startsWith('/api/assets/') && req.method === 'DELETE') { removeAsset(p.slice(12)); return send(res, 200, { ok: true }); }

    if (p === '/api/db/jobs/stream') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
      res.write(`retry: 2000\ndata: ${JSON.stringify({ changes: [...jobs].map(([id, data]) => ({ type: 'added', id, data })), origin: 'init' })}\n\n`);
      clients.add(res);
      const ping = setInterval(() => res.write(': ping\n\n'), 25000);
      req.on('close', () => { clients.delete(res); clearInterval(ping); });
      return;
    }
    const dm = /^\/api\/db\/jobs\/([^/]+)$/.exec(p);
    if (dm) {
      const id = safeId(dm[1]); if (!id) return send(res, 400, { code: 'bad_id' });
      if (req.method === 'GET') return send(res, 200, { data: jobs.get(id) || null });
      if (req.method === 'DELETE') { delJob(id, url.searchParams.get('client')); return send(res, 200, { ok: true }); }
      const b = await readJson(req);
      if (req.method === 'PUT') putJob(id, b.data, b.client);
      else if (req.method === 'PATCH') putJob(id, { ...(jobs.get(id) || {}), ...b.data }, b.client);
      return send(res, 200, { ok: true });
    }

    if (p === '/api/sample' && req.method === 'POST') {
      const b = await readJson(req);
      const model = MODELS[b.modelTier] || MODELS.default;
      if (b.kind === 'script' && b.request) {
        log('[pipeline]', b.che === 'ky' ? 'KỸ' : 'nhanh', model, '·', String(b.request).slice(0, 60));
        try {
          const { script, detail, template } = await chayPipeline({
            request: String(b.request), duration: Number(b.duration) || 30, modelTier: b.modelTier, jobId: b.jobId, chonTay: b.truc || {},
            che: b.che === 'ky' ? 'ky' : 'nhanh',
            onStep: s => { if (b.jobId) steps.set(b.jobId, s); log('[pipeline]', s); }
          });
          log('[pipeline] xong', (detail.ms / 1000).toFixed(0) + 's ·', `${detail.con_chan} chặn, ${detail.con_sua} sửa, ${detail.con_ghi} ghi nhận`);
          return send(res, 200, { data: script, template });
        } finally { if (b.jobId) steps.delete(b.jobId); }
      }
      // Sửa cảnh và vẽ hình cũng đi qua skill, hợp đồng chung và lớp kiểm, không gọi thẳng Claude nữa.
      if ((b.kind === 'canh' || b.kind === 'hinh') && b.script) {
        const k = Number(b.canh) || 0;
        log('[canh]', b.kind === 'hinh' ? 'vẽ hình' : 'sửa cảnh', model, '· cảnh', k + 1, '·', String(b.instr || '').slice(0, 50));
        try {
          const r = await suaCanh({
            script: b.script, k, instr: String(b.instr || ''), axes: b.truc || {},
            duration: Number(b.duration) || 60, model, chiHinh: b.kind === 'hinh',
            onStep: s => { if (b.jobId) steps.set(b.jobId, s); log('[canh]', s); }
          });
          const nang = r.loi.filter(x => x.muc === 'chan' || (x.muc === 'sua' && x.tang === 'may'));
          log('[canh] xong ·', r.vongSua ? 'có sửa lại ·' : '', nang.length ? nang.length + ' lỗi còn lại' : 'không lỗi mới');
          const data = b.kind === 'hinh' ? { visual: r.canh[0].visual } : (r.canh.length > 1 ? r.canh : r.canh[0]);
          return send(res, 200, { data, loi: r.loi });
        } finally { if (b.jobId) steps.delete(b.jobId); }
      }
      const t0 = Date.now(); log('[claude]', model, '…');
      const r = await runClaude(String(b.prompt || ''), model);
      log('[claude] xong sau', ((Date.now() - t0) / 1000).toFixed(0) + 's');
      return send(res, 200, b.raw ? { text: r.text } : { data: extractJson(r.text) });
    }
    if (req.method === 'GET' && p === '/api/skills') {
      const { truc } = loadSkills();
      return send(res, 200, { ten: TRUC_VI, truc: Object.fromEntries(TRUC.map(t => [t, truc[t].map(s => ({ id: s.id, ten: s.ten, mo_ta: s.mo_ta }))])) });
    }
    if (req.method === 'GET' && p.startsWith('/api/detail/')) return send(res, 200, { detail: docDetail(p.slice(12)) });
    if (req.method === 'GET' && p.startsWith('/api/step/')) return send(res, 200, { step: steps.get(p.slice(10)) || '' });
    if (p === '/api/tts/run' && req.method === 'POST') {
      await readJson(req).catch(() => ({}));
      try { getDaemon(); } catch (e) { return send(res, 500, { code: 'server_not_connected', message: e.message }); }
      runTTS().catch(e => log('[tts] lỗi', e));
      return send(res, 200, { ok: true });
    }
    send(res, 404, 'not found');
  } catch (e) {
    log('Lỗi', p, e.message);
    send(res, 500, { code: e.code || 'error', message: e.message });
  }
});
server.listen(PORT, '127.0.0.1', () => {
  log(`Xưởng Video đang chạy: http://localhost:${PORT}`);
  // Yêu cầu giọng đọc còn dở từ lần chạy trước
  if ([...jobs.values()].some(j => j.tts && (j.tts.status === 'requested' || j.tts.status === 'processing')) && fs.existsSync(PYTHON)) {
    for (const [id, j] of jobs) if (j.tts && j.tts.status === 'processing') jobs.set(id, { ...j, tts: { ...j.tts, status: 'requested' } });
    runTTS().catch(e => log('[tts] lỗi', e));
  }
});
