import { describe, it, expect } from 'vitest';
import Chari, { Gauldoth, Utils } from '~';

describe('Gauldoth create/encrypt/decrypt', () => {
  it('default export聚合对象与具名一致', () => {
    expect(Chari.Gauldoth).toBe(Gauldoth);
    expect(Chari.Utils).toBe(Utils);
  });

  it('create 返回含 encrypt/decrypt', () => {
    const api = Gauldoth.create({ key: 'material-key-xyz', ivKey: 'marks-key-abc' });
    expect(typeof api.encrypt).toBe('function');
    expect(typeof api.decrypt).toBe('function');
  });

  it('字符串往返加解密', () => {
    const api = Gauldoth.create({ key: 'k1', ivKey: 'k2' });
    const token = api.encrypt('hello world');
    expect(typeof token).toBe('string');
    const plain = api.decrypt(token);
    expect(plain).toBe('hello world');
  });

  it('对象 JSON 往返', () => {
    const api = Gauldoth.create({ key: 'obj-k', ivKey: 'obj-ivk' });
    const source = { a: 1, b: 'x' };
    const token = api.encrypt(source);
    const plain = api.decrypt(token);
    expect(plain).toBe(JSON.stringify(source));
  });

  it('错误 token 返回 null', () => {
    const api = Gauldoth.create({ key: 'err-k', ivKey: 'err-ivk' });
    const token = api.encrypt('test');
    const broken = token.slice(0, 5) + '!' + token.slice(6);
    const result = api.decrypt(broken);
    expect(result).toBeNull();
  });
});
