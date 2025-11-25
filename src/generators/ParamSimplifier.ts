import { encode, decode } from '@msgpack/msgpack';

class ParamSimplifier {
  /**
   * 类型守卫：检查是否为复合类型（对象或非空数组）
   */
  private static isComposite(value: unknown): value is Record<string, unknown> | unknown[] {
    return (
      value !== null &&
      typeof value === 'object' &&
      !ArrayBuffer.isView(value) &&
      !(value instanceof Date)
    );
  }

  /**
   * 检查数组是否为纯索引列表（连续数字索引）
   */
  private static isPureList(arr: unknown[]): boolean {
    if (arr.length === 0) return true;

    // 检查所有键是否为连续数字 0..n-1
    const keys = Object.keys(arr);
    if (keys.length !== arr.length) return false;

    return keys.every((key, index) => parseInt(key, 10) === index);
  }

  /**
   * 核心简化逻辑：排序+裁剪
   */
  static simplify(input: Record<string, unknown>): Record<string, unknown> {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      throw new Error('Input must be a non-null object');
    }

    const normalized: Record<string, unknown> = {};
    const sortedKeys = Object.keys(input).sort();

    for (const key of sortedKeys) {
      const value = input[key];

      // 1. 简单类型直接保留
      if (!this.isComposite(value)) {
        normalized[key] = value;
        continue;
      }

      // 2. 处理数组类型
      if (Array.isArray(value)) {
        // 2.1 空数组特殊处理
        if (value.length === 0) {
          normalized[key] = '[*LI:0*]';
          continue;
        }

        // 2.2 判断是否为纯索引列表
        if (this.isPureList(value)) {
          const firstItem = value[0];

          // 2.3 非复合类型列表
          if (!this.isComposite(firstItem)) {
            normalized[key] = `[*LI:${value.length}*]`;
          }
          // 2.4 复合类型列表 - 检查第3级
          else {
            // 2.4.1 第3级是数组
            if (Array.isArray(firstItem)) {
              normalized[key] = `[*CO:${value.length}*]`;
            }
            // 2.4.2 第3级是非数组复合类型
            else {
              const subKeys = Object.keys(firstItem).sort().join(',');
              normalized[key] = `[*CO:${subKeys}*]`;
            }
          }
        }
        // 2.5 非纯列表（关联数组）
        else {
          const subKeys = Object.keys(value).sort().join(',');
          normalized[key] = `[*RE:${subKeys}*]`;
        }
        continue;
      }

      // 3. 非数组的复合对象
      const subKeys = Object.keys(value).sort().join(',');
      normalized[key] = `[*RE:${subKeys}*]`;
    }

    return normalized;
  }

  /**
   * 编码：简化 + msgpack 序列化
   */
  static encode(input: Record<string, unknown>): Uint8Array {
    const simplified = this.simplify(input);
    return encode(simplified);
  }

  /**
   * 解码：仅反序列化 msgpack 数据
   */
  static decode(buffer: Uint8Array): Record<string, unknown> {
    return decode(buffer) as Record<string, unknown>;
  }
}

export default ParamSimplifier;