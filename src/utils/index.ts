import * as crypto from 'node:crypto';

// ----------------------------
// 随机工具（箭头函数）
// ----------------------------
/**
 * 可选字符集（62 进制）
 */
const ALPHA_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
/**
 * 可选字符集（36 进制，仅大写 + 数字）
 */
const ALPHA36_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * 生成指定长度的随机字符串，支持 62/36 进制字符集。
 * 使用拒绝采样（rejection sampling）避免取模偏差：
 * - 对 base=62，拒绝范围 [248, 255]
 * - 对 base=36，拒绝范围 [252, 255]
 * @param length 目标长度
 * @param mode 字符集模式：`alpha` 为 62 进制，`alpha36` 为 36 进制
 * @returns 随机字符串
 */
export const randomAlpha = (length: number, mode: 'alpha' | 'alpha36' = 'alpha'): string => {
  const chars = mode === 'alpha36' ? ALPHA36_CHARS : ALPHA_CHARS;
  const base = mode === 'alpha36' ? 36 : 62;
  const byteLimit = mode === 'alpha36' ? 36 * 7 : 62 * 4; // 252 or 248

  let result = '';
  let bytes = crypto.randomBytes(length * 2);
  let used = 0;

  for (let i = 0; i < length; i++) {
    let byte: number;
    do {
      if (used >= bytes.length) {
        // 重新填充随机字节池，避免越界
        bytes = crypto.randomBytes(length);
        used = 0;
      }
      byte = bytes[used++];
    } while (byte >= byteLimit); // 拒绝超出安全上限的值，保证均匀映射到 base
    result += chars[byte % base];
  }
  return result;
};