import { generateCode as wasmGenerateCode } from '../../wasm/pkg/chari_wasm.js';

/**
 * Generate XOR-obfuscated code string
 * @param code - Code to obfuscate
 * @returns Obfuscated code wrapped in IIFE
 */
export function generateCode(code: string): string {
  return wasmGenerateCode(code);
}
