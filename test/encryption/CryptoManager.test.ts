import { describe, it, expect, vi } from 'vitest';
import { CryptoManager } from '~/encryption/CryptoManager';
import * as crypto from 'node:crypto';

describe('CryptoManager', () => {
  it('pack/unpack preserves numeric value (前导零半字节/整字节可能丢失)', () => {
    const raw = crypto.randomBytes(16);
    const packed = CryptoManager.packKey(raw);
    const unpacked = CryptoManager.unpackKey(packed);
    const originalHex = raw.toString('hex');
    const normalizedHex = BigInt('0x' + originalHex).toString(16); // 模拟 GMP 去除前导 0
    const normalizedBuf = Buffer.from(normalizedHex.length % 2 === 1 ? '0' + normalizedHex : normalizedHex, 'hex');
    expect(unpacked.equals(normalizedBuf)).toBe(true);
  });

  it('generateMasterKey produces 32-byte raw key when unpacked', () => {
    const master = CryptoManager.generateMasterKey();
    const raw = CryptoManager.unpackKey(master);
    expect(raw.length).toBe(32);
  });

  it('deriveKey deterministic for same info and master', () => {
    const master = CryptoManager.generateMasterKey();
    const k1 = CryptoManager.deriveKey(master, 'info-x');
    const k2 = CryptoManager.deriveKey(master, 'info-x');
    expect(k1).toBe(k2);
  });

  it('deriveKey differs for different info', () => {
    const master = CryptoManager.generateMasterKey();
    const k1 = CryptoManager.deriveKey(master, 'info-a');
    const k2 = CryptoManager.deriveKey(master, 'info-b');
    expect(k1).not.toBe(k2);
  });

  it('sign deterministic for same params/challenge/window', () => {
    const master = CryptoManager.generateMasterKey();
    const derived = CryptoManager.deriveKey(master, 'sign-test');
    const fixedTs = 1731800000000; // stable timestamp
    const win = Math.floor(fixedTs / 1000 / 10);
    const s1 = CryptoManager.sign(derived, 'CHAL', { a: 1 }, win);
    const s2 = CryptoManager.sign(derived, 'CHAL', { a: 1 }, win);
    expect(s1).toBe(s2);
  });

  it('sign changes with different challenge', () => {
    const master = CryptoManager.generateMasterKey();
    const derived = CryptoManager.deriveKey(master, 'sign-test');
    const fixedTs = 1731800000000;
    const win = Math.floor(fixedTs / 1000 / 10);
    const s1 = CryptoManager.sign(derived, 'C1', { a: 1 }, win);
    const s2 = CryptoManager.sign(derived, 'C2', { a: 1 }, win);
    expect(s1).not.toBe(s2);
  });

  it('verify succeeds for current window', () => {
    const master = CryptoManager.generateMasterKey();
    const derived = CryptoManager.deriveKey(master, 'verify-test');
    const fixedTs = 1731800000000;
    vi.spyOn(Date, 'now').mockReturnValue(fixedTs);
    const win = Math.floor(fixedTs / 1000 / 10);
    const sig = CryptoManager.sign(derived, 'CHAL', 'payload', win);
    expect(CryptoManager.verify(derived, 'CHAL', 'payload', sig)).toBe(true);
    vi.restoreAllMocks();
  });

  it('verify accepts previous window when drift allowed', () => {
    const master = CryptoManager.generateMasterKey();
    const derived = CryptoManager.deriveKey(master, 'verify-drift');
    const fixedTs = 1731800000000;
    const currentWin = Math.floor(fixedTs / 1000 / 10);
    const prevWin = currentWin - 1;
    // signature generated for previous window
    const sigPrev = CryptoManager.sign(derived, 'CHAL', 'payload', prevWin);
    vi.spyOn(Date, 'now').mockReturnValue(fixedTs);
    expect(CryptoManager.verify(derived, 'CHAL', 'payload', sigPrev, true)).toBe(true);
    vi.restoreAllMocks();
  });

  it('verify rejects previous window when drift disabled', () => {
    const master = CryptoManager.generateMasterKey();
    const derived = CryptoManager.deriveKey(master, 'verify-nodrift');
    const fixedTs = 1731800000000;
    const currentWin = Math.floor(fixedTs / 1000 / 10);
    const prevWin = currentWin - 1;
    const sigPrev = CryptoManager.sign(derived, 'CHAL', 'payload', prevWin);
    vi.spyOn(Date, 'now').mockReturnValue(fixedTs);
    expect(CryptoManager.verify(derived, 'CHAL', 'payload', sigPrev, false)).toBe(false);
    vi.restoreAllMocks();
  });

  it('verify fails for mismatched params', () => {
    const master = CryptoManager.generateMasterKey();
    const derived = CryptoManager.deriveKey(master, 'verify-mismatch');
    const fixedTs = 1731800000000;
    vi.spyOn(Date, 'now').mockReturnValue(fixedTs);
    const win = Math.floor(fixedTs / 1000 / 10);
    const sig = CryptoManager.sign(derived, 'CHAL', 'payload-A', win);
    expect(CryptoManager.verify(derived, 'CHAL', 'payload-B', sig)).toBe(false);
    vi.restoreAllMocks();
  });
});
