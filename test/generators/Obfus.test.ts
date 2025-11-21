import { describe, it, expect } from 'vitest';
import { Obfus } from '~/generators';

// 参考 BaseFlow.test 风格，为 Obfus 补充测试
describe('Obfus.generateCode', () => {
  it('empty string returns "\"\"" literal', () => {
    expect(Obfus.generateCode('')).toBe('""');
  });

  it('generated code evaluates back to original plaintext', () => {
    const plaintext = 'Hello,世界!';
    const code = Obfus.generateCode(plaintext);
    // 通过 eval 执行自执行函数，得到还原字符串
    // 这里 eval 仅用于测试内受控代码片段
    // eslint-disable-next-line no-eval
    const restored = eval(code);
    expect(restored).toBe(plaintext);
  });

  it('key in range 1..255 and obfuscated data XOR key yields original chars', () => {
    const plaintext = 'BaseFlowTest';
    const code = Obfus.generateCode(plaintext);
    // 提取末尾括号中的密钥数字
    const keyMatch = code.match(/\)(\((\d+)\))$/);
    expect(keyMatch).not.toBeNull();
    const key = Number(keyMatch![2]);
    expect(key).toBeGreaterThanOrEqual(1);
    expect(key).toBeLessThanOrEqual(255);

    // 提取数据数组内容 [a, b, c,...]
    const dataMatch = code.match(/\[([^\]]*)\]/);
    expect(dataMatch).not.toBeNull();
    const nums = dataMatch![1].trim() === '' ? [] : dataMatch![1].split(/\s*,\s*/).map(n => Number(n));
    expect(nums.length).toBe(plaintext.length);
    const chars = nums.map(n => String.fromCharCode(n ^ key)).join('');
    expect(chars).toBe(plaintext);
  });
});
