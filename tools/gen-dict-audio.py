# -*- coding: utf-8 -*-
"""
听写专用清晰音频生成器（下载 + 编码）
=====================================
配套 tools/gen-dict-audio.js（先 enum 产出 _items.json，再本脚本下载，最后 map 产出索引）。

与 gen-audio.py 的区别：参数更清晰
  - spd=2（比跟读的 spd=3 更慢，孩子更容易听清每个词）
  - SAMPLE_RATE=22050（比跟读的 16k 高，高频更干净）
  - BITRATE=32（比跟读的 24 略高，细节更多）

输出到 dictationAudio/audios/<id>.mp3（分包目录，不占主包体积）。

沿用 gen-audio.py 的字节流编解码，避开 Windows 上 miniaudio 打不开中文路径的坑：
全程走内存字节，绝不让 miniaudio 去 open 文件路径。
"""
import os
import sys
import json
import time
import urllib.parse
import urllib.request

try:
    import miniaudio
    import lameenc
except ImportError:
    print('缺少依赖，请先执行： python -m pip install miniaudio lameenc')
    sys.exit(1)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ITEMS = os.path.join(ROOT, 'dictationAudio', '_items.json')
AUDIO_DIR = os.path.join(ROOT, 'dictationAudio', 'audios')

UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/120 Safari/537.36')

# 更清晰：慢速 + 高采样率 + 稍高码率
TTS_URL = 'https://fanyi.baidu.com/gettts?lan=en&text={text}&spd=2&source=web'
SAMPLE_RATE = 22050
BITRATE = 32
TRIM_PAD_MS = 30
TRIM_RATIO = 0.03
REQUEST_GAP = 0.15
RETRY = 3


def fetch(text):
    """返回音频字节；失败抛异常。"""
    url = TTS_URL.format(text=urllib.parse.quote(text, safe=''))
    last = None
    for _ in range(RETRY):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            raw = urllib.request.urlopen(req, timeout=30).read()
        except Exception as e:  # noqa
            last = e
            time.sleep(0.5)
            continue
        if len(raw) > 1200 and (raw[:1] == b'\xff' or raw[:3] == b'ID3'):
            return raw
        last = 'bad header/length (%d bytes)' % len(raw)
        time.sleep(0.5)
    raise RuntimeError('fetch failed: %s' % last)


def trim(samples, rate):
    n = len(samples)
    if n < rate // 10:
        return samples
    peak = max(max(samples), -min(samples)) or 1
    th = max(180, int(peak * TRIM_RATIO))
    head = 0
    while head < n and abs(samples[head]) < th:
        head += 1
    tail = n
    while tail > head and abs(samples[tail - 1]) < th:
        tail -= 1
    if tail - head < rate // 10:
        return samples
    pad = int(rate * TRIM_PAD_MS / 1000.0)
    return samples[max(0, head - pad):min(n, tail + pad)]


def encode(raw, dst):
    """解码 -> 去静音 -> 重编码，并自检能再解码回来。全程字节流，不 open 文件路径。"""
    d = miniaudio.decode(raw, output_format=miniaudio.SampleFormat.SIGNED16,
                         nchannels=1, sample_rate=SAMPLE_RATE)
    s = trim(d.samples, SAMPLE_RATE)
    enc = lameenc.Encoder()
    enc.set_bit_rate(BITRATE)
    enc.set_in_sample_rate(SAMPLE_RATE)
    enc.set_channels(1)
    enc.set_quality(5)
    data = enc.encode(s.tobytes()) + enc.flush()
    with open(dst, 'wb') as f:
        f.write(data)
    # 自检：把刚编码的字节直接解回来，确认这个 mp3 能播
    # （lameenc.encode 返回 bytearray，miniaudio 只收 bytes，必须先转）
    miniaudio.decode(bytes(data), nchannels=1, sample_rate=SAMPLE_RATE)
    return len(data)


def main():
    if not os.path.exists(ITEMS):
        print('找不到 _items.json，请先跑：node tools/gen-dict-audio.js enum')
        sys.exit(1)
    items = json.load(open(ITEMS, encoding='utf-8'))
    os.makedirs(AUDIO_DIR, exist_ok=True)
    force = '--force' in sys.argv

    done = skipped = failed = 0
    total_bytes = 0

    for i, it in enumerate(items):
        tid = it['id']
        text = it['text']
        dst = os.path.join(AUDIO_DIR, tid + '.mp3')
        if os.path.exists(dst) and os.path.getsize(dst) > 800 and not force:
            skipped += 1
            total_bytes += os.path.getsize(dst)
            continue
        try:
            raw = fetch(text)
            total_bytes += encode(raw, dst)
            done += 1
        except Exception as e:  # noqa
            print('  [失败] %s  %s  -> %s' % (tid, text, e))
            failed += 1
        if (i + 1) % 20 == 0:
            print('  进度 %d/%d  新生成 %d  跳过 %d  失败 %d  %.1fKB'
                  % (i + 1, len(items), done, skipped, failed, total_bytes / 1024.0))
        time.sleep(REQUEST_GAP)

    # 反向清理：只保留磁盘上确实存在的文件，避免索引指向空文件导致"点了没声音"
    keep = set(os.listdir(AUDIO_DIR))
    for f in list(keep):
        if not f.endswith('.mp3'):
            keep.discard(f)
    for f in os.listdir(AUDIO_DIR):
        if f.endswith('.mp3') and f not in keep:
            os.remove(os.path.join(AUDIO_DIR, f))

    print('\n完成：新生成 %d，跳过 %d，失败 %d' % (done, skipped, failed))
    print('音频合计 %.1f KB，目录 %s' % (total_bytes / 1024.0, AUDIO_DIR))
    print('下一步：node tools/gen-dict-audio.js map')
    if failed:
        sys.exit(1)


if __name__ == '__main__':
    main()
