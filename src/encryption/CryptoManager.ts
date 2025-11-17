import * as crypto from 'crypto';

export class CryptoManager {
  // 生成 32 字节主密钥
  static generateMasterKey(): Buffer {
    return crypto.randomBytes(32);
  }

  // 基于主密钥派生对称密钥（支持 info，如版本号）
  static deriveKey(masterKey: Buffer, info: string = ''): Buffer {
    const salt = Buffer.alloc(32); // 可选盐，这里用零盐
    return crypto.hkdfSync('sha256', masterKey, salt, Buffer.from(info, 'utf8'), 32);
  }

  // 生成签名
  static sign(
    derivedKey: Buffer,
    challenge: string,
    params: unknown,
    timestampWindow?: number
  ): string {
    const tsWin = timestampWindow ?? Math.floor(Date.now() / 1000 / 10);
    const dataStr = typeof params === 'string' ? params : JSON.stringify(params);
    const message = `${dataStr}|${challenge}|${tsWin}`;
    return crypto.createHmac('sha256', derivedKey).update(message).digest('hex');
  }

  // 验证签名（尝试当前和前一个时间窗口）
  static verify(
    derivedKey: Buffer,
    challenge: string,
    params: unknown,
    signature: string,
    allowedWindowDrift: boolean = true
  ): boolean {
    const nowWin = Math.floor(Date.now() / 1000 / 10);
    const dataStr = typeof params === 'string' ? params : JSON.stringify(params);

    const tryVerify = (win: number): boolean => {
      const message = `${dataStr}|${challenge}|${win}`;
      const expected = crypto.createHmac('sha256', derivedKey).update(message).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
    };

    if (tryVerify(nowWin)) return true;
    if (allowedWindowDrift && tryVerify(nowWin - 1)) return true;
    return false;
  }
}