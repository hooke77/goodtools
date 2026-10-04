# -*- coding: utf-8 -*-
"""
生成示范音频时长表：data/audio-length.js

用途：自评模式下做「跟读节奏比对」——
孩子的录音时长 vs 示范音频时长，读太快（大概率吞词）、读太慢（大概率卡词）
都能给出一句听得懂的提醒。这是不需要任何云服务就能拿到的真实反馈。

实现说明：直接遍历 MP3 帧头累加采样数，不依赖任何解码库。
（踩过的坑：miniaudio 在 Windows 上读不了含中文的路径，会被误判成"文件损坏"。
 实测把文件复制到纯 ASCII 目录就能正常解码，所以文件本身没问题。）
本脚本按字节流解析，不受路径编码影响，也不需要 pip 安装任何东西。

用法：python tools/gen-audio-length.py
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAP_FILE = os.path.join(ROOT, 'data', 'audio-map.js')
OUT_FILE = os.path.join(ROOT, 'data', 'audio-length.js')

# (version_bits, sample_rate_index) -> 采样率
SAMPLE_RATES = {
    (3, 0): 44100, (3, 1): 48000, (3, 2): 32000,   # MPEG 1
    (2, 0): 22050, (2, 1): 24000, (2, 2): 16000,   # MPEG 2
    (0, 0): 11025, (0, 1): 12000, (0, 2): 8000,    # MPEG 2.5
}

# (版本组, bitrate_index) -> kbps；只覆盖 Layer III
BITRATES = {
    ('1', 1): 32, ('1', 2): 40, ('1', 3): 48, ('1', 4): 56, ('1', 5): 64,
    ('1', 6): 80, ('1', 7): 96, ('1', 8): 112, ('1', 9): 128, ('1', 10): 160,
    ('1', 11): 192, ('1', 12): 224, ('1', 13): 256, ('1', 14): 320,
    ('2', 1): 8, ('2', 2): 16, ('2', 3): 24, ('2', 4): 32, ('2', 5): 40,
    ('2', 6): 48, ('2', 7): 56, ('2', 8): 64, ('2', 9): 80, ('2', 10): 96,
    ('2', 11): 112, ('2', 12): 128, ('2', 13): 144, ('2', 14): 160,
}


def parse_frame(b0, b1, b2):
    """解析一个 Layer III 帧头，返回 (帧长字节数, 本帧采样数, 采样率) 或 None"""
    if b0 != 0xFF or (b1 & 0xE0) != 0xE0:
        return None
    version = (b1 >> 3) & 0x03          # 0=MPEG2.5, 1=保留, 2=MPEG2, 3=MPEG1
    layer = (b1 >> 1) & 0x03            # 1=Layer III
    if version == 1 or layer != 1:
        return None
    br_index = (b2 >> 4) & 0x0F
    sr_index = (b2 >> 2) & 0x03
    padding = (b2 >> 1) & 0x01
    if br_index in (0, 15) or sr_index == 3:
        return None

    sr = SAMPLE_RATES.get((version, sr_index))
    group = '1' if version == 3 else '2'
    br = BITRATES.get((group, br_index))
    if not sr or not br:
        return None

    samples = 1152 if version == 3 else 576
    size = int(samples / 8 * br * 1000 / sr) + padding
    return size, samples, sr


def mp3_duration_ms(data):
    """遍历所有帧，返回总时长（毫秒）；无法解析时返回 None"""
    pos = 0
    # 跳过 ID3v2 标签
    if data[:3] == b'ID3' and len(data) >= 10:
        pos = 10 + (((data[6] & 0x7F) << 21) | ((data[7] & 0x7F) << 14)
                    | ((data[8] & 0x7F) << 7) | (data[9] & 0x7F))

    total_samples = 0
    sample_rate = None
    n = len(data)

    while pos + 4 <= n:
        head = parse_frame(data[pos], data[pos + 1], data[pos + 2])
        if head is None:
            # 不是帧头：可能遇到尾部标签或杂数据，向后找下一个同步字
            nxt = data.find(b'\xff', pos + 1)
            if nxt < 0:
                break
            pos = nxt
            continue
        size, samples, sr = head
        if size <= 4:
            break
        total_samples += samples
        sample_rate = sr
        pos += size

    if not sample_rate or total_samples == 0:
        return None
    return int(round(total_samples / float(sample_rate) * 1000))


def main():
    src = open(MAP_FILE, encoding='utf-8').read()
    pairs = re.findall(r'"((?:[^"\\]|\\.)*)"\s*:\s*"([^"]+)"', src)
    if not pairs:
        print('没能从 audio-map.js 里解析出条目')
        return 1

    lengths = {}
    cache = {}
    missing = []
    broken = []

    for key, rel in pairs:
        fp = os.path.join(ROOT, rel.replace('/', os.sep))
        if not os.path.exists(fp):
            missing.append(rel)
            continue
        if rel not in cache:
            with open(fp, 'rb') as f:
                ms = mp3_duration_ms(f.read())
            if ms is None:
                broken.append(rel)
                continue
            cache[rel] = ms
        lengths[key] = cache[rel]

    if missing:
        print('有 %d 个音频文件不存在，例如：%s' % (len(missing), missing[:3]))
    if broken:
        print('有 %d 个文件解析不出时长，例如：%s' % (len(broken), broken[:3]))
    if not lengths:
        print('没有测到任何时长，中止')
        return 1

    lines = [
        '/**',
        ' * 示范音频标准时长表（自动生成，请勿手改）',
        ' * 生成方式：tools/gen-audio-length.py',
        ' * key   = 与 data/audio-map.js 完全一致的归一化文本',
        ' * value = 该句示范音频的时长（毫秒）',
        ' * 用途：自评模式下比对孩子的跟读节奏，见 utils/pace.js',
        ' */',
        'module.exports = {',
    ]
    for k in sorted(lengths):
        lines.append('  %s: %d,' % (json.dumps(k, ensure_ascii=False), lengths[k]))
    lines.append('};')

    with open(OUT_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')

    vals = sorted(lengths.values())
    print('已写入 %s' % os.path.relpath(OUT_FILE, ROOT))
    print('条目 %d 条，最短 %.2fs，最长 %.2fs，平均 %.2fs'
          % (len(lengths), vals[0] / 1000.0, vals[-1] / 1000.0,
             sum(vals) / len(vals) / 1000.0))
    return 0


if __name__ == '__main__':
    sys.exit(main())
