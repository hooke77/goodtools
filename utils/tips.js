/**
 * 发音纠正提示库
 * 根据"读错的单词"推断孩子最可能的发音问题，给出孩子听得懂的一句话纠正建议。
 * 规则顺序 = 优先级：越"具体"的拼读规则排在越前面，保证给到最有用的那条提示。
 */
const RULES = [
  {
    id: 'th',
    match: function (w) {
      return /th/.test(w);
    },
    tip: 'th 要把舌尖轻轻伸到上下牙齿中间，再送气，别读成 s（"三克"）或 f。',
    demo: 'think /θɪŋk/　three /θriː/　thank /θæŋk/'
  },
  {
    id: 'igh',
    match: function (w) {
      return /igh/.test(w);
    },
    tip: 'igh 读 /aɪ/，和 light、night 一样，gh 不发音。',
    demo: 'bright /braɪt/　light /laɪt/　night /naɪt/'
  },
  {
    id: 'tion',
    match: function (w) {
      return /tion$/.test(w);
    },
    tip: '-tion 读 /ʃn/，像"神"的轻声，重音在它前面一个音节。',
    demo: 'invention /ɪnˈvenʃn/　population /ˌpɒpjuˈleɪʃn/'
  },
  {
    id: 'ed-end',
    match: function (w) {
      return /ed$/.test(w);
    },
    tip: '-ed 是过去式的小尾巴：在清辅音后读 /t/，在浊辅音和元音后读 /d/，一定要带上。',
    demo: 'asked /ɑːskt/　joined /dʒɔɪnd/　painted /ˈpeɪntɪd/'
  },
  {
    id: 's-end',
    match: function (w) {
      return /(s|es)$/.test(w);
    },
    tip: '词尾的 -s 一定要读出来，它表示"不止一个"，是丢分最多的地方。',
    demo: 'pads /pædz/　wheels /wiːlz/　buildings /ˈbɪldɪŋz/'
  },
  {
    id: 'ee',
    match: function (w) {
      return /ee|ea/.test(w);
    },
    tip: 'ee / ea 读长音 /iː/，嘴巴放平拉长，别读成短短的 /ɪ/。',
    demo: 'see /siː/　team /tiːm/　easier /ˈiːziə/'
  },
  {
    id: 'oo',
    match: function (w) {
      return /oo/.test(w);
    },
    tip: 'oo 多数读长音 /uː/，嘴巴要圆。',
    demo: 'food /fuːd/　soon /suːn/　school /skuːl/'
  },
  {
    id: 'wh',
    match: function (w) {
      return /^wh/.test(w);
    },
    tip: 'wh 一般读 /w/，和 w 一样，别读成 /hw/。',
    demo: 'what /wɒt/　why /waɪ/　wheel /wiːl/'
  },
  {
    id: 'oi',
    match: function (w) {
      return /oi|oy/.test(w);
    },
    tip: 'oi / oy 读 /ɔɪ/，先圆嘴再收扁，像"奥—伊"连起来。',
    demo: 'oil /ɔɪl/　enjoy /ɪnˈdʒɔɪ/　point /pɔɪnt/'
  },
  {
    id: 'v',
    match: function (w) {
      return /v/.test(w);
    },
    tip: 'v 要用上牙齿轻轻咬住下嘴唇，别读成 w。',
    demo: 'van /væn/　very /ˈveri/　volleyball /ˈvɒlibɔːl/'
  },
  {
    id: 'r',
    match: function (w) {
      return /r/.test(w);
    },
    tip: 'r 要把舌头卷起来但不碰到上颚，舌尖别弹一下（那是 l）。',
    demo: 'red /red/　river /ˈrɪvə/　bright /braɪt/'
  },
  {
    id: 'l-end',
    match: function (w) {
      return /l$/.test(w) || /le$/.test(w);
    },
    tip: '词尾的 l 舌尖要顶住上齿龈，把音收住，别直接吞掉。',
    demo: 'small /smɔːl/　wheel /wiːl/　people /ˈpiːpl/'
  }
];

/** 通用建议（当没有命中具体规则时使用） */
const GENERIC = [
  '先把句子拆成 2～3 小段，一段一段读顺，再连起来。',
  '跟着示范的节奏读：重音落在实词上（名词、动词、形容词）。',
  '读慢一点没关系，把每个词的尾巴（-s、-ed）读完整最重要。',
  '长句子在逗号处换一口气，别一口气念到底。'
];

/**
 * @param {string[]} errorWords 读错 / 漏读的单词
 * @returns {{tips: string[], demoLines: string[]}}
 */
function tipsFor(errorWords) {
  const words = (errorWords || []).map(function (w) {
    return String(w || '').toLowerCase();
  });
  const hits = [];
  const demos = [];
  const used = {};

  words.forEach(function (w) {
    RULES.forEach(function (r) {
      if (used[r.id]) return;
      if (r.match(w)) {
        used[r.id] = true;
        hits.push(r.tip);
        demos.push(r.demo);
      }
    });
  });

  if (!hits.length) {
    hits.push(GENERIC[Math.floor(Math.random() * GENERIC.length)]);
  }

  return {
    tips: hits.slice(0, 3),
    demoLines: demos.slice(0, 3)
  };
}

/** 单个单词的发音提示（单词跟读模式用） */
function tipForWord(word) {
  const w = String(word || '').toLowerCase();
  for (let i = 0; i < RULES.length; i++) {
    if (RULES[i].match(w)) {
      return { tip: RULES[i].tip, demo: RULES[i].demo };
    }
  }
  return { tip: '注意重音位置，跟着示范多读两遍，读慢一点更清楚。', demo: '' };
}

/**
 * 「读前预告」专用规则：比 RULES 严格得多，只保留高确定性、高价值的几条。
 *
 * 为什么不能直接用 RULES：
 *   RULES 是"读错之后再解释"，命中范围宽一点无非是提示不够贴切；
 *   但读前预告是**主动断言**，说错了会真的误导孩子。实测踩到过：
 *     · need 被 -ed$ 规则当成过去式
 *     · has 被 -s$ 规则当成复数
 *     · wear 被 ea 规则说成读 /iː/（其实是 /eə/）
 *
 * 所以这里：
 *   · 砍掉 ea/ee、oo 这类例外太多的组合（bread、wear、blood 全都反例）；
 *   · 砍掉 v、r、l 这类几乎每句都命中的，免得孩子对提示麻木；
 *   · -ed / -s / wh 都加上排除词和长度门槛。
 */
const EXCEPT_WH = /^(who|whom|whose|whole)/;
const EXCEPT_S = /^(this|his|yes|us|as|always|sometimes|does|goes|was|has|is)$/;

const PRE_RULES = [
  { id: 'th', test: function (w) { return /th/.test(w); } },
  { id: 'igh', test: function (w) { return /igh/.test(w); } },
  { id: 'tion', test: function (w) { return /tion$/.test(w); } },
  { id: 'oi', test: function (w) { return /oi|oy/.test(w); } },
  {
    id: 'ed-end',
    // 排除 eed（need / feed / speed 都是原形），也排除 3 字母词（red / bed）
    test: function (w) { return /ed$/.test(w) && !/eed$/.test(w) && w.length >= 4; }
  },
  {
    id: 'wh',
    test: function (w) { return /^wh/.test(w) && !EXCEPT_WH.test(w); }
  },
  {
    id: 's-end',
    // 排除 ss 结尾和常见的高频小词
    test: function (w) {
      if (!/(s|es)$/.test(w) || w.length < 4 || /ss$/.test(w)) return false;
      return !EXCEPT_S.test(w);
    }
  }
];

/**
 * 读前预告用的规则清单（按优先级排序，已把提示文案合进来）
 *
 * 用法：pace.js 按这个顺序走，每类易错点去句子里"认领"一个还没被用过的词。
 * 这样能保证一句里覆盖到不同的知识点 —— 比如 "It has three months."
 * 既能提示 three 的 th，也能提示 months 的复数尾音（th 和 -s 各占一个词）。
 * @returns {Array<{id:string, test:Function, tip:string, demo:string}>}
 */
function preRuleList() {
  return PRE_RULES.map(function (p) {
    let tip = '';
    let demo = '';
    for (let j = 0; j < RULES.length; j++) {
      if (RULES[j].id === p.id) {
        tip = RULES[j].tip;
        demo = RULES[j].demo;
        break;
      }
    }
    return { id: p.id, test: p.test, tip: tip, demo: demo };
  });
}

module.exports = {
  tipsFor: tipsFor,
  tipForWord: tipForWord,
  preRuleList: preRuleList,
  GENERIC: GENERIC
};
