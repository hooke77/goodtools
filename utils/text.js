/**
 * 文本归一化（音频索引和时长表的 key 都用这一份规则，必须完全一致）
 *
 * 目的：课本里的 It's / 弯引号 / 末尾标点，都能命中同一份音频与时长。
 * 生成音频时用的是同一套规则（见 tools/gen-audio.py）。
 */
function normKey(text) {
  return String(text == null ? '' : text)
    .toLowerCase()
    .replace(/[\u2018\u2019`]/g, "'")
    .replace(/[^a-z0-9']+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = {
  normKey: normKey
};
