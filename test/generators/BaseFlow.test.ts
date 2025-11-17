import { describe, it, expect } from 'vitest';
import { BaseFlow } from '~/generators';

describe('BaseFlow', () => {
  it('hex normalization removes 0x and lowercases', () => {
    const bf = new BaseFlow('0xFF', 16);
    expect(bf.to(16)).toBe('ff');
  });

  it('invalid hex throws', () => {
    expect(() => new BaseFlow('zz', 16)).toThrow('Invalid hex string');
  });

  it('number constructor converts to hex', () => {
    const bf = new BaseFlow(255); // decimal 255 -> ff
    expect(bf.to(16)).toBe('ff');
  });

  it('base conversion works (hex ff -> base2)', () => {
    const bf = new BaseFlow('ff', 16);
    expect(bf.to(2)).toBe('11111111');
  });

  it('fromAlpha/toAlpha 去除前导 a (与 PHP GMP 语义一致)', () => {
    const alpha = 'abcxyz';
    const bf = BaseFlow.fromAlpha(alpha);
    // GMP 转换会丢弃前导 0，对应字母映射里的前导 'a'
    expect(bf.toAlpha()).toBe(alpha.replace(/^a+/, ''));
  });

  it('fromAlpha invalid char throws', () => {
    expect(() => BaseFlow.fromAlpha('A')).toThrow('Invalid alpha character: A. Expected a-z.');
  });
});
