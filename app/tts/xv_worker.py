#!/usr/bin/env python3
"""Voice worker for Xưởng Video Bài Giảng.
  synth:    xv_worker.py synth <jobs_dir> <out_dir> <job_id> [job_id ...]
            -> <out_dir>/<id>.webm + <out_dir>/<id>.patch.json
  finalize: xv_worker.py finalize <out_dir> <upd_dir> <id>=<asset_id> [...]
            -> <upd_dir>/<id>.json (the update for ArtifactData)"""
import json, os, subprocess, sys, time

LEAD, TAIL = 0.35, 0.45

def synth(jobs_dir, out_dir, ids):
    import numpy as np
    from vieneu import Vieneu
    os.makedirs(out_dir, exist_ok=True)
    prec = os.environ.get('XV_PREC', 'int8')
    v = Vieneu(precision=prec) if prec != 'fp32' else Vieneu(); sr = v.sample_rate
    valid = {n for _, n in v.list_preset_voices()}
    for jid in ids:
        t0 = time.time()
        try:
            job = json.load(open(os.path.join(jobs_dir, jid + '.json'), encoding='utf-8'))
            voice = (job.get('tts') or {}).get('voice') or job.get('voice') or 'Ngọc Huyền'
            if voice not in valid: voice = 'Ngọc Huyền'
            track, basis = [], []
            for s in job['script']['scenes']:
                text = (s.get('narration') or '').strip(); dur = float(s.get('duration') or 4)
                a = np.asarray(v.infer(text, voice=voice), dtype=np.float32) if text else np.zeros(0, np.float32)
                if text and LEAD + len(a) / sr + TAIL > dur: dur = round(LEAD + len(a) / sr + TAIL + 0.05, 1)
                seg = np.zeros(int(round(dur * sr)), np.float32); st = int(LEAD * sr)
                n = min(len(a), max(0, len(seg) - st)); seg[st:st + n] = a[:n]
                track.append(seg); s['duration'] = dur; basis.append({'n': s.get('narration') or '', 'd': dur})
            audio = np.concatenate(track); pk = float(np.max(np.abs(audio))) or 1.0
            audio = audio * (0.89 / pk)
            raw = os.path.join(out_dir, jid + '.f32'); audio.astype('<f4').tofile(raw)
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(sr), '-ac', '1', '-i', raw,
                            '-c:a', 'libopus', '-b:a', '64k', os.path.join(out_dir, jid + '.webm')], check=True)
            os.remove(raw)
            json.dump({'script': job['script'], 'tts': {'voice': voice, 'basis': basis, 'seconds': round(len(audio) / sr, 2),
                       'requestedAt': (job.get('tts') or {}).get('requestedAt')}},
                      open(os.path.join(out_dir, jid + '.patch.json'), 'w', encoding='utf-8'), ensure_ascii=False)
            print(f"OK\t{jid}\t{voice}\t{len(audio)/sr:.1f}s audio\t{time.time()-t0:.1f}s")
        except Exception as e:
            print(f"FAIL\t{jid}\t{type(e).__name__}: {e}")

def finalize(out_dir, upd_dir, pairs):
    os.makedirs(upd_dir, exist_ok=True); now = int(time.time() * 1000)
    for p in pairs:
        jid, asset = p.split('=', 1)
        patch = json.load(open(os.path.join(out_dir, jid + '.patch.json'), encoding='utf-8'))
        tts = dict(patch['tts'], status='ready', audioId=asset, readyAt=now)
        json.dump({'script': patch['script'], 'voice': tts['voice'], 'tts': tts, 'updatedAt': now},
                  open(os.path.join(upd_dir, jid + '.json'), 'w', encoding='utf-8'), ensure_ascii=False)
        print(os.path.join(upd_dir, jid + '.json'))

if __name__ == '__main__':
    if sys.argv[1] == 'synth': synth(sys.argv[2], sys.argv[3], sys.argv[4:])
    else: finalize(sys.argv[2], sys.argv[3], sys.argv[4:])
