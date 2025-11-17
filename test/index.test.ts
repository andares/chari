import { describe, it, expect } from 'vitest';
import { sum, greet, Chari } from '../src/index.js';

describe('chari library', () => {
  it('sum adds two numbers', () => {
    expect(sum(2, 3)).toBe(5);
  });

  it('greet formats message', () => {
    expect(greet('Chari')).toBe('Hello, Chari!');
  });

  it('Chari.hello uses name', () => {
    const c = new Chari('Tester');
    expect(c.hello()).toBe('Hello, Tester!');
  });
});
