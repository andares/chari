import { describe, it, expect } from 'vitest';
import { Utils } from '~';
import { randomAlpha, bin2hex, hex2bin } from '~/utils';

// 验证导出一致性
describe('Utils export shape', () => {
  it('聚合对象与具名导出一致', () => {
    expect(Utils.randomAlpha).toBe(randomAlpha);
    expect(Utils.bin2hex).toBe(bin2hex);
    expect(Utils.hex2bin).toBe(hex2bin);
  });
});

describe('randomAlpha', () => {
  it('长度与字符集 alpha', () => {
    const str = randomAlpha(32, 'alpha');
    expect(str).toHaveLength(32);
    expect(/^[0-9A-Za-z]+$/.test(str)).toBe(true);
  });
  it('长度与字符集 alpha36', () => {
    const str = randomAlpha(40, 'alpha36');
    expect(str).toHaveLength(40);
    expect(/^[0-9A-Z]+$/.test(str)).toBe(true);
  });
});

describe('hex utils', () => {
  it('bin2hex 与 hex2bin 往返', () => {
    const buf = Buffer.from('abc123你好', 'utf8');
    const hex = bin2hex(buf);
    const round = hex2bin(hex);
    expect(round.equals(buf)).toBe(true);
    expect(round.toString('utf8')).toBe('abc123你好');
  });
});
