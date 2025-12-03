import { ParamSimplifier as WasmSimplifier } from '../../wasm/pkg/chari_wasm.js';

/**
 * WASM-powered parameter structure simplification
 */
export class ParamSimplifier {
  /**
   * Simplify nested structures and encode
   * @param data - Data to simplify
   * @returns Encoded Uint8Array
   */
  static encode(data: any): Uint8Array {
    return WasmSimplifier.encode(data);
  }
}
