import * as crypto from 'node:crypto';

import { randomAlpha } from '~/utils';

/**
 * Gauldoth 3DES 封装工具
 * - 提供随机串生成、密钥派生、3DES 加解密
 * - 通过混淆方案将 IV 与密文分片交织，输出单一 token
 */

// ----------------------------
// 密钥派生
// ----------------------------
/**
 * 由字符串材料派生 3DES 密钥（24 字节）。
 * 通过 SHA-256 取前 24 字节（48 hex）。
 * @param material 原始密钥材料（任意字符串）
 * @returns 3DES 所需的 24 字节 Buffer
 */
const deriveKey = (material: string): Buffer => {
  const hash = crypto.createHash('sha256').update(material).digest('hex');
  return Buffer.from(hash.substring(0, 48), 'hex');
};

// ----------------------------
// 3DES 加解密
// ----------------------------
const CIPHER = 'des-ede3-cbc';

/**
 * 使用 3DES-CBC 加密 UTF-8 文本，输出 Base64。
 * @param plaintext 明文（utf8）
 * @param key 3DES 密钥（24 字节）
 * @param iv 初始向量（8 字节）
 * @returns Base64 密文
 */
const encrypt3DES = (plaintext: string, key: Buffer, iv: Buffer): string => {
  const cipher = crypto.createCipheriv(CIPHER, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
};

/**
 * 使用 3DES-CBC 解密 Base64 文本，输出 UTF-8。
 * @param ciphertext Base64 密文
 * @param key 3DES 密钥（24 字节）
 * @param iv 初始向量（8 字节）
 * @returns 明文（utf8）
 */
const decrypt3DES = (ciphertext: string, key: Buffer, iv: Buffer): string => {
  const decipher = crypto.createDecipheriv(CIPHER, key, iv);
  let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// ----------------------------
// Marks 编码/解码
// ----------------------------
/**
 * 将 IV 混淆信息编码到密文前缀（8 字节随机 IV + 3DES(marks)）。
 * @param marks 位置标记串，用 `|` 分隔
 * @param ivKey 用于加密 marks 的密钥
 * @returns 组合后的字符串（8字节随机IV + 加密marks）
 */
const encodeMarks = (marks: string, ivKey: Buffer): string => {
  const iv = randomAlpha(8);
  const encrypted = encrypt3DES(marks, ivKey, Buffer.from(iv, 'ascii'));
  return iv + encrypted;
};

/**
 * 从前缀解析并解密 marks。
 * @param packed 组合串（8字节随机IV + 加密marks）
 * @param ivKey 用于解密 marks 的密钥
 * @returns 解密后的 marks 字符串
 * @throws 当 packed 长度非法时抛出错误
 */
const decodeMarks = (packed: string, ivKey: Buffer): string => {
  if (packed.length <= 8) throw new Error('IV marks format error');
  const iv = packed.substring(0, 8);
  const encrypted = packed.substring(8);
  return decrypt3DES(encrypted, ivKey, Buffer.from(iv, 'ascii'));
};

// ----------------------------
// 主工厂函数（全箭头）
// ----------------------------
export interface Options {
  key: string;
  ivKey: string;
}

export type SourceInput = string | Record<string, any> | null;

/**
 * 创建 Gauldoth 加/解密器。
 * - encrypt：对输入进行 3DES 加密，并与 IV 片段交织，输出单一 token
 * - decrypt：从 token 还原 IV 与密文，恢复原始明文
 * @param options `{ key, ivKey }` 分别用于数据与 marks 的派生密钥材料
 * @returns `{ encrypt, decrypt }` API
 */
const create = ({ key, ivKey }: Options) => {
  const derivedKey = deriveKey(key);
  const derivedIvKey = deriveKey(ivKey);

  // packIv（闭包内箭头）
  /**
   * 将密文与 IV 字符交错，返回：`[marksIv(8)][encMarks]|[交错分片…]`
   * 过程：
   * 1) 打乱 IV 索引（0-7），对索引序列进行随机切片
   * 2) 每个切片在数据中切一段 `cutPos`，并附加该切片对应的 IV 字符
   * 3) 记录切片索引及切割长度，形成 mark，所有 mark 用 3DES 加密
   * @param iv 明文 IV（8 字符）
   * @param data 待交错的密文
   * @returns 包含加密 marks 与交错主体的字符串
   */
  const packIv = (iv: string, data: string): string => {
    if (iv.length !== 8) throw new Error('IV must be 8 characters');

    // Fisher-Yates shuffle
    const indices = [0, 1, 2, 3, 4, 5, 6, 7].map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // 将 8 个索引随机分组，形成多段切片；每段会与一段数据交错
    const slicedIndex: number[][] = [];
    let remaining = [...indices];
    while (remaining.length > 0) {
      const cut = Math.min(6, Math.floor(Math.random() * remaining.length) + 1);
      slicedIndex.push(remaining.slice(0, cut));
      remaining = remaining.slice(cut);
    }

    const resultParts: string[] = [];
    const ivMarks: string[] = [];
    let dataRemaining = data;

    slicedIndex.forEach((ivSlice) => {
      // 数据切割长度上限与当前剩余长度的平方根相关，避免过大切片
      const maxPos = Math.max(1, Math.min(99, Math.floor(Math.sqrt(dataRemaining.length))));
      const cutPos = Math.max(1, Math.floor(Math.random() * maxPos) + 1);

      const dataChunk = dataRemaining.substring(0, cutPos);
      dataRemaining = dataRemaining.substring(cutPos);
      const ivChunk = ivSlice.map(idx => iv[idx]).join('');
      // mark = [索引序列][2位切割长度]，用于还原交错
      const mark = ivSlice.join('') + cutPos.toString().padStart(2, '0');

      resultParts.push(dataChunk, ivChunk);
      ivMarks.push(mark);
    });

    if (dataRemaining) resultParts.push(dataRemaining);

    // 将所有 mark 用独立密钥加密，并在前缀附同一随机 IV（修复之前前后 IV 不一致导致解密失败问题）
    const ivForMarks = randomAlpha(8);
    const marksEncrypted = encrypt3DES(ivMarks.join('|'), derivedIvKey, Buffer.from(ivForMarks, 'ascii'));
    const packedMarks = ivForMarks + marksEncrypted;
    return packedMarks + '|' + resultParts.join('');
  };

  // unpackIv（闭包内箭头）
  /**
   * 解析 token，解密 marks，复原密文与 IV。
   * @param packed `packIv` 生成的字符串
   * @returns `[密文, 复原IV]`
   * @throws 当格式或 marks 不合法时抛出错误
   */
  const unpackIv = (packed: string): [string, string] => {
    const pipeIndex = packed.indexOf('|');
    if (pipeIndex === -1) throw new Error('Unpack string format error');

    const marksSection = packed.substring(0, pipeIndex);
    const dataSection = packed.substring(pipeIndex + 1);
    if (!dataSection) throw new Error('Unpack payload missing');

    // 取出 marks 的随机 IV 与密文，解出 marks 列表
    const ivFromMarks = marksSection.substring(0, 8);
    const encryptedMarks = marksSection.substring(8);
    const marks = decrypt3DES(encryptedMarks, derivedIvKey, Buffer.from(ivFromMarks, 'ascii'));
    const ivMarks = marks.split('|').filter(m => m.length >= 3);

    const originData: string[] = [];
    const ivMap: Record<string, string> = {};
    let offset = 0;

    ivMarks.forEach(mark => {
      const posStr = mark.slice(-2);
      const dataLen = parseInt(posStr, 10);
      if (isNaN(dataLen)) return;

      const keySeq = mark.slice(0, -2);
      // 提取对应长度的数据片段
      originData.push(dataSection.substring(offset, offset + dataLen));

      // 将交错的 IV 字符按索引回填到映射表
      for (let i = 0; i < keySeq.length; i++) {
        const key = keySeq[i];
        ivMap[key] = dataSection[offset + dataLen + i];
      }

      offset += dataLen + keySeq.length;
    });

    if (offset < dataSection.length) {
      originData.push(dataSection.substring(offset));
    }

    if (Object.keys(ivMap).length === 0 || originData.length === 0) {
      throw new Error('IV unpack failed');
    }

    // 按索引顺序拼回 IV
    const sortedIv = Object.keys(ivMap)
      .map(k => parseInt(k, 10))
      .sort((a, b) => a - b)
      .map(k => ivMap[k.toString()])
      .join('');

    return [originData.join(''), sortedIv];
  };

  // 返回接口
  return {
    /**
     * 加密并打包为 token。
     * 规则：3DES(plaintext, derivedKey, iv) => 与 iv 交错 => 产出 `[marksIv][encMarks]|[交错体]`
     * @param source 明文：字符串、对象（按 JSON 序列化）或 null
     * @param iv 可选 8 字符 IV；不传时自动生成
     * @returns 可透传存储/传输的 token 字符串
     * @throws 当明文为空或 IV 长度非法时抛错
     */
    encrypt: (source: SourceInput, iv?: string): string => {
      const plaintext =
        typeof source === 'string'
          ? source
          : source === null
            ? ''
            : JSON.stringify(source);

      if (!plaintext) throw new Error('Source data is empty');

      const actualIv = iv ?? randomAlpha(8);
      if (actualIv.length !== 8) throw new Error('IV must be 8 bytes');

      const encrypted = encrypt3DES(plaintext, derivedKey, Buffer.from(actualIv, 'ascii'));
      return packIv(actualIv, encrypted);
    },

    /**
     * 从 token 解包并解密。
     * @param token 由 `encrypt` 生成的 token
     * @returns 明文字符串；当解析或校验失败时返回 `null`
     */
    decrypt: (token: string): string | null => {
      try {
        const [cipher, iv] = unpackIv(token);
        return decrypt3DES(cipher, derivedKey, Buffer.from(iv, 'ascii'));
      } catch {
        return null;
      }
    },
  };
};

export default {
  create,
};
