import { encode, decode } from '@msgpack/msgpack';

class ParamSimplifier {
  /**
   * 简单类型白名单 (非复合类型)
   */
  private static isSimpleType(value: unknown): boolean {
    return (
      value === null ||
      value === undefined ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    );
  }

  /**
   * 检查是否为纯索引列表 (无字符串键)
   */
  private static isPureList(arr: unknown[]): boolean {
    if (arr.length === 0) return true;

    // 检查是否只有数字索引且连续
    const maxIndex = arr.length - 1;
    for (let i = 0; i <= maxIndex; i++) {
      if (!(i in arr)) return false;
    }

    // 排除有字符串键的情况
    return Object.keys(arr).every(key => !isNaN(Number(key)));
  }

  /**
   * 获取第一个非空元素 (用于异构列表)
   */
  private static getFirstValidItem(items: unknown[]): unknown | null {
    for (const item of items) {
      if (item !== null && item !== undefined) return item;
    }
    return null;
  }

  /**
   * 提取 Map 结构的键名 (按 UTF-8 字典序)
   */
  private static extractMapKeys(value: unknown): string[] {
    if (Array.isArray(value)) {
      // 关联数组：过滤数字键
      return Object.keys(value).filter(key => isNaN(Number(key)));
    }

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value);
    }

    return [];
  }

  static simplify(input: Record<string, unknown>): Record<string, unknown> {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      throw new Error('Input must be a non-null object');
    }

    const normalized: Record<string, unknown> = {};
    const sortedKeys = Object.keys(input).sort((a, b) =>
      a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' })
    );

    for (const key of sortedKeys) {
      const value = input[key];

      // 1. 空容器统一处理
      if (
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'object' && value !== null &&
         !Array.isArray(value) && Object.keys(value).length === 0)
      ) {
        normalized[key] = '[*EM*]';
        continue;
      }

      // 2. 处理数组
      if (Array.isArray(value)) {
        // 2.1 纯索引列表
        if (this.isPureList(value)) {
          // 2.2 检查元素类型
          const firstValid = this.getFirstValidItem(value);

          if (firstValid === null || this.isSimpleType(firstValid)) {
            // 简单列表
            normalized[key] = `[*LI:${value.length}*]`;
          } else {
            // 复合列表
            if (!Array.isArray(firstValid) && typeof firstValid === 'object') {
              // 元素是 Map
              const subKeys = this.extractMapKeys(firstValid).sort((a, b) =>
                a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' })
              );
              normalized[key] = `[*CO:${value.length}:${subKeys.join(',')}*]`;
            } else {
              // 元素是非Map复合类型 (数组/其他)
              normalized[key] = `[*CO:${value.length}*]`;
            }
          }
        }
        // 2.3 非纯列表 = 关联数组
        else {
          const subKeys = this.extractMapKeys(value).sort((a, b) =>
            a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' })
          );
          normalized[key] = `[*RE:${subKeys.join(',')}*]`;
        }
        continue;
      }

      // 3. 非数组的复合对象
      if (typeof value === 'object' && value !== null) {
        const subKeys = Object.keys(value).sort((a, b) =>
          a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' })
        );
        normalized[key] = `[*RE:${subKeys.join(',')}*]`;
      }
      // 4. 简单类型直接保留
      else {
        normalized[key] = value;
      }
    }

    return normalized;
  }

  static encode(input: Record<string, unknown>): Uint8Array {
    const simplified = this.simplify(input);
    return encode(simplified);
  }

  static decode(buffer: Uint8Array): Record<string, unknown> {
    return decode(buffer) as Record<string, unknown>;
  }
}

export default ParamSimplifier;