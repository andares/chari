import { BaseFlow as WasmBaseFlow } from '../../wasm/pkg/chari_wasm.js';

/**
 * WASM-powered multi-base number converter
 */
export class BaseFlow {
  private inner: WasmBaseFlow;

  /**
   * Create a BaseFlow instance from a number or bigint
   * @param value - Decimal value
   * @param base - Base for initial conversion (2-62)
   */
  constructor(value: number | bigint | string, base = 10) {
    // Convert to string representation
    const strValue = value.toString();
    this.inner = new WasmBaseFlow(strValue, base);
  }

  /**
   * Convert from alpha encoding (a-z) to decimal
   * @param alpha - Alpha-encoded string
   * @returns BaseFlow instance
   */
  static fromAlpha(alpha: string): BaseFlow {
    const instance = Object.create(BaseFlow.prototype);
    instance.inner = WasmBaseFlow.fromAlpha(alpha);
    return instance;
  }

  /**
   * Convert to target base representation
   * @param base - Target base (2-62)
   * @returns String representation in target base
   */
  to(base: number): string {
    return this.inner.to(base);
  }

  /**
   * Convert to alpha encoding (a-z)
   * @returns Alpha-encoded string
   */
  toAlpha(): string {
    return this.inner.toAlpha();
  }
}
