  // 支持的进制范围：2 - 62
  // 与 PHP GMP 基础字符顺序保持一致：0-9 a-z A-Z
  const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const isValidBase = (base: number): boolean => base >= 2 && base <= 62;

const bigintToBase = (value: bigint, base: number): string => {
  if (!isValidBase(base)) throw new Error(`Base must be between 2 and 62, got ${base}`);
  if (value === 0n) return '0';

  let result = '';
  let n = value;
  while (n > 0n) {
    const idx = Number(n % BigInt(base));
    result = DIGITS[idx] + result;
    n = n / BigInt(base);
  }
  return result;
};

const baseToBigint = (str: string, base: number): bigint => {
  if (!isValidBase(base)) throw new Error(`Base must be between 2 and 62, got ${base}`);
  if (str === '') throw new Error('Empty string cannot be converted');

  let result = 0n;
  for (const char of str) {
    const idx = DIGITS.indexOf(char);
    if (idx === -1 || idx >= base) {
      throw new Error(`Invalid character "${char}" for base ${base}`);
    }
    result = result * BigInt(base) + BigInt(idx);
  }
  return result;
};

// ----------------------------
// BaseFlow 类（函数式风格，但为保持语义用 class）
// ----------------------------

export default class BaseFlow {
  private hex: string;

  constructor(value: string | number | bigint, base: number = 10) {
    if (base === 16) {
      this.hex = String(value).replace(/^0x/i, '').toLowerCase();
      if (!/^[0-9a-f]+$/.test(this.hex)) {
        throw new Error('Invalid hex string');
      }
      return;
    }
    if (!isValidBase(base)) {
      throw new Error(`Base must be between 2 and 62, got ${base}`);
    }
    // 统一以字符串解析为指定进制（兼容 base62 与 base26 等）
    const strVal = typeof value === 'bigint' ? value.toString() : String(value);
    const bigVal = baseToBigint(strVal, base);
    this.hex = bigVal.toString(16);
  }

  to = (base: number): string => {
    if (base === 16) return this.hex;
    const num = BigInt('0x' + this.hex);
    return bigintToBase(num, base);
  };

  static fromAlpha = (alpha: string): BaseFlow => {
    // alpha: 'a' to 'z' → map to 26进制字符: '0'-'9' + 'a'-'p'
    const mapped: string[] = [];
    for (const ch of alpha) {
      const code = ch.charCodeAt(0);
      if (code >= 97 && code <= 122) {
        // 'a' (97) to 'z' (122)
        if (code <= 106) {
          // 'a'-'j' → 97-106 → map to '0'-'9'
          mapped.push(String.fromCharCode(code - 49)); // 97-49=48 → '0'
        } else {
          // 'k'-'z' → 107-122 → map to 'a'-'p' (97-112)
          mapped.push(String.fromCharCode(code - 10)); // 107-10=97 → 'a'
        }
      } else {
        throw new Error(`Invalid alpha character: ${ch}. Expected a-z.`);
      }
    }
    const base26Str = mapped.join('');
    const num = baseToBigint(base26Str, 26);
    return new BaseFlow(num.toString(16), 16);
  };

  toAlpha = (): string => {
    const base26Str = bigintToBase(BigInt('0x' + this.hex), 26);
    const result: string[] = [];
    for (const ch of base26Str) {
      const code = ch.charCodeAt(0);
      if (code >= 48 && code <= 57) {
        // '0'-'9' → map to 'a'-'j'
        result.push(String.fromCharCode(code + 49)); // '0'(48)+49=97 → 'a'
      } else if (code >= 97 && code <= 112) {
        // 'a'-'p' → map to 'k'-'z'
        result.push(String.fromCharCode(code + 10)); // 'a'(97)+10=107 → 'k'
      } else {
        throw new Error(`Unexpected base26 digit: ${ch}`);
      }
    }
    return result.join('');
  };
}