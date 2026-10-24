#!/usr/bin/env python3
"""Original sound set for the 'Tối giản' template (all synthesised here, no third-party audio).
Modelled on the *kind* of sound design in the reference: soft ambient bed, sub boom on the intro,
low thump on scene changes, mouse click + ratchet ticks while a line is drawn, soft bell on highlights.
Writes sfx_minimal.json {id: base64 webm/opus}."""
import base64, json, os, subprocess, tempfile
import numpy as np

SR = 48000
rng = np.random.default_rng(7)
t_ = lambda d: np.arange(int(d * SR)) / SR

def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); p = 0.0
    for i in range(len(x)):
        p = (1 - a) * x[i] + a * p; y[i] = p
    return y

def highpass(x, fc):
    return x - lowpass(x, fc)

def norm(x, db):
    pk = np.max(np.abs(x)) or 1
    return (x / pk * 10 ** (db / 20)).astype(np.float32)

def boom():
    t = t_(1.6); f = 38 + 70 * np.exp(-t * 5)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 2.6)
    x += 0.25 * np.sin(2 * ph) * np.exp(-t * 6)
    n = lowpass(rng.standard_normal(len(t)), 900) * np.exp(-t * 40) * 0.6
    return np.tanh(1.6 * (x + n))

def thump():
    t = t_(0.45); f = 55 + 90 * np.exp(-t * 18)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    x += lowpass(rng.standard_normal(len(t)), 1500) * np.exp(-t * 60) * 0.3
    return x

def click():
    t = t_(0.06); x = np.zeros(len(t))
    for st, g in ((0.0, 1.0), (0.018, 0.55)):
        i = int(st * SR); n = int(0.004 * SR)
        burst = highpass(rng.standard_normal(n), 1800) * np.exp(-np.arange(n) / (0.0009 * SR))
        x[i:i + n] += g * burst
    return x

def ratchet(dur=0.75):
    t = t_(dur); x = np.zeros(len(t)); pos = 0.0
    while pos < dur - 0.01:
        i = int(pos * SR); n = int(0.003 * SR)
        g = np.sin(np.pi * pos / dur) ** 0.6 * (0.7 + 0.3 * rng.random())
        x[i:i + n] += g * highpass(rng.standard_normal(n), 3500) * np.exp(-np.arange(n) / (0.0006 * SR))
        pos += 0.024 + 0.012 * rng.random()
    return lowpass(x, 12000)

def chime(f0=1046.5):
    t = t_(1.6); x = np.zeros(len(t))
    for k, a, d in ((1, 1.0, 2.2), (2.0, 0.32, 3.5), (3.0, 0.14, 5), (4.16, 0.05, 7)):
        x += a * np.sin(2 * np.pi * f0 * k * t) * np.exp(-t * d)
    return x * (1 - np.exp(-t * 400))

def low_blip():
    t = t_(0.4); x = np.sin(2 * np.pi * 196 * t) + 0.3 * np.sin(2 * np.pi * 392 * t)
    return x * np.exp(-t * 9) * (1 - np.exp(-t * 300))

def tok():
    t = t_(0.08); x = np.sin(2 * np.pi * 1500 * t) * np.exp(-t * 70)
    x += 0.4 * highpass(rng.standard_normal(len(t)), 2000) * np.exp(-t * 300)
    return x

def note(n):  # MIDI -> Hz
    return 440 * 2 ** ((n - 69) / 12)

def ambient():
    # 4 chords x 6 s, seamless loop. Dm9 - Bbmaj7 - Fmaj7 - Cadd9
    chords = [(38, [50, 53, 57, 64]), (34, [50, 53, 57, 60]), (41, [53, 57, 60, 64]), (36, [52, 55, 60, 62])]
    seg, tail = 6.0, 3.0; total = seg * len(chords)
    out = np.zeros(int((total + tail) * SR))
    for ci, (bass, pad) in enumerate(chords):
        t = t_(seg + tail); env = np.minimum(1, t / 1.6) * np.where(t < seg, 1, np.exp(-(t - seg) * 1.4))
        x = 0.55 * np.sin(2 * np.pi * note(bass) * t)
        for j, m in enumerate(pad):
            f = note(m)
            for det in (-0.0012, 0.0012):
                ph = rng.random() * 6.28
                x += 0.16 * np.sin(2 * np.pi * f * (1 + det) * t + ph)
                x += 0.05 * np.sin(2 * np.pi * 2 * f * (1 + det) * t + ph)
        x *= 1 + 0.08 * np.sin(2 * np.pi * 0.2 * t + ci)
        st = int(ci * seg * SR); out[st:st + len(x)] += x * env
    loop = out[:int(total * SR)].copy(); loop[:int(tail * SR)] += out[int(total * SR):]
    return lowpass(loop, 2600)

def enc(x):
    with tempfile.TemporaryDirectory() as d:
        raw = os.path.join(d, 'a.f32'); out = os.path.join(d, 'a.webm')
        np.asarray(x, dtype='<f4').tofile(raw)
        br = '48k'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', raw,
                        '-c:a', 'libopus', '-b:a', br, out], check=True)
        return base64.b64encode(open(out, 'rb').read()).decode()

pack = {
    'm_boom': enc(norm(boom(), -2)), 'm_thump': enc(norm(thump(), -3)), 'm_click': enc(norm(click(), -4)),
    'm_ratchet': enc(norm(ratchet(), -6)), 'm_chime': enc(norm(chime(), -5)), 'm_low': enc(norm(low_blip(), -5)),
    'm_tok': enc(norm(tok(), -6)), 'm_ambient': enc(norm(ambient(), -3)),
}
json.dump(pack, open('/home/claude/studio/sfx/sfx_minimal.json', 'w'))
print({k: len(v) // 1024 for k, v in pack.items()}, 'KB b64')
