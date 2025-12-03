// Pure TypeScript implementations
import { Gauldoth } from '~/encryption';
import { Obfus as ObfusTS } from '~/generators';

// WASM-powered implementations (preferred for performance)
import {
  BaseFlow,
  CryptoManager,
  ParamSimplifier,
  randomAlpha,
  bin2hex,
  hex2bin,
  generateCode as generateCodeWasm,
} from '~/wasm';

// Re-export Utils with WASM functions
export const Utils = {
  randomAlpha,
  bin2hex,
  hex2bin,
};

// Re-export Obfus with WASM implementation
export const Obfus = {
  generateCode: generateCodeWasm,
};

// Re-export other modules
export {
  Gauldoth,
  CryptoManager,
  BaseFlow,
  ParamSimplifier,
};

// Legacy TypeScript-only exports (for backward compatibility)
export { Obfus as ObfusTS } from '~/generators';

// Default export aggregation
export default {
  Gauldoth,
  CryptoManager,
  BaseFlow,
  ParamSimplifier,
  Obfus,
  Utils,
};
