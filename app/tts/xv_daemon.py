#!/usr/bin/env python3
"""Bộ đọc giọng thường trực cho bản local của Xưởng Video Bài Giảng.
Nạp VieNeu một lần rồi nhận yêu cầu qua stdin, mỗi dòng một JSON:
  {"ids": [...], "jobs_dir": "...", "out_dir": "..."}
Trả về stdout mỗi job một dòng JSON {id, ok, wav, voice, seconds, basis, script} hoặc {id, ok:false, error},
rồi {"done": true}. Cách ghép cảnh giống xv_worker.py (bản cloud), nhưng ghi WAV nên không cần ffmpeg."""
import hashlib, json, os, re, sys, time

LEAD, TAIL = 0.35, 0.45
_model = None

# Tên điểm và đoạn thẳng viết hoa phải đọc tên từng chữ cái, không đọc thành từ:
# "MA" là "mờ a" chứ không phải từ "ma", "MAOB" là "mờ a o bê".
TEN_CHU = {
    'A': 'a', 'B': 'bê', 'C': 'xê', 'D': 'dê', 'E': 'e', 'F': 'ép', 'G': 'giê',
    'H': 'hát', 'I': 'i', 'J': 'gi', 'K': 'ca', 'L': 'lờ', 'M': 'mờ', 'N': 'nờ',
    'O': 'o', 'P': 'pê', 'Q': 'quy', 'R': 'rờ', 'S': 'ét', 'T': 'tê', 'U': 'u',
    'V': 'vê', 'W': 'vê kép', 'X': 'ích', 'Y': 'i dài', 'Z': 'dét',
}
_HOA = re.compile(r'(?<![0-9A-Za-zÀ-ỹ])[A-Z]{1,6}(?![0-9A-Za-zÀ-ỹ])')

def doc_ten_diem(text):
    """Đổi cụm chữ in hoa đứng riêng thành tên chữ cái đọc được."""
    return _HOA.sub(lambda m: ' '.join(TEN_CHU[c] for c in m.group(0)), text or '')


# Kho giọng theo từng cảnh: khoá là giọng cộng lời đọc, nên sửa một cảnh chỉ phải đọc lại cảnh đó.
def _khoa(voice, text):
    return hashlib.sha1((voice + '\x00' + text).encode('utf-8')).hexdigest()

def _lay_kho(kho, k):
    # Cất bằng int16 cho nhẹ đĩa; cả track sẽ chuẩn hoá biên độ lại sau nên không nghe ra khác biệt.
    import numpy as np
    p = os.path.join(kho, k + '.i16')
    try:
        return np.fromfile(p, dtype='<i2').astype(np.float32) / 32767.0 if os.path.exists(p) else None
    except Exception:
        return None

def _cat_kho(kho, k, a):
    import numpy as np
    try:
        os.makedirs(kho, exist_ok=True)
        tam = os.path.join(kho, k + '.tmp')
        np.clip(a * 32767.0, -32768, 32767).astype('<i2').tofile(tam)
        os.replace(tam, os.path.join(kho, k + '.i16'))
    except Exception:
        pass
# stdout chỉ dành cho giao thức; mọi thứ thư viện in ra đi sang stderr.
for s in (sys.stdin, sys.stdout, sys.stderr): s.reconfigure(encoding='utf-8', errors='replace')
OUT = sys.stdout; sys.stdout = sys.stderr

def emit(o):
    OUT.write(json.dumps(o, ensure_ascii=False) + '\n'); OUT.flush()

def model():
    global _model
    if _model is None:
        from vieneu import Vieneu
        prec = os.environ.get('XV_PREC', 'int8')
        emit({'log': f'Đang nạp VieNeu ({prec}), lần đầu sẽ tải mô hình...'})
        t0 = time.time()
        v = Vieneu(precision=prec) if prec != 'fp32' else Vieneu()
        _model = (v, {n for _, n in v.list_preset_voices()})
        emit({'log': f'Đã nạp VieNeu sau {time.time() - t0:.0f}s'})
    return _model

def synth_one(jobs_dir, out_dir, jid):
    import numpy as np, soundfile as sf
    v, valid = model(); sr = v.sample_rate
    job = json.load(open(os.path.join(jobs_dir, jid + '.json'), encoding='utf-8'))
    voice = (job.get('tts') or {}).get('voice') or job.get('voice') or 'Ngọc Huyền'
    if voice not in valid: voice = 'Ngọc Huyền'
    kho = os.path.join(os.path.dirname(os.path.abspath(out_dir)), 'giong-cache')
    track, basis, dung_lai, doc_moi = [], [], 0, 0
    for s in job['script']['scenes']:
        text = (s.get('narration') or '').strip(); dur = float(s.get('duration') or 4)
        doc = doc_ten_diem(text)  # chỉ đổi lúc đọc, narration gốc giữ nguyên cho basis và cho màn hình
        if doc:
            k = _khoa(voice, doc)
            a = _lay_kho(kho, k)
            if a is None:
                a = np.asarray(v.infer(doc, voice=voice), dtype=np.float32).reshape(-1)
                _cat_kho(kho, k, a); doc_moi += 1
            else:
                dung_lai += 1
        else:
            a = np.zeros(0, np.float32)
        if text and LEAD + len(a) / sr + TAIL > dur: dur = round(LEAD + len(a) / sr + TAIL + 0.05, 1)
        seg = np.zeros(int(round(dur * sr)), np.float32); st = int(LEAD * sr)
        n = min(len(a), max(0, len(seg) - st)); seg[st:st + n] = a[:n]
        track.append(seg); s['duration'] = dur; basis.append({'n': s.get('narration') or '', 'd': dur})
    audio = np.concatenate(track) if track else np.zeros(sr, np.float32)
    pk = float(np.max(np.abs(audio))) or 1.0
    audio = audio * (0.89 / pk)
    wav = os.path.join(out_dir, jid + '.wav')
    sf.write(wav, audio, sr, subtype='PCM_16')
    return {'id': jid, 'ok': True, 'wav': wav, 'voice': voice, 'seconds': round(len(audio) / sr, 2),
            'basis': basis, 'script': job['script'], 'doc_moi': doc_moi, 'dung_lai': dung_lai}

def main():
    for line in sys.stdin:
        line = line.strip()
        if not line: continue
        try: req = json.loads(line)
        except Exception: continue
        os.makedirs(req['out_dir'], exist_ok=True)
        for jid in req.get('ids', []):
            t0 = time.time()
            try:
                r = synth_one(req['jobs_dir'], req['out_dir'], jid)
                emit({'log': f"{jid}: {r['voice']}, {r['seconds']}s audio, đọc mới {r['doc_moi']} cảnh, "
                             f"lấy lại {r['dung_lai']} cảnh, mất {time.time() - t0:.0f}s"}); emit(r)
            except Exception as e:
                emit({'id': jid, 'ok': False, 'error': f'{type(e).__name__}: {e}'})
        emit({'done': True})

if __name__ == '__main__':
    main()
