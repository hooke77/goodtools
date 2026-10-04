/**
 * 听写内容库 · 重点句型
 * ============================================================
 * 来源：课本各单元「Grammar in use」板块的示范句 + 《六上课本学习笔记》里的
 *      「重点句型归纳」。每单元挑 6~7 句，覆盖该单元的语法重点。
 *
 * 为什么单独一个文件？
 *   课文段落（data/lessons.js）是"跟着课文读"用的，句子按文章顺序排；
 *   听写要的是**脱离课文的语法模型句**，顺序和取舍都不一样，所以分开维护。
 *
 * 单词听写不在这里 —— 直接复用 data/lessons.js 里各单元的 words（课本核心词），
 * 避免同一份词表维护两遍。
 *
 * 音频：由 tools/gen-audio.py 一并生成（id 形如 u1-d1.mp3），
 *      若某句与课文原句完全一致，则自动复用课文的音频，不重复生成。
 *
 * 字段：
 *   en    英文原句（听写答案）
 *   cn    中文（对答案时给孩子看意思）
 *   point 语法点，一句话说清这句在练什么
 *   tip   可选。最容易写错的地方
 */
module.exports = {
  units: [
    {
      id: 'u1',
      unit: 'Unit 1',
      theme: '#4b6bfb',
      focus: '一般过去时 · 表达情感',
      patterns: [
        {
          en: 'We moved here to Shenzhen yesterday.',
          cn: '我们昨天搬到了深圳这里。',
          point: '一般过去时 + 时间状语 yesterday',
          tip: 'move 的过去式是 moved，别写成 move'
        },
        {
          en: 'It was cold in Shenyang.',
          cn: '沈阳很冷。',
          point: 'was 是 am / is 的过去式',
          tip: '主语是 it，用 was 不用 were'
        },
        {
          en: 'I joined the school band and the volleyball team last week.',
          cn: '上周我加入了学校乐队和排球队。',
          point: '过去式 + last week',
          tip: 'join → joined；volleyball 有两个 l'
        },
        {
          en: 'I am going to play in a concert.',
          cn: '我要在音乐会上演出。',
          point: 'be going to 表示打算、将来',
          tip: '是 be going to play，不是 be going to playing'
        },
        {
          en: 'I feel lonely.',
          cn: '我感到很孤单。',
          point: 'feel + 形容词，说自己的感受',
          tip: 'lonely 别漏掉 ly'
        },
        {
          en: "I'm so excited!",
          cn: '我太兴奋了！',
          point: 'so + 形容词，表达强烈的情绪',
          tip: "I'm 的撇号别丢；excited 结尾是 -ed"
        },
        {
          en: 'I feel so happy that I can help them.',
          cn: '能帮到它们，我感到特别开心。',
          point: 'so ... that ... 如此……以至于……',
          tip: 'so 后面跟形容词 happy，that 后面跟一整个句子'
        }
      ]
    },
    {
      id: 'u2',
      unit: 'Unit 2',
      theme: '#6d4ad8',
      focus: '一般过去时（was / were）· 介绍艺术家',
      patterns: [
        {
          en: 'Vincent van Gogh was a Dutch artist.',
          cn: '梵高是一位荷兰画家。',
          point: 'was 用于单数主语',
          tip: 'Vincent van Gogh 三个词都要大写'
        },
        {
          en: 'He did oil painting.',
          cn: '他画油画。',
          point: 'do 的过去式是 did',
          tip: 'oil painting 是两个词，别漏了空格'
        },
        {
          en: 'He painted flowers in bright colours.',
          cn: '他用明亮的色彩画花。',
          point: '规则动词过去式加 -ed',
          tip: 'paint → painted；colours 的 s 不能丢'
        },
        {
          en: 'Anyone can be an artist.',
          cn: '任何人都能成为艺术家。',
          point: 'anyone 表示"任何人"，谓语用单数',
          tip: 'can 后面用 be，不用 is'
        },
        {
          en: 'I made something beautiful with just a ball of string.',
          cn: '我只用一团线就做出了漂亮的东西。',
          point: 'make 的过去式是 made',
          tip: 'made 不是 maked；something 后面跟形容词'
        },
        {
          en: 'Xu Beihong was a Chinese artist. He painted horses.',
          cn: '徐悲鸿是一位中国画家。他画马。',
          point: '两个过去时句子连着说',
          tip: '两句都要用过去式：was / painted'
        },
        {
          en: 'People dance because they can express their feelings.',
          cn: '人们跳舞是因为可以表达情感。',
          point: 'because 引导原因，回答 Why 的提问',
          tip: 'express 两个 s；feelings 是复数'
        }
      ]
    },
    {
      id: 'u3',
      unit: 'Unit 3',
      theme: '#e0562f',
      focus: '顺序连接词 · should 提建议',
      patterns: [
        {
          en: 'First, find the right place.',
          cn: '首先，找到正确的位置。',
          point: 'First 开头，后面跟祈使句',
          tip: 'First 后面有逗号；祈使句开头用动词原形 find'
        },
        {
          en: 'Next, wait for the train behind the yellow line.',
          cn: '接着，在黄线后面等车。',
          point: 'Next 承接上一步',
          tip: 'wait for 要连用；behind 别写成 behide'
        },
        {
          en: 'Finally, get on the train when it arrives.',
          cn: '最后，车来了再上车。',
          point: 'Finally 收尾；when 引导时间从句',
          tip: 'get on 是"上车"；arrives 的 s 不能丢'
        },
        {
          en: 'First, choose a helmet in your size.',
          cn: '首先，选一顶适合你尺寸的头盔。',
          point: 'First + 祈使句',
          tip: 'choose 是不规则动词，过去式才是 chose'
        },
        {
          en: 'Make sure it will not fall.',
          cn: '确保它不会掉落。',
          point: 'Make sure + 一个句子',
          tip: 'Make sure 首字母大写；fall 有两个 l'
        },
        {
          en: 'We should warm up before doing exercise.',
          cn: '运动前我们应该先热身。',
          point: 'should + 动词原形，提建议',
          tip: 'should 后面不加 to；warm up 是两个词'
        },
        {
          en: 'We should learn some first aid skills.',
          cn: '我们应该学一些急救技能。',
          point: 'should + 动词原形',
          tip: 'first aid 是两个词；skills 是复数'
        }
      ]
    },
    {
      id: 'u4',
      unit: 'Unit 4',
      theme: '#12897b',
      focus: '形容词比较级 / 最高级',
      patterns: [
        {
          en: 'A train is slower than a plane.',
          cn: '火车比飞机慢。',
          point: '形容词比较级 slower + than',
          tip: 'slow → slower 直接加 -er；than 不是 then'
        },
        {
          en: 'A car is faster than a bus.',
          cn: '小汽车比公交车快。',
          point: 'fast → faster，比较级',
          tip: 'faster 后面跟 than'
        },
        {
          en: 'What is slower than a plane?',
          cn: '什么比飞机慢？',
          point: 'What 提问，配比较级',
          tip: '疑问句把 What 放句首，句末是问号'
        },
        {
          en: 'Who is the youngest in your family?',
          cn: '你家谁最小？',
          point: 'Who + 最高级提问',
          tip: '最高级前面要加 the；young → youngest'
        },
        {
          en: 'I am the youngest in my family.',
          cn: '我是家里最小的。',
          point: 'the + 最高级（三者及以上比较）',
          tip: 'the 不能丢；in my family 用 in'
        },
        {
          en: 'A horse is heavier than me.',
          cn: '马比我重。',
          point: 'heavy → heavier（辅音+y，变 y 为 i 再加 er）',
          tip: '是 heavier，不是 heavyer'
        },
        {
          en: "I'm the lightest of the three.",
          cn: '我是三个里面最轻的。',
          point: 'the + 最高级 + of + 范围',
          tip: 'light → lightest；"三个中"用 of the three'
        }
      ]
    },
    {
      id: 'u5',
      unit: 'Unit 5',
      theme: '#b7791f',
      focus: '副词比较级 / 最高级',
      patterns: [
        {
          en: 'Peter runs slowly.',
          cn: '彼得跑得慢。',
          point: '副词 slowly 修饰动词 runs',
          tip: 'slowly 修饰动词时别漏掉 ly'
        },
        {
          en: 'Eddie runs more slowly than Peter.',
          cn: '埃迪跑得比彼得慢。',
          point: '多音节副词用 more + 副词 + than',
          tip: '是 more slowly，不是 slowlier'
        },
        {
          en: 'Mark runs the most slowly of the three.',
          cn: '马克是三个人里跑得最慢的。',
          point: 'the most + 副词，构成最高级',
          tip: 'the most slowly 三个词都不能少'
        },
        {
          en: 'I came earlier than you, Meg.',
          cn: '梅格，我比你来得早。',
          point: 'early → earlier → the earliest',
          tip: '是 earlier，不是 earlyer'
        },
        {
          en: 'Harry came the earliest.',
          cn: '哈利来得最早。',
          point: '最高级前加 the',
          tip: 'the earliest 里 the 不能丢'
        },
        {
          en: 'We can travel fast with a bicycle.',
          cn: '骑自行车我们能走得很快。',
          point: 'with + 交通工具',
          tip: 'with 后面跟 a bicycle，别漏冠词'
        },
        {
          en: 'We can travel faster with a car.',
          cn: '开车我们能走得更快。',
          point: 'fast → faster，比较级',
          tip: 'fast 和 faster 都是副词，修饰 travel'
        }
      ]
    },
    {
      id: 'u6',
      unit: 'Unit 6',
      theme: '#0f7ab8',
      focus: 'nothing / no one / nobody 表完全否定',
      patterns: [
        {
          en: 'There is nothing in the fridge.',
          cn: '冰箱里什么也没有。',
          point: 'nothing 表示"没有东西"，句子本身已否定',
          tip: '不能再加 not；是 There is 不是 There are'
        },
        {
          en: 'No one could see everything.',
          cn: '没有人能看到一切。',
          point: 'no one 作主语，谓语用单数',
          tip: 'no one 是两个词，分开写'
        },
        {
          en: 'Nobody is in the museum.',
          cn: '博物馆里没有人。',
          point: 'nobody + is（第三人称单数）',
          tip: 'nobody 是一个词；别再写 not'
        },
        {
          en: 'Nobody gets bored in the city.',
          cn: '在城市里没人会无聊。',
          point: 'nobody 作主语，动词加 -s',
          tip: 'gets 的 s 不能丢；bored 结尾是 -ed'
        },
        {
          en: 'No one is happier than me!',
          cn: '没有人比我更开心了！',
          point: 'no one + 比较级，表示"最……不过"',
          tip: 'happy → happier；用 me 不用 I'
        },
        {
          en: 'No one can get bored in this theatre.',
          cn: '在这家剧院里没人会感到无聊。',
          point: 'no one + can + 动词原形',
          tip: 'theatre 是英式拼法；bored 别写成 boring'
        }
      ]
    }
  ]
};
