/**
 * 六上（沪教牛津版 2024 新版）朗读内容库
 * 每个单元包含若干「课文段落」，每段由若干可跟读句子组成。
 * 句子尽量短，适合小学生一句一句跟读；中文用于提示语义，不做逐字直译。
 */
module.exports = {
  lessons: [
    {
      id: 'u1',
      unit: 'Unit 1',
      en: 'Why do people move to new places?',
      cn: '人们为什么要搬到新的地方？',
      theme: '#4b6bfb',
      // 按课本页码顺序收录：课文正文 → 拓展阅读 → 准备 → 语法 → 对话，
      // 句子取课本原文，不再挑句/截短。
      passages: [
        {
          id: 'u1-p1',
          name: 'Postcards to a friend',
          nameCn: '课文 · 给朋友的明信片',
          sentences: [
            { id: 'u1-p1-s1', en: 'We moved here to Shenzhen yesterday.', cn: '我们昨天搬到了深圳这里。' },
            { id: 'u1-p1-s2', en: 'My parents have new jobs here.', cn: '我父母在这里有了新工作。' },
            { id: 'u1-p1-s3', en: 'It was cold in Shenyang.', cn: '沈阳很冷。' },
            { id: 'u1-p1-s4', en: "It's much warmer in Shenzhen!", cn: '深圳暖和多了！' },
            { id: 'u1-p1-s5', en: "I don't need to wear a coat or a sweater.", cn: '我不需要穿大衣或毛衣。' },
            { id: 'u1-p1-s6', en: 'I feel lonely.', cn: '我感到很孤单。' },
            { id: 'u1-p1-s7', en: 'It makes me so happy when I look at your photo.', cn: '看到你的照片时，我非常开心。' },
            { id: 'u1-p1-s8', en: 'I miss you so much!', cn: '我太想你了！' },
            { id: 'u1-p1-s9', en: "School has started and it's going OK.", cn: '开学了，一切都还不错。' },
            { id: 'u1-p1-s10', en: "I joined the school band and the volleyball team last week, so I'm quite busy.", cn: '上周我加入了学校乐队和排球队，所以挺忙的。' },
            { id: 'u1-p1-s11', en: 'Ningning and Yuanyuan from the band invited me to Happy Valley this weekend.', cn: '乐队里的宁宁和圆圆这周末邀请我去欢乐谷。' },
            { id: 'u1-p1-s12', en: "I'm so excited!", cn: '我太兴奋了！' },
            { id: 'u1-p1-s13', en: 'Guess what!', cn: '你猜怎么着！' },
            { id: 'u1-p1-s14', en: 'On Saturday, Ningning, Yuanyuan and I are going to play in a concert and raise money for homeless animals.', cn: '周六，我和宁宁、圆圆要在音乐会上演出，并为流浪动物筹款。' },
            { id: 'u1-p1-s15', en: 'I feel so happy that I can help them.', cn: '能帮助它们，我感到很开心。' },
            { id: 'u1-p1-s16', en: "I can't wait for the holiday so I can meet you!", cn: '我迫不及待地盼着假期，好和你见面！' }
          ]
        },
        {
          id: 'u1-p2',
          name: 'Moving from here to there',
          nameCn: '拓展 · 人们为什么搬家',
          sentences: [
            { id: 'u1-p2-s1', en: 'Every day, people move to new places.', cn: '每天都有人们搬到新的地方。' },
            { id: 'u1-p2-s2', en: 'Why do people move?', cn: '人们为什么要搬家？' },
            { id: 'u1-p2-s3', en: "Let's look at three important reasons.", cn: '我们来看三个重要原因。' },
            { id: 'u1-p2-s4', en: 'Cities often have more businesses, so there are more jobs for people.', cn: '城市里往往有更多企业，所以人们的工作机会更多。' },
            { id: 'u1-p2-s5', en: 'In 2001, around 38 percent of people in China lived in cities.', cn: '2001 年，中国约有 38% 的人住在城市里。' },
            { id: 'u1-p2-s6', en: 'In 2022, that number was around 65 percent.', cn: '到了 2022 年，这个数字约为 65%。' },
            { id: 'u1-p2-s7', en: 'Last year, my parents found new jobs in Chengdu, so we moved here.', cn: '去年我父母在成都找到了新工作，所以我们搬来了这里。' },
            { id: 'u1-p2-s8', en: "I'm in a new school, and I like my new friends.", cn: '我在一所新学校，我喜欢我的新朋友们。' },
            { id: 'u1-p2-s9', en: 'Some people may move to be closer to better services, such as hospitals and schools.', cn: '有些人搬家是为了离更好的服务设施更近，比如医院和学校。' },
            { id: 'u1-p2-s10', en: 'Some people may move for more space.', cn: '有些人搬家是为了更大的空间。' },
            { id: 'u1-p2-s11', en: 'When I was three, my parents sold our flat in London and bought a house outside the city.', cn: '我三岁时，父母卖掉我们在伦敦的公寓，在城外买了一栋房子。' },
            { id: 'u1-p2-s12', en: "There's lots of space to play football here.", cn: '这里有好多地方可以踢足球。' },
            { id: 'u1-p2-s13', en: 'Sometimes, people may move to make a change in their lives.', cn: '有时人们搬家是为了让生活有所改变。' },
            { id: 'u1-p2-s14', en: 'They may want to learn about another country.', cn: '他们可能想了解另一个国家。' },
            { id: 'u1-p2-s15', en: 'My family moved to China when I was five.', cn: '我五岁时，我们全家搬到了中国。' },
            { id: 'u1-p2-s16', en: 'My parents came here to study Chinese.', cn: '我父母来这里是为了学中文。' },
            { id: 'u1-p2-s17', en: 'We love this country.', cn: '我们热爱这个国家。' },
            { id: 'u1-p2-s18', en: 'As you can see, people move for many reasons, but usually for a better life.', cn: '正如你所看到的，人们搬家的原因很多，但通常都是为了更好的生活。' },
            { id: 'u1-p2-s19', en: 'Maybe one day you will move too!', cn: '也许有一天你也会搬家！' }
          ]
        },
        {
          id: 'u1-p3',
          name: 'Get ready',
          nameCn: '准备 · 搬到一个新地方',
          sentences: [
            { id: 'u1-p3-s1', en: 'My family moved here to Shenyang last week.', cn: '我们家上周搬到了沈阳。' },
            { id: 'u1-p3-s2', en: 'Everything is new here.', cn: '这里一切都是新的。' },
            { id: 'u1-p3-s3', en: 'Today was a cold winter day.', cn: '今天是寒冷的冬日。' },
            { id: 'u1-p3-s4', en: 'I got up early in the morning.', cn: '我一大早就起床了。' },
            { id: 'u1-p3-s5', en: 'I made a snowman.', cn: '我堆了一个雪人。' },
            { id: 'u1-p3-s6', en: 'Then, I met my neighbours.', cn: '然后，我遇见了我的邻居们。' },
            { id: 'u1-p3-s7', en: 'We played together.', cn: '我们一起玩。' },
            { id: 'u1-p3-s8', en: 'We threw snowballs at each other.', cn: '我们互相扔雪球。' },
            { id: 'u1-p3-s9', en: 'In the afternoon, we went ice skating.', cn: '下午我们去滑冰了。' },
            { id: 'u1-p3-s10', en: 'It was fun.', cn: '那很有趣。' },
            { id: 'u1-p3-s11', en: 'We moved to Shanghai one month ago.', cn: '我们一个月前搬到了上海。' },
            { id: 'u1-p3-s12', en: 'Before that, we lived in Beijing.', cn: '在那之前，我们住在北京。' },
            { id: 'u1-p3-s13', en: 'Yesterday, I went to my new school for the first time.', cn: '昨天，我第一次去了我的新学校。' }
          ]
        },
        {
          id: 'u1-p4',
          name: 'Grammar in use',
          nameCn: '语法 · 一般过去时',
          sentences: [
            { id: 'u1-p4-s1', en: 'I moved to a house near a park.', cn: '我搬到了公园附近的一栋房子。' },
            { id: 'u1-p4-s2', en: "When I'm sleepy, I run to the park.", cn: '当我困的时候，我就跑去公园。' },
            { id: 'u1-p4-s3', en: "That's a good idea.", cn: '那是个好主意。' },
            { id: 'u1-p4-s4', en: "When you run, you won't feel sleepy.", cn: '你跑起来就不会觉得困了。' },
            { id: 'u1-p4-s5', en: 'I run to the park because my favourite tree is there.', cn: '我跑去公园，因为我最喜欢的那棵树在那里。' },
            { id: 'u1-p4-s6', en: 'I like to take a nap under it.', cn: '我喜欢在树下打个盹。' },
            { id: 'u1-p4-s7', en: "It's quiet.", cn: '那里很安静。' },
            { id: 'u1-p4-s8', en: 'Mike moved to Shenzhen yesterday.', cn: '迈克昨天搬到了深圳。' },
            { id: 'u1-p4-s9', en: 'I joined the school band last week.', cn: '我上周加入了学校乐队。' },
            { id: 'u1-p4-s10', en: 'Mark moved to Beijing last year.', cn: '马克去年搬到了北京。' },
            { id: 'u1-p4-s11', en: 'Bella went to a new school two years ago.', cn: '贝拉两年前去了一所新学校。' },
            { id: 'u1-p4-s12', en: 'Mia cleaned her new house yesterday.', cn: '米娅昨天打扫了她的新房子。' }
          ]
        },
        {
          id: 'u1-p5',
          name: 'Communicate',
          nameCn: '对话 · 你想搬到哪里',
          sentences: [
            { id: 'u1-p5-s1', en: 'Where do you want to move?', cn: '你想搬到哪里去？' },
            { id: 'u1-p5-s2', en: 'I want to move to Harbin.', cn: '我想搬到哈尔滨。' },
            { id: 'u1-p5-s3', en: 'When I move there, I can enjoy winter sports.', cn: '搬到那里以后，我就能玩冬季运动了。' }
          ]
        }
      ],
      words: [
        { en: 'meet the neighbours', ph: '/miːt ðə ˈneɪbəz/', cn: '见见邻居们' },
        { en: 'make new friends', ph: '/meɪk njuː frendz/', cn: '交新朋友' },
        { en: 'go ice skating', ph: '/ɡəʊ aɪs ˈskeɪtɪŋ/', cn: '去滑冰' },
        { en: 'throw snowballs', ph: '/θrəʊ ˈsnəʊbɔːlz/', cn: '扔雪球' },
        { en: 'postcard', ph: '/ˈpəʊstkɑːd/', cn: '明信片' },
        { en: 'lonely', ph: '/ˈləʊnli/', cn: '孤独的' },
        { en: 'miss', ph: '/mɪs/', cn: '想念' },
        { en: 'homeless', ph: '/ˈhəʊmləs/', cn: '无家可归的' },
        { en: 'band', ph: '/bænd/', cn: '乐队' },
        { en: 'concert', ph: '/ˈkɒnsət/', cn: '音乐会' },
        { en: 'raise money', ph: '/reɪz ˈmʌni/', cn: '筹款' },
        { en: 'excited', ph: '/ɪkˈsaɪtɪd/', cn: '兴奋的' },
        { en: 'service', ph: '/ˈsɜːvɪs/', cn: '服务' },
        { en: 'reason', ph: '/ˈriːzn/', cn: '原因' }
      ]
    },

    {
      id: 'u2',
      unit: 'Unit 2',
      en: 'Why do we make art?',
      cn: '我们为什么要创作艺术？',
      theme: '#6d4ad8',
      passages: [
        {
          id: 'u2-p1',
          name: 'The power of art',
          nameCn: '课文 · 艺术的力量',
          sentences: [
            { id: 'u2-p1-s1', en: 'Almost everyone enjoys looking at works of art.', cn: '几乎每个人都喜欢欣赏艺术作品。' },
            { id: 'u2-p1-s2', en: 'Art can be very powerful.', cn: '艺术可以非常有力。' },
            { id: 'u2-p1-s3', en: "Artists try to express themselves and touch people's hearts.", cn: '艺术家们努力表达自己、打动人心。' },
            { id: 'u2-p1-s4', en: 'Painters have their own styles.', cn: '画家有自己的风格。' },
            { id: 'u2-p1-s5', en: "Some paintings look real and some don't.", cn: '有些画看起来逼真，有些则不然。' },
            { id: 'u2-p1-s6', en: "But all paintings show the painters' feelings.", cn: '但所有的画都表达画家的情感。' },
            { id: 'u2-p1-s7', en: 'This painting looks real.', cn: '这幅画看起来很逼真。' },
            { id: 'u2-p1-s8', en: "This painting shows the painter's feelings.", cn: '这幅画表达了画家的情感。' },
            { id: 'u2-p1-s9', en: 'Xu Beihong was a Chinese artist.', cn: '徐悲鸿是中国画家。' },
            { id: 'u2-p1-s10', en: 'He was good at ink painting.', cn: '他擅长水墨画。' },
            { id: 'u2-p1-s11', en: 'He liked to paint proud animals, such as lions and horses.', cn: '他喜欢画威风凛凛的动物，如狮子和马。' },
            { id: 'u2-p1-s12', en: 'He wanted people to cheer up and be brave.', cn: '他想让人们振作起来、勇敢面对。' },
            { id: 'u2-p1-s13', en: 'Xu Beihong painted running horses.', cn: '徐悲鸿画奔马。' },
            { id: 'u2-p1-s14', en: 'Vincent van Gogh was a Dutch artist.', cn: '梵高是荷兰画家。' },
            { id: 'u2-p1-s15', en: 'He did oil painting.', cn: '他画油画。' },
            { id: 'u2-p1-s16', en: 'He is famous for using bright colours.', cn: '他以使用明亮的色彩而闻名。' },
            { id: 'u2-p1-s17', en: 'Vincent van Gogh painted flowers in bright colours.', cn: '梵高用明亮的色彩画花。' },
            { id: 'u2-p1-s18', en: 'Look at the sunflowers in this painting.', cn: '看这幅画里的向日葵。' },
            { id: 'u2-p1-s19', en: 'How does it make you feel?', cn: '它让你感觉如何？' },
            { id: 'u2-p1-s20', en: 'Artists show us the world in their eyes.', cn: '艺术家向我们展示他们眼中的世界。' },
            { id: 'u2-p1-s21', en: 'We can always feel the power of a good work of art.', cn: '我们总能感受到一件优秀艺术作品的力量。' }
          ]
        },
        {
          id: 'u2-p2',
          name: 'Artists in my family',
          nameCn: '拓展 · 我家的艺术家们',
          sentences: [
            { id: 'u2-p2-s1', en: 'It is Saturday morning.', cn: '星期六早上。' },
            { id: 'u2-p2-s2', en: "Everyone in my family is preparing for Grandpa's birthday.", cn: '我们全家人都在为爷爷的生日做准备。' },
            { id: 'u2-p2-s3', en: 'Grandpa and Dad are shopping in the supermarket.', cn: '爷爷和爸爸在超市购物。' },
            { id: 'u2-p2-s4', en: 'My sister and I are in the living room.', cn: '我和妹妹在客厅里。' },
            { id: 'u2-p2-s5', en: 'We want to make something special for Grandpa.', cn: '我们想为爷爷做点特别的东西。' },
            { id: 'u2-p2-s6', en: 'My sister is painting colourful fish on stones.', cn: '妹妹正在石头上画彩色的小鱼。' },
            { id: 'u2-p2-s7', en: 'I am drawing a picture of our dog, Ginger, but she does not sit still.', cn: '我在画我们的狗 Ginger，可它坐不住。' },
            { id: 'u2-p2-s8', en: 'She smells something in the kitchen and runs off.', cn: '它闻到厨房里有味道，就跑开了。' },
            { id: 'u2-p2-s9', en: 'Grandma is in the kitchen.', cn: '奶奶在厨房里。' },
            { id: 'u2-p2-s10', en: 'She is making some traditional Chinese cakes.', cn: '她正在做传统的中式糕点。' },
            { id: 'u2-p2-s11', en: 'Some look like butterflies and some look like flowers.', cn: '有的像蝴蝶，有的像花。' },
            { id: 'u2-p2-s12', en: 'Ginger wants to eat one.', cn: 'Ginger 想吃一块。' },
            { id: 'u2-p2-s13', en: '"No, Ginger!" says Grandma.', cn: '“不行，Ginger！”奶奶说。' },
            { id: 'u2-p2-s14', en: 'Ginger runs back to the living room.', cn: 'Ginger 跑回客厅。' },
            { id: 'u2-p2-s15', en: 'Mum is here.', cn: '妈妈在那儿。' },
            { id: 'u2-p2-s16', en: 'She is cutting the flowers and putting them in a vase.', cn: '她正在剪花并把花插进花瓶。' },
            { id: 'u2-p2-s17', en: 'How amazing they look!', cn: '看起来太漂亮了！' },
            { id: 'u2-p2-s18', en: 'Where is Ginger now?', cn: 'Ginger 现在在哪儿？' },
            { id: 'u2-p2-s19', en: 'She is running through the living room!', cn: '它正跑着穿过客厅！' },
            { id: 'u2-p2-s20', en: 'Oops! She knocks over the paint.', cn: '哎呀！它打翻了颜料。' },
            { id: 'u2-p2-s21', en: 'Look! She is making blue footprints on my paper.', cn: '看！它在我的纸上踩出了一串蓝色的脚印。' },
            { id: 'u2-p2-s22', en: 'Grandpa comes back and he is really surprised.', cn: '爷爷回来了，他非常惊讶。' },
            { id: 'u2-p2-s23', en: '"Wow, thanks for all of these. Everyone is an artist!" he says.', cn: '“哇，谢谢你们做的这一切。每个人都是艺术家！”他说。' }
          ]
        },
        {
          id: 'u2-p3',
          name: 'The art of painting',
          nameCn: '准备 · 绘画的艺术',
          sentences: [
            { id: 'u2-p3-s1', en: 'What kinds of art do you know?', cn: '你知道哪些种类的艺术？' },
            { id: 'u2-p3-s2', en: 'I like this oil painting.', cn: '我喜欢这幅油画。' },
            { id: 'u2-p3-s3', en: 'The red apple looks so real.', cn: '这个红苹果看起来太逼真了。' },
            { id: 'u2-p3-s4', en: 'I want to eat it.', cn: '我都想吃了。' },
            { id: 'u2-p3-s5', en: 'I like the ink painting best.', cn: '我最喜欢水墨画。' },
            { id: 'u2-p3-s6', en: 'This kind of painting has a long history in China.', cn: '这种画在中国历史悠久。' },
            { id: 'u2-p3-s7', en: 'The artists often paint mountains, flowers and birds.', cn: '画家们常画山、花和鸟。' },
            { id: 'u2-p3-s8', en: 'Recycled art is very popular.', cn: '再生艺术很流行。' },
            { id: 'u2-p3-s9', en: 'Artists make recycled art from old things.', cn: '艺术家用旧物创作再生艺术。' },
            { id: 'u2-p3-s10', en: 'They use old paper, bottles and some other things.', cn: '他们使用旧纸、瓶子和其他一些东西。' },
            { id: 'u2-p3-s11', en: 'Recycled art is friendly to the Earth.', cn: '再生艺术对地球友好。' },
            { id: 'u2-p3-s12', en: 'Artists reuse old things.', cn: '艺术家重复利用旧物。' },
            { id: 'u2-p3-s13', en: 'It teaches people to protect our Earth.', cn: '它教会人们保护我们的地球。' },
            { id: 'u2-p3-s14', en: 'Do you like making art?', cn: '你喜欢创作艺术吗？' }
          ]
        },
        {
          id: 'u2-p4',
          name: 'Be an artist',
          nameCn: '语法 · 一般过去时（be 动词）',
          sentences: [
            { id: 'u2-p4-s1', en: 'Anyone can be an artist.', cn: '任何人都能成为艺术家。' },
            { id: 'u2-p4-s2', en: 'And make art from anything.', cn: '用任何东西创作艺术。' },
            { id: 'u2-p4-s3', en: 'I made something beautiful.', cn: '我做出了漂亮的东西。' },
            { id: 'u2-p4-s4', en: 'With just a ball of string!', cn: '只用了一团线！' },
            { id: 'u2-p4-s5', en: 'I glued the string in a circle.', cn: '我把线粘成一个圆圈。' },
            { id: 'u2-p4-s6', en: 'And added a head and a tail.', cn: '加上头和尾巴。' },
            { id: 'u2-p4-s7', en: 'I painted it yellow, blue and green.', cn: '我把它涂成黄色、蓝色和绿色。' },
            { id: 'u2-p4-s8', en: "Now look! It's a beautiful snail!", cn: '看！这是一只漂亮的蜗牛！' },
            { id: 'u2-p4-s9', en: 'He was a Chinese artist.', cn: '他是一位中国画家。' },
            { id: 'u2-p4-s10', en: 'He painted horses.', cn: '他画马。' },
            { id: 'u2-p4-s11', en: 'Who is he?', cn: '他是谁？' },
            { id: 'u2-p4-s12', en: 'Is he Xu Beihong?', cn: '他是徐悲鸿吗？' },
            { id: 'u2-p4-s13', en: "Yes, you're right.", cn: '是的，你答对了。' }
          ]
        },
        {
          id: 'u2-p5',
          name: 'Why do people make art?',
          nameCn: '对话 · 人们为什么创作艺术',
          sentences: [
            { id: 'u2-p5-s1', en: 'Why do the children like these kinds of art?', cn: '孩子们为什么喜欢这些种类的艺术？' },
            { id: 'u2-p5-s2', en: 'Lin Xuan likes ink painting because she wants to express her feelings.', cn: '林萱喜欢水墨画，因为她想表达自己的情感。' },
            { id: 'u2-p5-s3', en: 'Why do people dance?', cn: '人们为什么跳舞？' },
            { id: 'u2-p5-s4', en: 'People dance because they can express their feelings.', cn: '人们跳舞，因为他们可以表达情感。' },
            { id: 'u2-p5-s5', en: 'Why do people take photos?', cn: '人们为什么拍照？' },
            { id: 'u2-p5-s6', en: 'People take photos because they want to share the beauty of life.', cn: '人们拍照，因为他们想分享生活之美。' },
            { id: 'u2-p5-s7', en: 'Why do people play music?', cn: '人们为什么演奏音乐？' },
            { id: 'u2-p5-s8', en: 'People play music because they want to have fun.', cn: '人们演奏音乐，因为他们想找乐子。' },
            { id: 'u2-p5-s9', en: 'Why do people make films?', cn: '人们为什么拍电影？' },
            { id: 'u2-p5-s10', en: 'People make films because they want to tell stories.', cn: '人们拍电影，因为他们想讲故事。' },
            { id: 'u2-p5-s11', en: 'What kinds of art do you make?', cn: '你创作哪些种类的艺术？' }
          ]
        }
      ],
      words: [
        { en: 'ink painting', ph: '/ɪŋk ˈpeɪntɪŋ/', cn: '水墨画' },
        { en: 'oil painting', ph: '/ɔɪl ˈpeɪntɪŋ/', cn: '油画' },
        { en: 'artist', ph: '/ˈɑːtɪst/', cn: '美术家；画家' },
        { en: 'paintbrush', ph: '/ˈpeɪntbrʌʃ/', cn: '画笔' },
        { en: 'painter', ph: '/ˈpeɪntə(r)/', cn: '画家' },
        { en: 'powerful', ph: '/ˈpaʊəfl/', cn: '有力量的' },
        { en: 'express', ph: '/ɪkˈspres/', cn: '表达' },
        { en: 'feeling', ph: '/ˈfiːlɪŋ/', cn: '感情，感受' },
        { en: 'touch one\'s heart', ph: '/tʌtʃ hɑːt/', cn: '打动某人的心' },
        { en: 'be famous for', ph: '/ˈfeɪməs/', cn: '因……而出名' },
        { en: 'bright', ph: '/braɪt/', cn: '明亮的；鲜艳的' },
        { en: 'sunflower', ph: '/ˈsʌnflaʊə(r)/', cn: '向日葵' },
        { en: 'brave', ph: '/breɪv/', cn: '勇敢的' },
        { en: 'cheer up', ph: '/tʃɪə(r) ʌp/', cn: '振作起来' },
        { en: 'anyone', ph: '/ˈeniwʌn/', cn: '任何人' },
        { en: 'share', ph: '/ʃeə(r)/', cn: '分享' }
      ]
    },

    {
      id: 'u3',
      unit: 'Unit 3',
      en: 'How should we protect ourselves?',
      cn: '我们应该怎样保护自己？',
      theme: '#e0562f',
      passages: [
        {
          id: 'u3-p1',
          name: 'Student breaks arm while skateboarding',
          nameCn: '课文 · 滑板受伤的新闻',
          sentences: [
            { id: 'u3-p1-s1', en: 'Yesterday afternoon, Wang Hao, a 12-year-old boy from our school, broke his arm at the skatepark.', cn: '昨天下午，我们学校12岁的男孩王浩在滑板场摔断了手臂。' },
            { id: 'u3-p1-s2', en: 'He was in a game with his friends and went over a small stone on the road.', cn: '他和朋友们比赛时，压过了路上的一块小石头。' },
            { id: 'u3-p1-s3', en: 'Wang Hao got hurt and broke his arm.', cn: '王浩受了伤，摔断了手臂。' },
            { id: 'u3-p1-s4', en: "Luckily, he didn't have more injuries, because he wore a helmet and pads.", cn: '幸运的是，因为他戴了头盔和护垫，没有受更多的伤。' },
            { id: 'u3-p1-s5', en: 'Xu Li, a friend of Wang Hao, called an ambulance.', cn: '王浩的朋友许力叫了救护车。' },
            { id: 'u3-p1-s6', en: 'The ambulance arrived soon.', cn: '救护车很快就到了。' },
            { id: 'u3-p1-s7', en: "First, the emergency workers checked Wang Hao's injuries.", cn: '首先，急救人员检查了王浩的伤势。' },
            { id: 'u3-p1-s8', en: 'Then, they took him to the hospital for an X-ray.', cn: '然后，他们送他去医院拍X光片。' },
            { id: 'u3-p1-s9', en: 'He is now resting at home.', cn: '他现在正在家里休息。' },
            { id: 'u3-p1-s10', en: 'Sports safety tips for students.', cn: '学生运动安全小贴士。' },
            { id: 'u3-p1-s11', en: 'Choose a safe place.', cn: '选择安全的场地。' },
            { id: 'u3-p1-s12', en: 'Always warm up first.', cn: '总是先做热身。' },
            { id: 'u3-p1-s13', en: 'Follow the sports rules.', cn: '遵守运动规则。' },
            { id: 'u3-p1-s14', en: 'Take a break when you are tired. Drink some water.', cn: '累了要休息，喝点水。' },
            { id: 'u3-p1-s15', en: 'How did Wang Hao protect himself?', cn: '王浩是怎样保护自己的？' }
          ]
        },
        {
          id: 'u3-p2',
          name: 'Health and safety tips for kids',
          nameCn: '拓展 · 安全与急救小贴士',
          sentences: [
            { id: 'u3-p2-s1', en: 'Health and safety tips for kids.', cn: '儿童健康与安全小贴士。' },
            { id: 'u3-p2-s2', en: 'First aid for a nosebleed.', cn: '流鼻血的急救。' },
            { id: 'u3-p2-s3', en: 'Sit down and lean forward.', cn: '坐下，身体前倾。' },
            { id: 'u3-p2-s4', en: 'Press your nose for 5 to 10 minutes.', cn: '捏住鼻子5到10分钟。' },
            { id: 'u3-p2-s5', en: 'First aid for a twisted ankle.', cn: '扭伤脚踝的急救。' },
            { id: 'u3-p2-s6', en: 'First, take your shoe off.', cn: '首先，脱掉鞋子。' },
            { id: 'u3-p2-s7', en: 'Next, put a cool cloth on your ankle for 15 to 20 minutes.', cn: '接着，用凉毛巾敷脚踝15到20分钟。' },
            { id: 'u3-p2-s8', en: 'Then, lift up your ankle and rest it.', cn: '然后，抬起脚踝休息。' },
            { id: 'u3-p2-s9', en: 'First aid for an animal bite.', cn: '被动物咬伤的急救。' },
            { id: 'u3-p2-s10', en: 'Clean the bite.', cn: '清洗伤口。' },
            { id: 'u3-p2-s11', en: 'If it is bleeding, press it.', cn: '如果出血，按压伤口。' },
            { id: 'u3-p2-s12', en: 'When it stops bleeding, put some medicine on it.', cn: '血止住后，涂些药。' },
            { id: 'u3-p2-s13', en: 'Cover the bite with a clean cloth.', cn: '用干净的布把伤口包起来。' },
            { id: 'u3-p2-s14', en: 'You should go to see the doctor after getting first aid.', cn: '做了急救后你应该去看医生。' },
            { id: 'u3-p2-s15', en: 'What other first aid tips do you know?', cn: '你还知道哪些急救小贴士？' }
          ]
        },
        {
          id: 'u3-p3',
          name: 'Sports safety',
          nameCn: '准备 · 运动安全',
          sentences: [
            { id: 'u3-p3-s1', en: 'How can you protect yourself when you do sport?', cn: '做运动时你怎样才能保护自己？' },
            { id: 'u3-p3-s2', en: 'We should warm up before doing exercise.', cn: '我们应该在锻炼前做热身。' },
            { id: 'u3-p3-s3', en: 'When someone gets hurt, we should try to help.', cn: '当有人受伤时，我们应该尽力帮忙。' },
            { id: 'u3-p3-s4', en: 'Here are some swimming tips for you.', cn: '这里有一些游泳小贴士给你。' },
            { id: 'u3-p3-s5', en: 'First, put on your swimsuit and swimming cap.', cn: '首先，穿上泳衣、戴上泳帽。' },
            { id: 'u3-p3-s6', en: 'Next, do warm-up exercises.', cn: '接着，做热身运动。' },
            { id: 'u3-p3-s7', en: 'Then, put on your swimming goggles, so the water does not get into your eyes.', cn: '然后，戴上泳镜，这样水就不会进到眼睛里。' },
            { id: 'u3-p3-s8', en: 'Finally, you can get into the water and swim.', cn: '最后，你可以下水游泳了。' },
            { id: 'u3-p3-s9', en: 'When someone gets hurt, what can you do to help?', cn: '当有人受伤时，你能做什么来帮助他？' }
          ]
        },
        {
          id: 'u3-p4',
          name: 'First, next, then, finally',
          nameCn: '语法 · 先后顺序与建议',
          sentences: [
            { id: 'u3-p4-s1', en: 'How do you take the underground?', cn: '你怎么乘地铁？' },
            { id: 'u3-p4-s2', en: 'Let me show you!', cn: '让我给你演示！' },
            { id: 'u3-p4-s3', en: 'First, find the right place.', cn: '首先，找到正确的位置。' },
            { id: 'u3-p4-s4', en: 'Next, wait for the train behind the yellow line.', cn: '接着，在黄线后面等车。' },
            { id: 'u3-p4-s5', en: 'Finally, get on the train when it arrives.', cn: '最后，车来了再上车。' },
            { id: 'u3-p4-s6', en: "But where's the driver?", cn: '可是司机在哪里？' },
            { id: 'u3-p4-s7', en: 'Ha ha! This is a driverless train.', cn: '哈哈！这是一列无人驾驶列车。' },
            { id: 'u3-p4-s8', en: 'Choose a helmet in your size.', cn: '选一顶适合你尺寸的头盔。' },
            { id: 'u3-p4-s9', en: 'Not too big, not too small.', cn: '不要太大，也不要太小。' },
            { id: 'u3-p4-s10', en: 'Check the helmet.', cn: '检查头盔。' },
            { id: 'u3-p4-s11', en: 'Always check your helmet before using.', cn: '使用前一定要检查头盔。' },
            { id: 'u3-p4-s12', en: 'Put on the helmet.', cn: '戴上头盔。' },
            { id: 'u3-p4-s13', en: 'Make sure it will not fall.', cn: '确保它不会掉落。' },
            { id: 'u3-p4-s14', en: 'We should warm up before doing exercise.', cn: '我们应该在锻炼前做热身。' }
          ]
        },
        {
          id: 'u3-p5',
          name: 'What should we do?',
          nameCn: '对话 · 遇到危险怎么办',
          sentences: [
            { id: 'u3-p5-s1', en: 'There was a fire in a building.', cn: '一栋大楼发生了火灾。' },
            { id: 'u3-p5-s2', en: 'First, Li Jie called 119 with his mobile phone.', cn: '首先，李杰用手机拨打了119。' },
            { id: 'u3-p5-s3', en: 'He told them the address of the building.', cn: '他告诉了他们大楼的地址。' },
            { id: 'u3-p5-s4', en: 'Next, he called for help.', cn: '接着，他大声呼救。' },
            { id: 'u3-p5-s5', en: 'Then, they made loud noises to warn people inside.', cn: '然后，他们制造很大的声响来提醒里面的人。' },
            { id: 'u3-p5-s6', en: 'Li Jie told them not to use the lift.', cn: '李杰告诉他们不要乘电梯。' },
            { id: 'u3-p5-s7', en: 'The firefighters came very soon.', cn: '消防员很快就来了。' },
            { id: 'u3-p5-s8', en: 'Finally, the firefighters put out the fire.', cn: '最后，消防员把火扑灭了。' },
            { id: 'u3-p5-s9', en: 'A little girl is lost in the city.', cn: '一个小女孩在城市里迷路了。' },
            { id: 'u3-p5-s10', en: 'What should she do?', cn: '她应该做什么？' },
            { id: 'u3-p5-s11', en: 'First, she should ask someone for help.', cn: '首先，她应该向别人求助。' },
            { id: 'u3-p5-s12', en: 'When you see a fire in the park, what should you do?', cn: '当你在公园看到火灾时，你应该做什么？' },
            { id: 'u3-p5-s13', en: 'We should wear safety equipment when we do sport.', cn: '做运动时我们应该佩戴安全装备。' },
            { id: 'u3-p5-s14', en: 'We should learn some first aid skills.', cn: '我们应该学习一些急救技能。' }
          ]
        }
      ],
      words: [
        { en: 'protect', ph: '/prəˈtekt/', cn: '保护' },
        { en: 'warm up', ph: '/wɔːm ʌp/', cn: '热身' },
        { en: 'get hurt', ph: '/ɡet hɜːt/', cn: '受伤' },
        { en: 'call for help', ph: '/kɔːl fə help/', cn: '呼救' },
        { en: 'break', ph: '/breɪk/', cn: '（使）破，裂，碎' },
        { en: 'arm', ph: '/ɑːm/', cn: '手臂' },
        { en: 'helmet', ph: '/ˈhelmɪt/', cn: '头盔' },
        { en: 'pad', ph: '/pæd/', cn: '防护垫' },
        { en: 'call an ambulance', ph: '/ˈæmbjələns/', cn: '叫救护车' },
        { en: 'check injuries', ph: '/tʃek ˈɪndʒəriz/', cn: '检查受伤情况' },
        { en: 'emergency worker', ph: '/ɪˈmɜːdʒənsi/', cn: '应急工作人员' },
        { en: 'X-ray', ph: '/ˈeks reɪ/', cn: 'X光检查' },
        { en: 'choose', ph: '/tʃuːz/', cn: '选择' },
        { en: 'lost', ph: '/lɒst/', cn: '迷路的' },
        { en: 'brave', ph: '/breɪv/', cn: '勇敢的' },
        { en: 'first aid', ph: '/fɜːst eɪd/', cn: '急救' }
      ]
    },

    {
      id: 'u4',
      unit: 'Unit 4',
      en: 'What makes things move?',
      cn: '是什么让物体运动？',
      theme: '#12897b',
      passages: [
        {
          id: 'u4-p1',
          name: 'Forces and movement',
          nameCn: '课文 · 力与运动',
          sentences: [
            { id: 'u4-p1-s1', en: 'We see things moving every day.', cn: '我们每天都能看到物体在运动。' },
            { id: 'u4-p1-s2', en: 'We see people walking, birds flying and leaves falling.', cn: '我们看到人们走路、鸟儿飞翔、树叶飘落。' },
            { id: 'u4-p1-s3', en: 'What makes things move?', cn: '是什么让物体运动？' },
            { id: 'u4-p1-s4', en: 'A force can make something move.', cn: '力可以让物体运动。' },
            { id: 'u4-p1-s5', en: 'A push is a force.', cn: '推是一种力。' },
            { id: 'u4-p1-s6', en: 'When we push, it moves people or things away from us.', cn: '当我们推时，它使人或物体远离我们。' },
            { id: 'u4-p1-s7', en: 'A pull is a force too.', cn: '拉也是一种力。' },
            { id: 'u4-p1-s8', en: 'When we pull, it moves people or things towards us.', cn: '当我们拉时，它使人或物体靠近我们。' },
            { id: 'u4-p1-s9', en: 'A small force causes a small movement and a big force causes a big movement.', cn: '小的力产生小的运动，大的力产生大的运动。' },
            { id: 'u4-p1-s10', en: 'When we use a small force to throw a ball, it does not go far.', cn: '当我们用小的力扔球时，球扔不远。' },
            { id: 'u4-p1-s11', en: 'When we use a big force, it goes a long way.', cn: '当我们用大的力时，球能扔很远。' },
            { id: 'u4-p1-s12', en: 'Also, it is easier to move a light thing than a heavy thing.', cn: '而且，移动轻的东西比移动重的东西更容易。' },
            { id: 'u4-p1-s13', en: 'Speed is how fast things move.', cn: '速度是物体运动有多快。' },
            { id: 'u4-p1-s14', en: 'Some things, like trains, move fast, and some things, like tortoises, move slowly.', cn: '有些东西，比如火车，运动得快；有些东西，比如乌龟，运动得慢。' },
            { id: 'u4-p1-s15', en: 'A car is faster than a horse.', cn: '汽车比马快。' },
            { id: 'u4-p1-s16', en: 'A high-speed train is faster than a car.', cn: '高铁比汽车快。' },
            { id: 'u4-p1-s17', en: 'A plane is the fastest of all.', cn: '飞机是所有之中最快的。' },
            { id: 'u4-p1-s18', en: 'A force can change the speed of things.', cn: '力可以改变物体的速度。' },
            { id: 'u4-p1-s19', en: 'When you push a door with a small force, it opens slowly.', cn: '当你用小的力推门时，门开得慢。' },
            { id: 'u4-p1-s20', en: 'When you push it with a bigger force, it opens more quickly.', cn: '当你用更大的力推它时，门开得更快。' },
            { id: 'u4-p1-s21', en: 'Next time you see something moving, ask yourself, "What force is moving it, a push or a pull?"', cn: '下次你看到物体在运动时，问问自己：“是什么力在使它运动，是推还是拉？”' },
            { id: 'u4-p1-s22', en: 'Is the force small or big?', cn: '这个力是大还是小？' }
          ]
        },
        {
          id: 'u4-p2',
          name: 'Two stubborn little goats',
          nameCn: '拓展 · 两只倔山羊',
          sentences: [
            { id: 'u4-p2-s1', en: 'A long time ago, two brothers, Black Goat and Brown Goat, lived on East Mountain together.', cn: '很久以前，黑山羊和棕山羊两兄弟一起住在东山上。' },
            { id: 'u4-p2-s2', en: 'One day, they saw a small piece of the greenest grass.', cn: '一天，他们看到一小片最绿的草。' },
            { id: 'u4-p2-s3', en: 'Brown Goat said, "I\'m older. I should eat the grass."', cn: '棕山羊说：“我年纪大，我应该吃这草。”' },
            { id: 'u4-p2-s4', en: 'Black Goat said, "I\'m smarter. I should eat it."', cn: '黑山羊说：“我更聪明，我应该吃。”' },
            { id: 'u4-p2-s5', en: 'They pushed each other for a long time and got tired.', cn: '他们互相推挤了很久，都累了。' },
            { id: 'u4-p2-s6', en: 'Black Goat was angry and moved to West Mountain.', cn: '黑山羊很生气，搬到了西山。' },
            { id: 'u4-p2-s7', en: 'Every day, Brown Goat crossed a small bridge to drink the coldest water on West Mountain.', cn: '每天，棕山羊过一座小桥去喝西山上最凉的水。' },
            { id: 'u4-p2-s8', en: 'Every day, Black Goat crossed the bridge to eat the greenest grass on East Mountain.', cn: '每天，黑山羊过桥去吃东山上最绿的草。' },
            { id: 'u4-p2-s9', en: 'One day, both goats were on the bridge at the same time.', cn: '一天，两只山羊同时上了桥。' },
            { id: 'u4-p2-s10', en: 'Brown Goat said, "Go back! I\'m crossing first."', cn: '棕山羊说：“退回去！我要先过。”' },
            { id: 'u4-p2-s11', en: 'Black Goat said, "You go back!"', cn: '黑山羊说：“你退回去！”' },
            { id: 'u4-p2-s12', en: 'They pushed each other with the same force.', cn: '他们用同样大小的力互相推挤。' },
            { id: 'u4-p2-s13', en: 'They pushed until they both fell into the river below the bridge.', cn: '他们一直推到双双掉进桥下的河里。' },
            { id: 'u4-p2-s14', en: 'The goats got out of the river and walked home.', cn: '山羊们从河里爬出来走回家。' },
            { id: 'u4-p2-s15', en: 'They were angry, tired and hungry.', cn: '他们又生气又累又饿。' },
            { id: 'u4-p2-s16', en: 'And that was the story of the two stubborn little goats.', cn: '这就是两只倔山羊的故事。' },
            { id: 'u4-p2-s17', en: 'When are two forces not bigger than one?', cn: '什么时候两个力不比一个力大？' }
          ]
        },
        {
          id: 'u4-p3',
          name: 'Push and pull forces in daily life',
          nameCn: '准备 · 日常生活中的推与拉',
          sentences: [
            { id: 'u4-p3-s1', en: 'What things around you can move?', cn: '你周围哪些东西能动？' },
            { id: 'u4-p3-s2', en: 'A man pushes the car.', cn: '一名男子推汽车。' },
            { id: 'u4-p3-s3', en: 'It is heavy.', cn: '车很重。' },
            { id: 'u4-p3-s4', en: 'We pull hard.', cn: '我们用力拉。' },
            { id: 'u4-p3-s5', en: 'It is really difficult to win.', cn: '要赢真的很难。' },
            { id: 'u4-p3-s6', en: 'The man has a lot of bananas on his bike.', cn: '那人的自行车上有很多香蕉。' },
            { id: 'u4-p3-s7', en: 'It is heavy, so it is difficult to move.', cn: '车很重，移动起来很困难。' },
            { id: 'u4-p3-s8', en: 'It is light, so it is easy to move.', cn: '它很轻，移动起来很容易。' },
            { id: 'u4-p3-s9', en: 'Chicks cannot fly when they are very small.', cn: '小鸡很小的时候不会飞。' },
            { id: 'u4-p3-s10', en: 'So their parents get food for them.', cn: '所以它们的父母为它们找食物。' },
            { id: 'u4-p3-s11', en: 'Chicks move their wings in the nest.', cn: '小鸡在巢里活动翅膀。' },
            { id: 'u4-p3-s12', en: 'Their wings get strong.', cn: '它们的翅膀变得强壮。' },
            { id: 'u4-p3-s13', en: 'When the chicks get big, they leave the nest.', cn: '小鸡长大后，就离开巢。' },
            { id: 'u4-p3-s14', en: 'They move their wings up and down and fly in the air.', cn: '它们上下扇动翅膀，飞到空中。' },
            { id: 'u4-p3-s15', en: 'What things are moving around you?', cn: '你周围有什么东西在动？' }
          ]
        },
        {
          id: 'u4-p4',
          name: 'The horse, the tortoise and me',
          nameCn: '语法 · 比较级与最高级',
          sentences: [
            { id: 'u4-p4-s1', en: 'A horse is faster than a tortoise.', cn: '马比乌龟快。' },
            { id: 'u4-p4-s2', en: 'And a horse is faster than me.', cn: '马也比我快。' },
            { id: 'u4-p4-s3', en: "I'm faster than a tortoise.", cn: '我比乌龟快。' },
            { id: 'u4-p4-s4', en: "So who's the slowest of the three?", cn: '那么三个之中谁最慢？' },
            { id: 'u4-p4-s5', en: 'A horse is bigger than a tortoise.', cn: '马比乌龟大。' },
            { id: 'u4-p4-s6', en: 'And a horse is bigger than me.', cn: '马也比我大。' },
            { id: 'u4-p4-s7', en: "I'm bigger than a tortoise.", cn: '我比乌龟大。' },
            { id: 'u4-p4-s8', en: "So who's the smallest of the three?", cn: '那么三个之中谁最小？' },
            { id: 'u4-p4-s9', en: 'A horse is heavier than me.', cn: '马比我重。' },
            { id: 'u4-p4-s10', en: "I'm heavier than a tortoise.", cn: '我比乌龟重。' },
            { id: 'u4-p4-s11', en: "So who's the lightest of the three?", cn: '那么三个之中谁最轻？' },
            { id: 'u4-p4-s12', en: 'What is slower than a plane?', cn: '什么比飞机慢？' },
            { id: 'u4-p4-s13', en: 'A train is slower than a plane.', cn: '火车比飞机慢。' },
            { id: 'u4-p4-s14', en: 'Who is the youngest in your family?', cn: '你家里谁最小？' },
            { id: 'u4-p4-s15', en: 'I am the youngest in my family.', cn: '我是家里最小的。' },
            { id: 'u4-p4-s16', en: "What's faster than a bus?", cn: '什么比公交车快？' },
            { id: 'u4-p4-s17', en: 'A car is faster than a bus.', cn: '汽车比公交车快。' },
            { id: 'u4-p4-s18', en: 'A rabbit is faster than a tortoise.', cn: '兔子比乌龟快。' }
          ]
        },
        {
          id: 'u4-p5',
          name: 'How do we use forces?',
          nameCn: '对话 · 我们怎样用力',
          sentences: [
            { id: 'u4-p5-s1', en: 'We use this when we are on a trip.', cn: '我们旅行时会用到它。' },
            { id: 'u4-p5-s2', en: 'We push or pull this to go into or out of a door.', cn: '我们推或拉它来进出一道门。' },
            { id: 'u4-p5-s3', en: 'We need this when we use a computer.', cn: '我们使用电脑时需要它。' },
            { id: 'u4-p5-s4', en: 'It is also the name of an animal.', cn: '它也是一种动物的名字。' },
            { id: 'u4-p5-s5', en: "I need it to use a computer. It's also the name of an animal. What is it?", cn: '我用电脑时需要它，它也是一种动物的名字。它是什么？' },
            { id: 'u4-p5-s6', en: "It's a mouse!", cn: '是鼠标！' },
            { id: 'u4-p5-s7', en: 'How do we use forces?', cn: '我们如何使用力？' },
            { id: 'u4-p5-s8', en: 'When we do sport, we use forces.', cn: '做运动时我们会用力。' },
            { id: 'u4-p5-s9', en: 'When we use a bigger force, we can jump higher.', cn: '用更大的力，我们就能跳得更高。' },
            { id: 'u4-p5-s10', en: 'When we play music, we use forces.', cn: '演奏音乐时我们会用力。' },
            { id: 'u4-p5-s11', en: 'When I use a smaller force, the ball goes more slowly.', cn: '当我用更小的力时，球走得更慢。' },
            { id: 'u4-p5-s12', en: 'Is it easier to push a box of books or a box of balloons?', cn: '推一箱书容易还是推一箱气球容易？' },
            { id: 'u4-p5-s13', en: 'It is easier to push a box of balloons because it is lighter.', cn: '推一箱气球更容易，因为它更轻。' }
          ]
        }
      ],
      words: [
        { en: 'push', ph: '/pʊʃ/', cn: '推' },
        { en: 'pull', ph: '/pʊl/', cn: '拉' },
        { en: 'heavy', ph: '/ˈhevi/', cn: '重的' },
        { en: 'light', ph: '/laɪt/', cn: '轻的' },
        { en: 'easy', ph: '/ˈiːzi/', cn: '容易的' },
        { en: 'difficult', ph: '/ˈdɪfɪkəlt/', cn: '难的' },
        { en: 'force', ph: '/fɔːs/', cn: '力' },
        { en: 'movement', ph: '/ˈmuːvmənt/', cn: '移动' },
        { en: 'towards', ph: '/təˈwɔːdz/', cn: '向；朝' },
        { en: 'cause', ph: '/kɔːz/', cn: '起因；引起' },
        { en: 'speed', ph: '/spiːd/', cn: '速度' },
        { en: 'tortoise', ph: '/ˈtɔːtəs/', cn: '龟' },
        { en: 'win', ph: '/wɪn/', cn: '获胜' },
        { en: 'yourself', ph: '/jɔːˈself/', cn: '你自己' }
      ]
    },

    {
      id: 'u5',
      unit: 'Unit 5',
      en: 'How do inventions change our lives?',
      cn: '发明如何改变我们的生活？',
      theme: '#b7791f',
      passages: [
        {
          id: 'u5-p1',
          name: 'Simple machines in our daily lives',
          nameCn: '课文 · 生活中的简单机械',
          sentences: [
            { id: 'u5-p1-s1', en: 'What are simple machines?', cn: '什么是简单机械？' },
            { id: 'u5-p1-s2', en: 'They are the most basic inventions.', cn: '它们是最基础的发明。' },
            { id: 'u5-p1-s3', en: 'They make our lives easier, and we use them every day.', cn: '它们让我们的生活更轻松，我们每天都在使用它们。' },
            { id: 'u5-p1-s4', en: 'Many everyday inventions are levers.', cn: '许多日常用品都是杠杆。' },
            { id: 'u5-p1-s5', en: 'A bottle opener is a lever.', cn: '开瓶器是杠杆。' },
            { id: 'u5-p1-s6', en: 'A seesaw is also a lever.', cn: '跷跷板也是杠杆。' },
            { id: 'u5-p1-s7', en: 'When you ride on a seesaw in the playground, you are using a lever.', cn: '当你在游乐场玩跷跷板时，你就在使用杠杆。' },
            { id: 'u5-p1-s8', en: 'A boy sits down on one side, and his friend on the other side goes up.', cn: '一个男孩在一侧坐下，他另一侧的朋友就升了上去。' },
            { id: 'u5-p1-s9', en: 'We use wheels every day on cars, trucks and bicycles.', cn: '我们每天都在汽车、卡车和自行车上使用轮子。' },
            { id: 'u5-p1-s10', en: 'Inside an old clock or watch, you can also see tiny wheels.', cn: '在旧时钟或手表里面，你还能看到微小的齿轮。' },
            { id: 'u5-p1-s11', en: 'A ramp has one high end and one low end.', cn: '斜坡有一端高一端低。' },
            { id: 'u5-p1-s12', en: 'A slide is a ramp.', cn: '滑梯就是斜坡。' },
            { id: 'u5-p1-s13', en: 'On it, you can go from a high place to a low place quickly.', cn: '在斜坡上，你可以快速地从高处到低处。' },
            { id: 'u5-p1-s14', en: 'Things can move up and down more easily on a ramp.', cn: '东西在斜坡上上下移动更容易。' },
            { id: 'u5-p1-s15', en: 'People in wheelchairs use ramps to go into and out of buildings.', cn: '坐轮椅的人使用坡道进出建筑物。' },
            { id: 'u5-p1-s16', en: 'Hills and mountains are ramps in nature.', cn: '山丘和山脉是大自然中的斜坡。' },
            { id: 'u5-p1-s17', en: 'How do these inventions make our lives easier?', cn: '这些发明如何让我们的生活更轻松？' }
          ]
        },
        {
          id: 'u5-p2',
          name: 'Lu Ban and the saw',
          nameCn: '拓展 · 鲁班与锯子',
          sentences: [
            { id: 'u5-p2-s1', en: 'Lu Ban was a famous inventor in ancient China.', cn: '鲁班是中国古代著名的发明家。' },
            { id: 'u5-p2-s2', en: 'He invented a lot of useful tools.', cn: '他发明了许多有用的工具。' },
            { id: 'u5-p2-s3', en: 'One day, when Lu Ban was at work on a mountain, a leaf cut his finger.', cn: '一天，鲁班在山上干活时，一片叶子割破了他的手指。' },
            { id: 'u5-p2-s4', en: 'Lu Ban thought, "How could such a small leaf hurt my finger?"', cn: '鲁班想：“这么小的一片叶子怎么会割伤我的手指呢？”' },
            { id: 'u5-p2-s5', en: 'He looked at the leaf carefully.', cn: '他仔细观察那片叶子。' },
            { id: 'u5-p2-s6', en: 'There were many teeth on the leaf, and the teeth were sharp.', cn: '叶子上有很多齿，而且这些齿很锋利。' },
            { id: 'u5-p2-s7', en: '"Could I make a tool with teeth like these? It could cut things easily," Lu Ban said to himself.', cn: '“我能不能做一种带有这样齿的工具呢？它可以轻松地切割东西。”鲁班自言自语道。' },
            { id: 'u5-p2-s8', en: 'Soon Lu Ban made a saw.', cn: '不久，鲁班做了一把锯子。' },
            { id: 'u5-p2-s9', en: 'It was the first saw in the world.', cn: '这是世界上第一把锯子。' },
            { id: 'u5-p2-s10', en: 'People are still using it today.', cn: '人们至今仍在使用它。' },
            { id: 'u5-p2-s11', en: 'Lu Ban was not the only ancient Chinese inventor.', cn: '鲁班并不是中国古代唯一的发明家。' },
            { id: 'u5-p2-s12', en: 'Other ancient Chinese people invented many great things, such as cuju and paper.', cn: '其他中国古代人发明了许多伟大的东西，比如蹴鞠和纸。' },
            { id: 'u5-p2-s13', en: 'Many have a great influence around the world.', cn: '其中许多发明在全世界都有着巨大的影响。' },
            { id: 'u5-p2-s14', en: 'Do you know any other Chinese inventions?', cn: '你还知道其他的中国发明吗？' }
          ]
        },
        {
          id: 'u5-p3',
          name: 'Inventions around us',
          nameCn: '准备 · 我们身边的发明',
          sentences: [
            { id: 'u5-p3-s1', en: 'What inventions do you know?', cn: '你知道哪些发明？' },
            { id: 'u5-p3-s2', en: 'It turns under a car when the car moves.', cn: '汽车开动时它在车下面转动。' },
            { id: 'u5-p3-s3', en: 'It is a wheel.', cn: '它是轮子。' },
            { id: 'u5-p3-s4', en: 'A child can move smoothly down it.', cn: '孩子可以从它上面顺利地滑下来。' },
            { id: 'u5-p3-s5', en: 'It is a slide.', cn: '它是滑梯。' },
            { id: 'u5-p3-s6', en: 'Two children sit on each side of it.', cn: '两个孩子各坐一边。' },
            { id: 'u5-p3-s7', en: 'They go up and down.', cn: '他们一上一下。' },
            { id: 'u5-p3-s8', en: 'It is a seesaw.', cn: '它是跷跷板。' },
            { id: 'u5-p3-s9', en: 'People invented a lot of things to make travel easy.', cn: '人们发明了许多东西让出行变得容易。' },
            { id: 'u5-p3-s10', en: 'Bicycles, cars and trains help people travel fast on land.', cn: '自行车、汽车和火车帮助人们快速地在陆地上出行。' },
            { id: 'u5-p3-s11', en: 'Boats and ships help people travel on water.', cn: '船和轮船帮助人们在水上出行。' },
            { id: 'u5-p3-s12', en: 'Hot-air balloons and planes help people travel in the sky.', cn: '热气球和飞机帮助人们在空中出行。' },
            { id: 'u5-p3-s13', en: 'Where can we see wheels in our daily lives?', cn: '在日常生活中我们在哪里能看到轮子？' }
          ]
        },
        {
          id: 'u5-p4',
          name: 'Faster, earlier, more slowly',
          nameCn: '语法 · 副词比较级与最高级',
          sentences: [
            { id: 'u5-p4-s1', en: 'I thought I came early for the show.', cn: '我以为我来看演出来得挺早的。' },
            { id: 'u5-p4-s2', en: 'I came earlier than you, Meg.', cn: '我来得比你早，梅格。' },
            { id: 'u5-p4-s3', en: 'Harry came the earliest.', cn: '哈利来得最早。' },
            { id: 'u5-p4-s4', en: 'He was first!', cn: '他是第一个到的！' },
            { id: 'u5-p4-s5', en: 'Peter runs slowly.', cn: '彼得跑得很慢。' },
            { id: 'u5-p4-s6', en: 'Eddie runs more slowly than Peter.', cn: '埃迪跑得比彼得更慢。' },
            { id: 'u5-p4-s7', en: 'Mark runs the most slowly of the three.', cn: '马克是三个人中跑得最慢的。' },
            { id: 'u5-p4-s8', en: 'We can travel fast with a bicycle.', cn: '我们骑自行车能走得很快。' },
            { id: 'u5-p4-s9', en: 'Yes. And we can travel faster with a car.', cn: '是啊，而且我们开汽车能走得更快。' },
            { id: 'u5-p4-s10', en: 'We can travel the fastest with a high-speed train.', cn: '我们坐高铁走得最快。' }
          ]
        },
        {
          id: 'u5-p5',
          name: 'The most important invention',
          nameCn: '对话 · 最重要的发明',
          sentences: [
            { id: 'u5-p5-s1', en: 'How will Lele and his dad use simple inventions to build a tree house?', cn: '乐乐和爸爸将如何利用简单的发明来建造树屋？' },
            { id: 'u5-p5-s2', en: 'The cart has four wheels.', cn: '这辆手推车有四个轮子。' },
            { id: 'u5-p5-s3', en: 'It is fast and easy to move things with a cart.', cn: '用手推车搬运东西又快又容易。' },
            { id: 'u5-p5-s4', en: 'With a ladder, it is safe and easy to get up to the tree house.', cn: '有了梯子，爬上树屋既安全又容易。' },
            { id: 'u5-p5-s5', en: "They'll use the cart to carry the boards.", cn: '他们会用手推车来搬运木板。' },
            { id: 'u5-p5-s6', en: 'What is your favourite invention? Why?', cn: '你最喜欢的发明是什么？为什么？' },
            { id: 'u5-p5-s7', en: 'What do you think is the most important invention?', cn: '你认为最重要的发明是什么？' },
            { id: 'u5-p5-s8', en: "I think it's the plane because it makes travel faster.", cn: '我认为是飞机，因为它让出行更快。' },
            { id: 'u5-p5-s9', en: 'Inventions make our lives easier.', cn: '发明让我们的生活更便利。' },
            { id: 'u5-p5-s10', en: 'Some Chinese inventions have a great influence around the world.', cn: '一些中国发明在全世界有着巨大的影响。' },
            { id: 'u5-p5-s11', en: 'Before the invention of the plane, it was slow to travel far.', cn: '在飞机发明之前，出远门很慢。' },
            { id: 'u5-p5-s12', en: 'It is faster and easier to travel now.', cn: '现在出行更快也更容易了。' }
          ]
        }
      ],
      words: [
        { en: 'invention', ph: '/ɪnˈvenʃn/', cn: '发明' },
        { en: 'slide', ph: '/slaɪd/', cn: '滑梯' },
        { en: 'seesaw', ph: '/ˈsiːsɔː/', cn: '跷跷板' },
        { en: 'watch', ph: '/wɒtʃ/', cn: '手表' },
        { en: 'lever', ph: '/ˈliːvə(r)/', cn: '杠杆' },
        { en: 'wheel', ph: '/wiːl/', cn: '轮子' },
        { en: 'simple', ph: '/ˈsɪmpl/', cn: '简单的' },
        { en: 'machine', ph: '/məˈʃiːn/', cn: '机器' },
        { en: 'basic', ph: '/ˈbeɪsɪk/', cn: '基本的；基础的' },
        { en: 'everyday', ph: '/ˈevrideɪ/', cn: '每天的' },
        { en: 'playground', ph: '/ˈpleɪɡraʊnd/', cn: '游乐场' },
        { en: 'point', ph: '/pɔɪnt/', cn: '尖端；点' },
        { en: 'truck', ph: '/trʌk/', cn: '卡车' },
        { en: 'tiny', ph: '/ˈtaɪni/', cn: '极小的' },
        { en: 'ramp', ph: '/ræmp/', cn: '斜坡；坡道' },
        { en: 'wheelchair', ph: '/ˈwiːltʃeə(r)/', cn: '轮椅' },
        { en: 'nature', ph: '/ˈneɪtʃə(r)/', cn: '自然界' },
        { en: 'board', ph: '/bɔːd/', cn: '木板' }
      ]
    },

    {
      id: 'u6',
      unit: 'Unit 6',
      en: 'What is a city?',
      cn: '什么是城市？',
      theme: '#0f7ab8',
      passages: [
        {
          id: 'u6-p1',
          name: 'Beijing: a big-city snapshot',
          nameCn: '课文 · 北京：大城市掠影',
          sentences: [
            { id: 'u6-p1-s1', en: 'A city has amazing things to see and interesting places to explore.', cn: '城市有许多令人惊叹的景色和值得探索的有趣地方。' },
            { id: 'u6-p1-s2', en: "Let's take a look at Beijing, the capital of our country.", cn: '让我们一起来看看我们国家的首都——北京。' },
            { id: 'u6-p1-s3', en: 'Beijing is a mix of old and new.', cn: '北京是古老与现代的交融。' },
            { id: 'u6-p1-s4', en: 'Nobody can be bored in Beijing!', cn: '在北京没有人会感到无聊！' },
            { id: 'u6-p1-s5', en: 'Beijing is a very old city with a history of more than 3,000 years.', cn: '北京是一座拥有三千多年历史的古老城市。' },
            { id: 'u6-p1-s6', en: 'It has been the capital of China for hundreds of years.', cn: '几百年来它一直是中国的首都。' },
            { id: 'u6-p1-s7', en: "You can enjoy seeing Beijing's historic buildings.", cn: '你可以欣赏北京的历史建筑。' },
            { id: 'u6-p1-s8', en: "You can learn about China's history at the Palace Museum.", cn: '你可以在故宫了解中国的历史。' },
            { id: 'u6-p1-s9', en: 'Many emperors once lived there.', cn: '许多皇帝曾在那里居住。' },
            { id: 'u6-p1-s10', en: 'Outside the city, you can see the Great Wall.', cn: '在城外，你可以看到长城。' },
            { id: 'u6-p1-s11', en: 'People built it thousands of years ago.', cn: '人们几千年前建造了它。' },
            { id: 'u6-p1-s12', en: 'Take a trip to see the Great Wall.', cn: '去旅行看看长城。' },
            { id: 'u6-p1-s13', en: 'Visit the Olympic Park.', cn: '参观奥林匹克公园。' },
            { id: 'u6-p1-s14', en: 'Try Beijing roast duck.', cn: '尝一尝北京烤鸭。' },
            { id: 'u6-p1-s15', en: 'Today, Beijing is one of the most modern cities in the world.', cn: '今天，北京是世界上最现代化的城市之一。' },
            { id: 'u6-p1-s16', en: 'You can find some amazing buildings here.', cn: '你在这里可以找到一些令人惊叹的建筑。' },
            { id: 'u6-p1-s17', en: 'The National Centre for the Performing Arts looks like a drop of water.', cn: '国家大剧院看起来像一滴水。' },
            { id: 'u6-p1-s18', en: 'There, you can watch plays and operas.', cn: '在那里，你可以观看戏剧和歌剧。' },
            { id: 'u6-p1-s19', en: 'Then there is the National Stadium, the star of the 2008 Olympic Games.', cn: '还有国家体育场——2008 年奥运会的明星场馆。' },
            { id: 'u6-p1-s20', en: "It looks like a big bird's nest!", cn: '它看起来像一个巨大的鸟巢！' },
            { id: 'u6-p1-s21', en: 'After walking around the city, you can enjoy a meal at a restaurant.', cn: '在城市里逛了一圈之后，你可以在餐馆享用一顿美餐。' },
            { id: 'u6-p1-s22', en: 'No one should visit Beijing without trying Beijing roast duck.', cn: '来北京不尝北京烤鸭就太遗憾了。' },
            { id: 'u6-p1-s23', en: 'What makes Beijing a mix of old and new?', cn: '是什么让北京成为新旧交融的城市？' }
          ]
        },
        {
          id: 'u6-p2',
          name: 'From town to megacity',
          nameCn: '拓展 · 从小镇到特大城市',
          sentences: [
            { id: 'u6-p2-s1', en: 'The year is 1979.', cn: '那是 1979 年。' },
            { id: 'u6-p2-s2', en: 'A small town sits at the mouth of the Pearl River.', cn: '一座小镇坐落在珠江口。' },
            { id: 'u6-p2-s3', en: 'Nothing much happens there.', cn: '那里没有什么大事发生。' },
            { id: 'u6-p2-s4', en: 'The buildings are small.', cn: '建筑物很小。' },
            { id: 'u6-p2-s5', en: 'Only about 310,000 people live there.', cn: '那里只住着大约三十一万人。' },
            { id: 'u6-p2-s6', en: 'It is Shenzhen.', cn: '它就是深圳。' },
            { id: 'u6-p2-s7', en: 'It is 1980.', cn: '到了 1980 年。' },
            { id: 'u6-p2-s8', en: 'Many new businesses are opening in Shenzhen.', cn: '深圳许多新企业开张。' },
            { id: 'u6-p2-s9', en: 'Thousands of young people come here.', cn: '成千上万的年轻人来到这里。' },
            { id: 'u6-p2-s10', en: 'They begin to build tall buildings.', cn: '他们开始建造高楼。' },
            { id: 'u6-p2-s11', en: 'It is now 1990.', cn: '现在是 1990 年。' },
            { id: 'u6-p2-s12', en: 'About 1.68 million people live in Shenzhen and more workers are coming.', cn: '大约一百六十八万人住在深圳，还有更多工人正在赶来。' },
            { id: 'u6-p2-s13', en: 'They work hard in new factories.', cn: '他们在新工厂里努力工作。' },
            { id: 'u6-p2-s14', en: 'They have a better life in Shenzhen.', cn: '他们在深圳过上了更好的生活。' },
            { id: 'u6-p2-s15', en: 'Ten years later, the population jumps to about 7 million!', cn: '十年后，人口猛增到约七百万！' },
            { id: 'u6-p2-s16', en: 'Shenzhen keeps growing.', cn: '深圳持续发展。' },
            { id: 'u6-p2-s17', en: 'Today, it is full of modern buildings and green spaces.', cn: '今天，这里满是现代建筑和绿地。' },
            { id: 'u6-p2-s18', en: 'It has more than 1,000 parks!', cn: '它有一千多个公园！' },
            { id: 'u6-p2-s19', en: 'About 12 million people live in Shenzhen.', cn: '大约一千二百万人住在深圳。' },
            { id: 'u6-p2-s20', en: 'They make this city a great place.', cn: '他们把这座城市变成了一个了不起的地方。' },
            { id: 'u6-p2-s21', en: 'What was your city like in the past? What is it like now?', cn: '你的城市过去是什么样？现在是什么样？' }
          ]
        },
        {
          id: 'u6-p3',
          name: 'Places in a city',
          nameCn: '准备 · 城市里的场所',
          sentences: [
            { id: 'u6-p3-s1', en: 'What interesting places can you find in a city?', cn: '你能在一座城市里找到哪些有趣的地方？' },
            { id: 'u6-p3-s2', en: "The Xi'an Bell Tower is a historic building.", cn: '西安钟楼是一座历史建筑。' },
            { id: 'u6-p3-s3', en: 'It has a history of over 600 years.', cn: '它有六百多年的历史。' },
            { id: 'u6-p3-s4', en: 'The Canton Tower is a modern building.', cn: '广州塔是一座现代建筑。' },
            { id: 'u6-p3-s5', en: 'It is about 600 metres tall.', cn: '它约六百米高。' },
            { id: 'u6-p3-s6', en: 'The China Art Museum is an art gallery.', cn: '中华艺术宫是一座美术馆。' },
            { id: 'u6-p3-s7', en: 'It is a quiet place for art lovers.', cn: '它是艺术爱好者的安静去处。' },
            { id: 'u6-p3-s8', en: 'My city is a great place to live for many reasons.', cn: '我的城市在很多方面都是一个宜居的好地方。' },
            { id: 'u6-p3-s9', en: 'My city has very good public transport.', cn: '我的城市有很好的公共交通。' },
            { id: 'u6-p3-s10', en: 'There are taxis, buses, the underground and trains.', cn: '这里有出租车、公交车、地铁和火车。' },
            { id: 'u6-p3-s11', en: 'I go to school by underground. It is fast.', cn: '我坐地铁上学，很快。' },
            { id: 'u6-p3-s12', en: 'People make the city exciting.', cn: '人们让这座城市充满活力。' },
            { id: 'u6-p3-s13', en: 'The streets are busy with shoppers.', cn: '街道上挤满了购物的人。' },
            { id: 'u6-p3-s14', en: 'The parks are busy with children playing.', cn: '公园里满是玩耍的孩子。' },
            { id: 'u6-p3-s15', en: 'Many interesting things happen in the city.', cn: '城市里发生许多有趣的事。' },
            { id: 'u6-p3-s16', en: 'What a wonderful city!', cn: '多么美妙的城市啊！' },
            { id: 'u6-p3-s17', en: 'How much do you know about Beijing?', cn: '你对北京了解多少？' }
          ]
        },
        {
          id: 'u6-p4',
          name: 'The big city',
          nameCn: '语法 · nothing / nobody / no one',
          sentences: [
            { id: 'u6-p4-s1', en: 'I live in a big busy city.', cn: '我住在一座繁忙的大城市里。' },
            { id: 'u6-p4-s2', en: 'There are lots of fun things to do.', cn: '有很多好玩的事情可以做。' },
            { id: 'u6-p4-s3', en: 'There are people selling tasty food.', cn: '有人在卖香喷喷的食物。' },
            { id: 'u6-p4-s4', en: 'And lots of snacks too.', cn: '还有很多零食。' },
            { id: 'u6-p4-s5', en: 'Nobody gets bored in the city.', cn: '在这座城市里没有人会感到无聊。' },
            { id: 'u6-p4-s6', en: 'With so many places to see: the market, the library, the museum.', cn: '有这么多地方可看：市场、图书馆、博物馆。' },
            { id: 'u6-p4-s7', en: 'No one is happier than me!', cn: '没有人比我更开心！' },
            { id: 'u6-p4-s8', en: 'There is nothing in the fridge.', cn: '冰箱里什么也没有。' },
            { id: 'u6-p4-s9', en: 'No one could see everything.', cn: '没有人能看到一切。' },
            { id: 'u6-p4-s10', en: 'Nobody is in the museum.', cn: '博物馆里没有人。' },
            { id: 'u6-p4-s11', en: 'No one can get bored in this theatre.', cn: '在这家剧院里没人会感到无聊。' },
            { id: 'u6-p4-s12', en: 'Nobody can get into this zoo after 4:30 p.m.', cn: '下午四点半之后没人能进入这个动物园。' }
          ]
        },
        {
          id: 'u6-p5',
          name: 'What can we do in a city?',
          nameCn: '对话 · 城市里能做什么',
          sentences: [
            { id: 'u6-p5-s1', en: 'Cities are usually near rivers or lakes. Why?', cn: '城市通常位于河流或湖泊附近。为什么？' },
            { id: 'u6-p5-s2', en: 'Guangzhou is along the Pearl River.', cn: '广州位于珠江沿岸。' },
            { id: 'u6-p5-s3', en: 'It is important for ships to travel on.', cn: '它对船只航行很重要。' },
            { id: 'u6-p5-s4', en: 'Paris is along the Seine River.', cn: '巴黎位于塞纳河沿岸。' },
            { id: 'u6-p5-s5', en: 'It kept the city safe.', cn: '它保护了城市的安全。' },
            { id: 'u6-p5-s6', en: 'Mexico City is near Lake Texcoco.', cn: '墨西哥城靠近特斯科科湖。' },
            { id: 'u6-p5-s7', en: 'It gave people food and water.', cn: '它为人们提供了食物和水。' },
            { id: 'u6-p5-s8', en: 'What do you like about the city?', cn: '你喜欢城市的什么？' },
            { id: 'u6-p5-s9', en: 'There are museums in the city.', cn: '城市里有博物馆。' },
            { id: 'u6-p5-s10', en: 'We can visit museums and find many famous works of art there.', cn: '我们可以参观博物馆，在那里看到许多著名的艺术作品。' },
            { id: 'u6-p5-s11', en: 'We can watch shows at the theatre.', cn: '我们可以在剧院看演出。' },
            { id: 'u6-p5-s12', en: 'We can go to amusement parks at the weekend.', cn: '我们周末可以去游乐园。' },
            { id: 'u6-p5-s13', en: 'A city is often near water.', cn: '城市常常靠近水。' },
            { id: 'u6-p5-s14', en: 'A city is full of history and culture.', cn: '城市充满历史与文化。' }
          ]
        }
      ],
      words: [
        { en: 'shopping centre', ph: '/ˈʃɒpɪŋ ˌsentə(r)/', cn: '购物中心' },
        { en: 'art gallery', ph: '/ˈɑːt ˌɡæləri/', cn: '美术馆' },
        { en: 'amusement park', ph: '/əˈmjuːzmənt pɑːk/', cn: '游乐园' },
        { en: 'historic building', ph: '/hɪˈstɒrɪk ˈbɪldɪŋ/', cn: '历史建筑' },
        { en: 'modern building', ph: '/ˈmɒdn ˈbɪldɪŋ/', cn: '现代建筑' },
        { en: 'snapshot', ph: '/ˈsnæpʃɒt/', cn: '快照；简介' },
        { en: 'nobody', ph: '/ˈnəʊbədi/', cn: '没有人' },
        { en: 'bored', ph: '/bɔːd/', cn: '感到无聊的' },
        { en: 'emperor', ph: '/ˈemprə(r)/', cn: '皇帝' },
        { en: 'once', ph: '/wʌns/', cn: '曾经' },
        { en: 'opera', ph: '/ˈɒprə/', cn: '歌剧' },
        { en: 'sell', ph: '/sel/', cn: '出售' },
        { en: 'a mix of', ph: '/ə mɪks əv/', cn: '……的混合' },
        { en: 'thousands of', ph: '/ˈθaʊzndz əv/', cn: '成千上万的' },
        { en: 'take a trip', ph: '/teɪk ə trɪp/', cn: '去旅行' },
        { en: 'a drop of', ph: '/ə drɒp əv/', cn: '一滴' }
      ]
    }
  ]
};
