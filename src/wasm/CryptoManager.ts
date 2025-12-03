import { CryptoManager as WasmCrypto } from '../../wasm/pkg/chari_wasm.js';

/**
 * WASM-powered cryptographic operations
 */
export class CryptoManager {
  /**
   * Pack binary key to base62 string
   * @param key - Binary key data
   * @returns Base62-encoded key
   */
  static packKey(key: Uint8Array): string {
    return WasmCrypto.packKey(key);
  }

  /**
   * Unpack base62 key to binary
   * @param packed - Base62-encoded key
   * @returns Binary key data
   */
  static unpackKey(packed: string): Uint8Array {
    return WasmCrypto.unpackKey(packed);
  }

  /**
   * Generate a random 32-byte master key
   * @returns Packed master key
   */
  static generateMasterKey(): string {
    return WasmCrypto.generateMasterKey();
  }

  /**
   * Derive key from master key using HKDF
   * @param masterKeyPacked - Packed master key
   * @param info - Context/purpose info
   * @returns Hex-encoded derived key
   */
  static deriveKey(masterKeyPacked: string, info?: string): string {
    return WasmCrypto.deriveKey(masterKeyPacked, info);
  }

  /**
   * Sign request parameters with HMAC
   * @param derivedKeyPacked - Derived key (packed base62)
   * @param challenge - Challenge string
   * @param params - Parameters to sign
   * @param timestampWindow - Optional timestamp window
   * @returns Signature string
   */
  static sign(
    derivedKeyPacked: string,
    challenge: string,
    params: unknown,
    timestampWindow?: number
  ): string {
    return WasmCrypto.sign(derivedKeyPacked, challenge, params as any, timestampWindow);
  }

  /**
   * Verify request signature
   * @param derivedKeyPacked - Derived key (packed base62)
   * @param challenge - Challenge string
   * @param params - Parameters to verify
   * @param signature - Signature to check
   * @param allowedWindowDrift - Allow previous window
   * @returns Whether signature is valid
   */
  static verify(
    derivedKeyPacked: string,
    challenge: string,
    params: unknown,
    signature: string,
    allowedWindowDrift = true
  ): boolean {
    return WasmCrypto.verify(derivedKeyPacked, challenge, params as any, signature, allowedWindowDrift);
  }
}
