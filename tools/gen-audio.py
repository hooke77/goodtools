# -*- coding: utf-8 -*-
"""
朗读示范音频生成器
=====================================

作用：把 data/lessons.js 里所有句子和单词，批量生成随小程序打包的 mp3。

为什么要自己生成音频？
  「微信同声传译」插件不对个人主体小程序开放，所以朗读示范不能靠插件 TTS。
  把示范音频预先做好随包携带，好处是：个人主体能用、断网能听、音质稳定、零调用费用。

用法：
  1) 装依赖（只需要两个小包，均已提供安装命令）
       python -m pip install miniaudio lameenc
  2) 在项目根目录执行
       python tools/gen-audio.py            # 增量：已有音频就跳过
       python tools/gen-audio.py --force    # 全量重做
  3) 跑一遍校验
       node tests/audio.test.js

生成的产物：
  audios/<句子id>.mp3          课文句子/单词 + 听写重点句型，合计约 1.4MB
                              课文用 u1-p1-s3.mp3，单词用 u1-w2.mp3，听写句型用 u1-d1.mp3
  data/audio-map.js            文本 → 音频路径 的索引（自动生成，别手改）

想换音色 / 换语速 / 改码率：看下面的 CONFIG 区。
"""

import os
import re
import sys
import json
import time
import hashlib
import subprocess
import urllib.parse

try:
    import miniaudio
    import lameenc
except ImportError:
    print('缺少依赖，请先执行： python -m pip install miniaudio lameenc')
    sys.exit(1)

# ============================ CONFIG ============================

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# 课文句子的示范音体量最大：450 句约 3.7MB，单个分包装不下（微信每包上限 2MB），
# 所以**按单元拆成 u1..u6 六个分包**，跟读页在每个单元分包里各放一份（同一份源码，
# 见 tools/lesson-src 与 tools/sync-lesson.js）。好处还有按需下载：
# 打开 Unit 3 只下 Unit 3 的音频，不用等全部。
# 单词和听写句型留在主包 —— 首页自检、单词页要用，主包页面取不到分包资源。
AUDIO_DIR = os.path.join(ROOT, 'audios')
MAP_FILE = os.path.join(ROOT, 'data', 'audio-map.js')
TMP_DIR = os.path.join(ROOT, '.audio-tmp')

# 发音接口：百度翻译公开发音（lan=en 英文；spd 1~5，越大越快）
TTS_URL = 'https://fanyi.baidu.com/gettts?lan=en&text={text}&spd=3&source=web'
UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/120 Safari/537.36')

SAMPLE_RATE = 16000      # 语音用 16k 足够；越大文件越大
BITRATE = 24             # kbps。MPEG-2 Layer III 合法档位：8/16/24/32/40/48/56/64
                         # 24kbps ≈ 1.2MB 总量；想要更小用 16（音质会明显发闷）
TRIM_PAD_MS = 25         # 去首尾静音后两侧保留的余量
TRIM_RATIO = 0.03        # 静音阈值 = 峰值 × 这个比例
REQUEST_GAP = 0.12       # 两次请求之间的间隔，别把接口打太狠
RETRY = 3

# ============================ 具体实现 ============================

NODE = os.environ.get('NODE_BIN', 'node')


def normalize(text):
    """与 utils/tts.js 的 normKey 保持一致"""
    t = text.lower().replace('\u2019', "'").replace('\u2018', "'")
    t = re.sub(r"[^a-z0-9']+", ' ', t)
    return re.sub(r'\s+', ' ', t).strip()


def key_of(text):
    return hashlib.md5(normalize(text).encode('utf-8')).hexdigest()[:12]


def collect_texts():
    """从 data/lessons.js + data/dictation.js 里导出所有待合成文本
    （用 node 读，避免重复维护一份数据）

    顺序很关键：课文句子和单词先收，重点句型后收。
    这样某句重点句型如果本来就是课文原句，会先被课文那边收走，
    音频文件名就仍是 u1-p1-s3.mp3 —— utils/dictation.js 正是靠这个
    反推出"这句就是课文第 N 句"，从而把朗读错题和听写错题合并统计。
    """
    js = (
        "const d=require(%s);const t=require(%s);const out=[],seen=new Set();"
        "d.lessons.forEach(l=>{"
        "l.passages.forEach(p=>p.sentences.forEach(s=>{"
        "if(!seen.has(s.en)){seen.add(s.en);out.push({kind:'s',id:s.id,text:s.en});}}));"
        "l.words.forEach((w,i)=>{if(!seen.has(w.en)){seen.add(w.en);"
        "out.push({kind:'w',id:l.id+'-w'+(i+1),text:w.en});}});});"
        "t.units.forEach(u=>{u.patterns.forEach((p,i)=>{"
        "if(!seen.has(p.en)){seen.add(p.en);out.push({kind:'p',id:u.id+'-d'+(i+1),text:p.en});}});});"
        "process.stdout.write(JSON.stringify(out));"
    ) % (
        json.dumps(os.path.join(ROOT, 'data', 'lessons.js')),
        json.dumps(os.path.join(ROOT, 'data', 'dictation.js')),
    )
    out = subprocess.run([NODE, '-e', js], capture_output=True)
    if out.returncode != 0:
        print('读取 lessons.js / dictation.js 失败：', out.stderr.decode('utf-8', 'ignore'))
        sys.exit(1)
    return json.loads(out.stdout.decode('utf-8'))


def fetch(text, dst):
    url = TTS_URL.format(text=urllib.parse.quote(text, safe=''))
    for i in range(RETRY):
        subprocess.run(['curl', '-s', '--max-time', '30', '-A', UA, '-o', dst, url],
                       capture_output=True)
        if os.path.exists(dst) and os.path.getsize(dst) > 1200:
            with open(dst, 'rb') as f:
                head = f.read(3)
            if head[:1] == b'\xff' or head[:3] == b'ID3':
                return True
        time.sleep(0.8)
    return False


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


def encode(src, dst):
    """解码 → 去静音 → 重编码，并自检能不能再解码回来

    ⚠️ 全程走内存，绝不让 miniaudio 去打开文件路径。
    Windows 上的 miniaudio 按系统 ANSI 代码页打开文件，路径里一旦含中文
    （本项目目录就叫「小学英语」）就报 `('failed to decode file', -7)`。
    更坑的是 `.audio-tmp` 的相对路径恰好是纯 ASCII，用相对路径试又一切正常，
    非常容易误判成"音频文件损坏"。
    （tools/gen-audio-length.py 当初也是栽在同一个地方，最后改成纯字节流解析。）
    """
    with open(src, 'rb') as f:
        raw = f.read()
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
    # 自检：把刚编码出来的字节直接解回来，确认这个 mp3 是能播的
    # （lameenc.encode 返回的是 bytearray，miniaudio 只接受 bytes，必须先转）
    miniaudio.decode(bytes(data), nchannels=1, sample_rate=SAMPLE_RATE)
    return len(data)


def write_map(mapping):
    lines = [
        '/**',
        ' * 朗读示范音频索引（自动生成，请勿手改）',
        ' * 生成方式：tools/gen-audio.py',
        ' * key = 句子/单词归一化后的文本（小写、弯引号转直引号、去标点）',
        ' * value = 随包音频路径',
        ' */',
        'module.exports = {',
    ]
    for k in sorted(mapping.keys()):
        lines.append('  %s: %s,' % (json.dumps(k, ensure_ascii=False), json.dumps(mapping[k])))
    lines.append('};')
    with open(MAP_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')


def main():
    force = '--force' in sys.argv
    os.makedirs(AUDIO_DIR, exist_ok=True)
    for _u in ('u1', 'u2', 'u3', 'u4', 'u5', 'u6'):
        os.makedirs(os.path.join(ROOT, _u, 'audios'), exist_ok=True)
    os.makedirs(TMP_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(MAP_FILE), exist_ok=True)

    texts = collect_texts()
    print('待合成文本：%d 条' % len(texts))

    mapping = {}
    done = skipped = failed = 0
    total_bytes = 0

    for i, item in enumerate(texts):
        text = item['text']
        k = key_of(text)
        # kind: 's' 课文句子 → 所属单元的 uN 分包；'w' 单词 / 'p' 听写句型 → 主包
        is_sentence = item['kind'] == 's'
        unit = item['id'].split('-')[0] if is_sentence else ''
        outdir = os.path.join(ROOT, unit, 'audios') if is_sentence else AUDIO_DIR
        prefix = (unit + '/audios/') if is_sentence else 'audios/'
        dst = os.path.join(outdir, item['id'] + '.mp3')
        mapping[normalize(text)] = prefix + item['id'] + '.mp3'

        if not force and os.path.exists(dst) and os.path.getsize(dst) > 800:
            skipped += 1
            total_bytes += os.path.getsize(dst)
            continue

        raw = os.path.join(TMP_DIR, k + '.mp3')
        if not os.path.exists(raw) or os.path.getsize(raw) < 1200 or force:
            if not fetch(text, raw):
                print('  [取音失败] %s' % text)
                failed += 1
                continue
        try:
            total_bytes += encode(raw, dst)
            done += 1
        except Exception as e:
            print('  [转码失败] %s -> %s' % (text, e))
            failed += 1

        if (i + 1) % 20 == 0:
            print('  进度 %d/%d  新生成 %d  跳过 %d  失败 %d  %.1fKB'
                  % (i + 1, len(texts), done, skipped, failed, total_bytes / 1024.0))
        time.sleep(REQUEST_GAP)

    # 删掉映射里不存在的文件（课文改过之后留下的孤儿）
    # 主包和六个单元分包都要扫，文件名互不重叠（句子 u1-p1-s1 / 单词 u1-w1 / 句型 u1-d1）
    keep = set(v.split('/')[-1] for v in mapping.values())
    dirs = [AUDIO_DIR] + [os.path.join(ROOT, _u, 'audios') for _u in ('u1', 'u2', 'u3', 'u4', 'u5', 'u6')]
    for d in dirs:
        if not os.path.isdir(d):
            continue
        for f in os.listdir(d):
            if f.endswith('.mp3') and f not in keep:
                os.remove(os.path.join(d, f))
                print('  清理孤儿文件：', f)

    # 反向清理：只保留磁盘上确实存在的文件。
    # 抓取失败的文本绝不能留在索引里 —— 否则端上会拿到一个不存在的路径，
    # 「点了没声音」又不报错，正是之前踩过的那类静默失败。
    dropped = [k for k, v in mapping.items() if not os.path.exists(os.path.join(ROOT, v))]
    for k in dropped:
        print('  [索引剔除] %s（音频不存在）' % k)
        mapping.pop(k)

    write_map(mapping)
    print('\n完成：新生成 %d，跳过 %d，失败 %d' % (done, skipped, failed))
    print('音频合计 %.1f KB，索引 %d 条' % (total_bytes / 1024.0, len(mapping)))
    print('下一步：node tests/audio.test.js')
    if failed or dropped:
        sys.exit(1)


if __name__ == '__main__':
    main()
