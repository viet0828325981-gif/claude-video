// Gọi Claude Code CLI một lượt, không phiên, không công cụ.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const CLAUDE_BIN = process.env.CLAUDE_BIN || path.join(ROOT, 'node_modules', '@anthropic-ai', 'claude-code', 'bin', process.platform === 'win32' ? 'claude.exe' : 'claude');
const CWD = path.join(ROOT, 'data', 'claude-cwd');
export const MODELS = { quick: 'haiku', default: 'sonnet', complex: 'opus' };
const JSON_ONLY = 'Bạn là bộ não của công cụ dựng video bài giảng. Chỉ trả lời bằng đúng một giá trị JSON hợp lệ theo yêu cầu, không markdown, không giải thích, không rào đón.';

export function runClaude(prompt, model = 'sonnet', timeoutMs = 15 * 60000, effort = '') {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(CLAUDE_BIN)) return reject(Object.assign(new Error('Chưa cài Claude Code CLI. Chạy cai-dat.bat.'), { code: 'no_cli' }));
    fs.mkdirSync(CWD, { recursive: true });
    const args = ['-p', '--output-format', 'json', '--model', model, '--tools', '',
      '--no-session-persistence', '--strict-mcp-config', '--setting-sources', '', '--append-system-prompt', JSON_ONLY];
    if (effort) args.push('--effort', effort);
    const p = spawn(CLAUDE_BIN, args, { cwd: CWD, windowsHide: true });
    let out = '', errs = '';
    const timer = setTimeout(() => { p.kill(); reject(Object.assign(new Error('Claude trả lời quá lâu.'), { code: 'timeout' })); }, timeoutMs);
    p.stdout.on('data', d => out += d); p.stderr.on('data', d => errs += d);
    p.on('error', e => { clearTimeout(timer); reject(e); });
    p.on('close', () => {
      clearTimeout(timer);
      let j; try { j = JSON.parse(out); } catch (e) { return reject(new Error('Claude CLI lỗi: ' + (errs || out).slice(0, 400))); }
      if (j.is_error) {
        const msg = String(j.result || 'lỗi');
        const login = /login|logged in/i.test(msg);
        return reject(Object.assign(new Error(login ? 'Claude CLI chưa đăng nhập. Chạy dang-nhap-claude.bat một lần.' : 'Claude: ' + msg), { code: login ? 'not_logged_in' : 'claude_error' }));
      }
      resolve({ text: String(j.result || ''), usd: j.total_cost_usd || 0, ms: j.duration_ms || 0 });
    });
    p.stdin.end(prompt);
  });
}

export function extractJson(text) {
  const t = String(text).replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  try { return JSON.parse(t); } catch (e) {}
  const starts = [t.indexOf('{'), t.indexOf('[')].filter(i => i >= 0);
  const s = Math.min(...starts), e = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
  if (starts.length && e > s) return JSON.parse(t.slice(s, e + 1));
  throw new Error('Claude không trả về JSON hợp lệ.');
}

// Gọi và ép ra JSON, thử lại một lần nếu định dạng hỏng.
export async function askJson(prompt, model, label, effort = '') {
  const calls = [];
  for (let i = 0; i < 2; i++) {
    const r = await runClaude(i ? prompt + '\n\nLần trước bạn trả về sai định dạng. Chỉ trả về JSON, không gì khác.' : prompt, model, undefined, effort);
    calls.push({ label: label + (i ? ' (thử lại)' : ''), model, effort: effort || 'mặc định', ms: r.ms, usd: r.usd, chars: r.text.length });
    try { return { data: extractJson(r.text), calls }; }
    catch (e) { if (i) throw Object.assign(e, { calls }); }
  }
}
