const s = require('C:/Users/admin/WorkBuddy/小学英语/小学英语朗读小程序/utils/score.js');
const t = require('C:/Users/admin/WorkBuddy/小学英语/小学英语朗读小程序/utils/tips.js');

function line(name, target, said) {
  const r = s.evaluate(target, said);
  console.log(
    (name + '                    ').slice(0, 20),
    String(r.score).padStart(3) + '分',
    r.level.padEnd(9),
    '漏词:' + JSON.stringify(r.missedWords),
    '错词:' + JSON.stringify(r.errorWords)
  );
  if (r.levelText) console.log('                     ↳ ' + r.levelText);
}

console.log('=== 1. 缩写与所有格（不应误判） ===');
line('I am → I\'m', "I'm so excited!", 'I am so excited');
line("I'm → I am", "I'm so excited!", "I'm so excited");
line('do not → don\'t', "I don't need to wear a coat or a sweater.", 'I do not need to wear a coat or a sweater');
line('所有格 painters\'', "But all paintings show the painters' feelings.", 'But all paintings show the painters feelings');
line('所有格 people\'s', "Artists try to express themselves and touch people's hearts.", 'Artists try to express themselves and touch peoples hearts');

console.log('\n=== 2. 真实错误（必须抓到） ===');
line("吞 -s", 'It makes me so happy when I look at your photo.', 'It make me so happy when I look at your photo');
line('吞 -ed', 'We moved here to Shenzhen yesterday.', 'We move here to Shenzhen yesterday');
line('吞 -s（复数）', "Artists try to express themselves and touch people's hearts.", "Artists try to express themselves and touch people's heart");
line('漏词', 'He wanted people to cheer up and be brave.', 'He wanted people to cheer up and brave');
line('短词读错', 'A slide is a ramp.', 'a slide is a lamp');
line('整句跑偏', 'A push is a force.', 'I like apples');

console.log('\n=== 3. 满分应有满分 ===');
[
  ['We moved here to Shenzhen yesterday.', 'We moved here to Shenzhen yesterday'],
  ['A small force causes a small movement.', 'a small force causes a small movement'],
  ["It's much warmer in Shenzhen!", 'It is much warmer in Shenzhen'],
  ['Nobody can be bored in Beijing!', 'nobody can be bored in beijing'],
  ['First, take your shoe off.', 'first take your shoe off']
].forEach(function (c) {
  line('满分检查', c[0], c[1]);
});

console.log('\n=== 4. 单词发音提示（优先级） ===');
['bright', 'cheer', 'people', 'wanted', 'pads', 'oil', 'invention', 'three'].forEach(function (w) {
  console.log('  ' + (w + '          ').slice(0, 12) + '→ ' + t.tipForWord(w).tip);
});
