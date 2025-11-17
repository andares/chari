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

  // ----------------------------
  // 补充分支覆盖
  // ----------------------------
  it('encrypt 使用自定义合法 8 字符 IV', () => {
    const api = Gauldoth.create({ key: 'custom-k', ivKey: 'custom-ivk' });
    const iv = 'ABCDEFGH';
    const token = api.encrypt('payload-123', iv);
    expect(typeof token).toBe('string');
    const plain = api.decrypt(token);
    expect(plain).toBe('payload-123');
  });

  it('encrypt 自定义 IV 长度非法抛错', () => {
    const api = Gauldoth.create({ key: 'bad-k', ivKey: 'bad-ivk' });
    expect(() => api.encrypt('some-data', 'ABC')).toThrow('IV must be 8 bytes');
  });

  it('encrypt 空源（null）抛错 Source data is empty', () => {
    const api = Gauldoth.create({ key: 'empty-k', ivKey: 'empty-ivk' });
    expect(() => api.encrypt(null)).toThrow('Source data is empty');
    expect(() => api.encrypt('')).toThrow('Source data is empty');
  });

  it('decrypt 缺少分隔符 | 返回 null', () => {
    const api = Gauldoth.create({ key: 'no-pipe-k', ivKey: 'no-pipe-ivk' });
    const invalidToken = 'ABCDEFGHIJKLMN'; // 无 '|'
    expect(api.decrypt(invalidToken)).toBeNull();
  });

  it('decrypt 分隔符后无 payload 返回 null', () => {
    const api = Gauldoth.create({ key: 'no-payload-k', ivKey: 'no-payload-ivk' });
    const token = 'ABCDEFGHXXXX|'; // pipe 存在但后面为空
    expect(api.decrypt(token)).toBeNull();
  });

  it('decrypt 构造导致 IV unpack failed 场景返回 null', () => {
    const api = Gauldoth.create({ key: 'unpack-k', ivKey: 'unpack-ivk' });
    // 生成合法 token 后破坏 marks 加密部分使还原 IV/数据失败
    const token = api.encrypt('unpack-test');
    const pipeIndex = token.indexOf('|');
    // 保留前 8 字节随机IV，篡改加密 marks 为短串使解析失败
    const marksIv = token.substring(0, 8);
    const forgedMarks = marksIv + 'AAA'; // 非法加密密文将导致 decrypt3DES 抛错或后续失败
    const forged = forgedMarks + token.substring(pipeIndex);
    expect(api.decrypt(forged)).toBeNull();
  });
});
