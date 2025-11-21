
export const generateCode = (plaintext: string): string => {
  if (plaintext.length === 0) {
    return '""';
  }

  // 生成 1~255 之间的随机异或密钥（避开 0，因为 x ^ 0 = x，无混淆效果）
  const key = Math.floor(Math.random() * 255) + 1;
  const obfuscated = Array.from(plaintext).map(ch => ch.charCodeAt(0) ^ key);
  const data = obfuscated.join(', ');

  // 将密钥和混淆数据都写入代码，形成自执行函数
  return `((k => String.fromCharCode(...[${data}].map(x => x ^ k))))(${key})`;
};
