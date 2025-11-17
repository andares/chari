import * as crypto from 'node:crypto';
import { BaseFlow } from '~/generators';
import { hex2bin, bin2hex } from '~/utils';

/**
 * CryptoManager (TS) - 适配 PHP 版逻辑：
 * - 所有对外主密钥 / 派生密钥以 base62 打包字符串表示
 * - pack: binary -> hex -> base62; unpack: base62 -> hex -> binary
 * - HKDF 派生算法: sha256, 32 字节, 零盐
 * - 签名窗口：10 秒粒度，允许漂移尝试前一个窗口
 */
export class CryptoManager {
  // ----------------------------
  // pack / unpack
  // ----------------------------
  static packKey(key: Buffer | Uint8Array | string): string {
    const buf = typeof key === 'string' ? Buffer.from(key, 'binary') : Buffer.from(key);
    const hex = bin2hex(buf);
    const bf = new BaseFlow(hex, 16);
    return bf.to(62);
  }

  static unpackKey(packed: string): Buffer {
    const bf = new BaseFlow(packed, 62);
    const hex = bf.to(16);
    return hex2bin(hex);
  }

  // 生成 32 字节主密钥（打包为 base62）
  static generateMasterKey(): string {
    // 为避免 base62->hex 再解码时因前导 0 半字节/整字节被截断造成长度 <32，循环确保首字节高 4 位非 0
    let raw: Buffer;
    do {
      raw = crypto.randomBytes(32);
    } while (raw[0] < 0x10); // 0x10 及以上可确保十六进制首字符不为 '0'
    return this.packKey(raw);
  }

  // 基于主密钥派生对称密钥（输入/输出均打包）
  static deriveKey(masterKeyPacked: string, info: string = ''): string {
    const masterRaw = this.unpackKey(masterKeyPacked);
    const salt = Buffer.alloc(32); // 32 字节零盐
    const hkdfOut = crypto.hkdfSync('sha256', masterRaw, salt, Buffer.from(info, 'utf8'), 32);
    const derivedBuf = Buffer.isBuffer(hkdfOut) ? hkdfOut : Buffer.from(hkdfOut as ArrayBuffer);
    return this.packKey(derivedBuf);
  }

  // 生成签名（derivedKeyPacked：打包格式）
  static sign(
    derivedKeyPacked: string,
    challenge: string,
    params: unknown,
    timestampWindow?: number
  ): string {
    const derivedKeyRaw = this.unpackKey(derivedKeyPacked);
    const tsWin = timestampWindow ?? Math.floor(Date.now() / 1000 / 10);
    const dataStr = typeof params === 'string' ? params : JSON.stringify(params);
    const message = `${dataStr}|${challenge}|${tsWin}`;
    return crypto.createHmac('sha256', derivedKeyRaw).update(message).digest('hex');
  }

  // 验证签名（尝试当前与前一个窗口）
  static verify(
    derivedKeyPacked: string,
    challenge: string,
    params: unknown,
    signature: string,
    allowedWindowDrift: boolean = true
  ): boolean {
    const derivedKeyRaw = this.unpackKey(derivedKeyPacked);
    const nowWin = Math.floor(Date.now() / 1000 / 10);
    const dataStr = typeof params === 'string' ? params : JSON.stringify(params);

    const tryVerify = (win: number): boolean => {
      const message = `${dataStr}|${challenge}|${win}`;
      const expected = crypto.createHmac('sha256', derivedKeyRaw).update(message).digest('hex');
      const sigBuf = Buffer.from(signature, 'hex');
      const expBuf = Buffer.from(expected, 'hex');
      if (sigBuf.length !== expBuf.length) return false;
      return crypto.timingSafeEqual(sigBuf, expBuf);
    };

    if (tryVerify(nowWin)) return true;
    if (allowedWindowDrift && tryVerify(nowWin - 1)) return true;
    return false;
  }
}