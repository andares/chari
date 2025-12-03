import { randomAlpha as wasmRandomAlpha, bin2hex as wasmBin2hex, hex2bin as wasmHex2bin } from '../../wasm/pkg/chari_wasm.js';

/**
 * Generate random alphabetic string
 * @param length - Number of characters
 * @returns Random a-z string
 */
export function randomAlpha(length: number): string {
  return wasmRandomAlpha(length);
}

/**
 * Convert binary to hex string
 * @param bin - Binary data
 * @returns Hex string
 */
export function bin2hex(bin: Uint8Array): string {
  return wasmBin2hex(bin);
}

/**
 * Convert hex string to binary
 * @param hex - Hex string
 * @returns Binary data
 */
export function hex2bin(hex: string): Uint8Array {
  return wasmHex2bin(hex);
}
