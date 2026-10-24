#!/usr/bin/env python3
"""Build the SFX pack embedded in Xưởng Video Bài Giảng.

Sources:
  - Kenney "Interface Sounds" (CC0, www.kenney.nl) via github.com/Calinou/kenney-interface-sounds
  - whoosh / whoosh_soft / swell: synthesised here (filtered noise), no licence needed.
Every sound is trimmed, normalised to -3 dBFS, resampled to 48 kHz mono and encoded
as WebM/Opus, then written as base64 into sfx_pack.json  {id: base64}.
"""
import base64, json, os, subprocess, tempfile
import numpy as np

KEN = '/home/claude/studio/sfx/kenney-interface-sounds/addons/kenney_interface_sounds'
OUT = '/home/claude/studio/sfx/sfx_pack.json'
SR = 48000

PICK = {
    'pop': 'pluck_001', 'pop2': 'drop_002', 'tick': 'tick_001', 'select': 'select_003',
    'ok': 'confirmation_001', 'ok_soft': 'confirmation_002', 'no': 'error_004', 'no_soft': 'back_002',
    'glass': 'glass_001', 'bong': 'bong_001', 'glitch': 'glitch_002', 'open': 'maximize_006',
    'scratch': 'scratch_002', 'scratch2': 'scratch_003', 'scroll': 'scroll_002', 'question': 'question_001',
}

def one_pole_sweep(x, f_start, f_end, sr):
    n = len(x); f = np.geomspace(f_start, f_end, n)
    a = np.exp(-2 * np.pi * f / sr)
    y = np.zeros(n, dtype=np.float64); prev = 0.0
    for i in range(n):
        prev = (1 - a[i]) * x[i] + a[i] * prev
        y[i] = prev
    return y

def whoosh(dur, f0, f1, peak_at, seed):
    rng = np.random.default_rng(seed); n = int(dur * SR)
    noise = rng.standard_normal(n)
    lp = one_pole_sweep(noise, f0, f1, SR)
    hp = lp - one_pole_sweep(lp, 120, 180, SR)            # remove rumble
    t = np.linspace(0, 1, n)
    env = np.where(t < peak_at, (t / peak_at) ** 2.2, ((1 - t) / (1 - peak_at)) ** 1.6)
    return hp * env

def synth():
    return {
        'whoosh': whoosh(0.42, 500, 5200, 0.62, 1),
        'whoosh_soft': whoosh(0.55, 300, 2400, 0.55, 2),
        'swell': whoosh(0.9, 200, 3000, 0.8, 3) * 0.8,
    }

def norm(x, db=-3.0):
    x = np.asarray(x, dtype=np.float64)
    nz = np.where(np.abs(x) > 1e-3 * (np.max(np.abs(x)) or 1))[0]
    if len(nz): x = x[nz[0]:nz[-1] + 1]
    pk = np.max(np.abs(x)) or 1
    return (x / pk * 10 ** (db / 20)).astype(np.float32)

def enc(x):
    with tempfile.TemporaryDirectory() as d:
        raw = os.path.join(d, 'a.f32'); out = os.path.join(d, 'a.webm')
        x.astype('<f4').tofile(raw)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', raw,
                        '-af', 'apad=pad_dur=0.03', '-c:a', 'libopus', '-b:a', '56k', out], check=True)
        return base64.b64encode(open(out, 'rb').read()).decode()

def load_wav(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype='<f4')

pack = {}
for k, f in PICK.items():
    pack[k] = enc(norm(load_wav(os.path.join(KEN, f + '.wav'))))
for k, x in synth().items():
    pack[k] = enc(norm(x, -4.0))
json.dump(pack, open(OUT, 'w'))
print(len(pack), 'sounds,', sum(len(v) for v in pack.values()) // 1024, 'KB base64')
