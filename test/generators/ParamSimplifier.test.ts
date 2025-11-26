import { describe, it, expect } from 'vitest';
import ParamSimplifier from '~/generators/ParamSimplifier';

describe('ParamSimplifier', () => {
  const complexCase = {
    profile: {
      id: 1001,
      tags: ['vip', 'premium'],
      settings: { theme: 'dark', notify: true },
      history: [
        { action: 'login', time: '2023-01-01' },
        { action: 'purchase', time: '2023-01-02' }
      ],
      preferences: [
        { category: 'email', enabled: true },
        { category: 'sms', enabled: false }
      ],
      metadata: {
        scores: [95, 87, 92],
        permissions: { read: true, write: false }
      }
    },
    items: [
      { id: 1, name: 'item1', tags: ['a', 'b'] },
      { id: 2, name: 'item2', tags: ['c'] }
    ],
    filters: {
      status: ['active', 'pending'],
      range: { min: 0, max: 100 }
    },
    emptyList: [],
    emptyObj: {},
    mixedKeys: { b: 2, a: 1, '3': 'three', '2': 'two' }
  } as const;

  it('simplify complex case (project format)', () => {
    const simplified = ParamSimplifier.simplify({ ...complexCase } as any);
    expect(simplified).toEqual({
      emptyList: '[*EM*]',
      emptyObj: '[*EM*]',
      filters: '[*RE:range,status*]',
      items: '[*CO:2:id,name,tags*]',
      mixedKeys: '[*RE:2,3,a,b*]',
      profile: '[*RE:history,id,metadata,preferences,settings,tags*]'
    });
  });

  it('encode/decode round trip equals simplified', () => {
    const simplified = ParamSimplifier.simplify({ ...complexCase } as any);
    const buf = ParamSimplifier.encode({ ...complexCase } as any);
    const decoded = ParamSimplifier.decode(buf);
    expect(decoded).toEqual(simplified);
    // 编码结果应为非空二进制
    expect(Buffer.from(buf).byteLength).toBeGreaterThan(0);
  });

  it('handles edge cases', () => {
    const cases: Array<{ input: any; expected: any }> = [
      { input: { a: [1, 2, 3] }, expected: { a: '[*LI:3*]' } },
      // 按当前实现：仅以第一个元素的键构建签名
      { input: { a: [{ x: 1 }, { y: 2 }] }, expected: { a: '[*CO:2:x*]' } },
      { input: { a: [[1], [2]] }, expected: { a: '[*CO:2*]' } },
      { input: { a: { b: 1, c: 2 } }, expected: { a: '[*RE:b,c*]' } },
      { input: { z: 1, a: 2 }, expected: { a: 2, z: 1 } }
    ];
    for (const { input, expected } of cases) {
      expect(ParamSimplifier.simplify(input)).toEqual(expected);
    }
  });
});
