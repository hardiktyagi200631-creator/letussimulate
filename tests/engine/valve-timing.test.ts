import { describe, it, expect } from 'vitest';
import { calculateValves } from '../../src/scripts/engine/Valves';
import { DEFAULT_VALVE_TIMING } from '../../src/scripts/engine/EngineConstants';

describe('Valve Timing and Dynamics', () => {
  it('handles ideal valve timing: intake open 0-180, exhaust open 540-720', () => {
    const idealSettings = { ...DEFAULT_VALVE_TIMING, mode: 'ideal' as const };

    // Intake stroke mid-point
    const at90 = calculateValves(90, idealSettings);
    expect(at90.isIntakeOpen).toBe(true);
    expect(at90.isExhaustOpen).toBe(false);
    expect(at90.intakeLift).toBeGreaterThan(0);

    // Compression stroke
    const at270 = calculateValves(270, idealSettings);
    expect(at270.isIntakeOpen).toBe(false);
    expect(at270.isExhaustOpen).toBe(false);

    // Power stroke
    const at450 = calculateValves(450, idealSettings);
    expect(at450.isIntakeOpen).toBe(false);
    expect(at450.isExhaustOpen).toBe(false);

    // Exhaust stroke mid-point
    const at630 = calculateValves(630, idealSettings);
    expect(at630.isIntakeOpen).toBe(false);
    expect(at630.isExhaustOpen).toBe(true);
    expect(at630.exhaustLift).toBeGreaterThan(0);
  });

  it('detects valve overlap in realistic timing mode', () => {
    const realisticSettings = {
      ...DEFAULT_VALVE_TIMING,
      mode: 'realistic' as const,
      ivo: 12,
      evc: 10,
    };

    // At 718° (just before TDC 720/0), inlet valve should already be opening (IVO=12 => 708°)
    // and exhaust valve should still be closing (EVC=10 => 10°)
    const at718 = calculateValves(718, realisticSettings);
    expect(at718.isIntakeOpen).toBe(true);
    expect(at718.isExhaustOpen).toBe(true);
    expect(at718.isOverlap).toBe(true);

    // At 5° (just after TDC 0°), both should still be open
    const at5 = calculateValves(5, realisticSettings);
    expect(at5.isIntakeOpen).toBe(true);
    expect(at5.isExhaustOpen).toBe(true);
    expect(at5.isOverlap).toBe(true);

    // At 100° (deep in intake), only intake should be open
    const at100 = calculateValves(100, realisticSettings);
    expect(at100.isIntakeOpen).toBe(true);
    expect(at100.isExhaustOpen).toBe(false);
  });

  it('never exceeds configured maximum valve lift', () => {
    const maxLift = 8.5;
    for (let deg = 0; deg < 720; deg += 5) {
      const state = calculateValves(deg, DEFAULT_VALVE_TIMING, maxLift);
      expect(state.intakeLift).toBeLessThanOrEqual(maxLift + 1e-4);
      expect(state.exhaustLift).toBeLessThanOrEqual(maxLift + 1e-4);
      expect(state.intakeLift).toBeGreaterThanOrEqual(0);
      expect(state.exhaustLift).toBeGreaterThanOrEqual(0);
    }
  });
});

