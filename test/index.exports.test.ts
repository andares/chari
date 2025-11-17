import { describe, it, expect } from 'vitest';
import Chari, { Gauldoth, Utils } from '~';

// 根入口导出形态测试

describe('root index exports', () => {
  it('default 与具名引用同一实例', () => {
    expect(Chari.Gauldoth).toBe(Gauldoth);
    expect(Chari.Utils).toBe(Utils);
  });

  it('Gauldoth API shape', () => {
    const api = Gauldoth.create({ key: 'shape-k', ivKey: 'shape-ivk' });
    expect(Object.keys(api).sort()).toEqual(['decrypt', 'encrypt']);
  });

  it('Utils 包含预期函数', () => {
    expect(typeof Utils.randomAlpha).toBe('function');
    expect(typeof Utils.bin2hex).toBe('function');
    expect(typeof Utils.hex2bin).toBe('function');
  });
});
