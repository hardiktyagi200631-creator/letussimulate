import { describe, it, expect } from 'vitest';
import { getCycleState } from '../../src/scripts/engine/EngineCycle';

describe('Four-Stroke 720-Degree Cycle', () => {
  it('identifies Stroke 1: Intake (0° to 180°)', () => {
    const s1 = getCycleState(45);
    expect(s1.stroke).toBe('intake');
    expect(s1.strokeIndex).toBe(1);
    expect(s1.strokeProgress).toBeCloseTo(45 / 180, 4);
  });

  it('identifies Stroke 2: Compression (180° to 360°)', () => {
    const s2 = getCycleState(270);
    expect(s2.stroke).toBe('compression');
    expect(s2.strokeIndex).toBe(2);
    expect(s2.strokeProgress).toBeCloseTo(90 / 180, 4);
  });

  it('identifies Stroke 3: Power (360° to 540°)', () => {
    const s3 = getCycleState(400);
    expect(s3.stroke).toBe('power');
    expect(s3.strokeIndex).toBe(3);
    expect(s3.strokeProgress).toBeCloseTo(40 / 180, 4);
  });

  it('identifies Stroke 4: Exhaust (540° to 720°)', () => {
    const s4 = getCycleState(630);
    expect(s4.stroke).toBe('exhaust');
    expect(s4.strokeIndex).toBe(4);
    expect(s4.strokeProgress).toBeCloseTo(90 / 180, 4);
  });

  it('enforces camshaft rotation at exactly half crankshaft speed', () => {
    expect(getCycleState(0).camAngleDeg).toBe(0);
    expect(getCycleState(180).camAngleDeg).toBe(90);
    expect(getCycleState(360).camAngleDeg).toBe(180);
    expect(getCycleState(540).camAngleDeg).toBe(270);
    expect(getCycleState(720).camAngleDeg).toBe(0);
  });

  it('activates spark plug in the configured pre-TDC ignition window', () => {
    // Default: sparkAdvance = 15° BTDC (345°), duration = 8° (up to 353°)
    const beforeSpark = getCycleState(340);
    expect(beforeSpark.isSparkActive).toBe(false);

    const duringSpark = getCycleState(349);
    expect(duringSpark.isSparkActive).toBe(true);
    expect(duringSpark.sparkIntensity).toBeGreaterThan(0);

    const afterSpark = getCycleState(356);
    expect(afterSpark.isSparkActive).toBe(false);
  });

  it('wraps angles smoothly without cycle discontinuity', () => {
    const at719 = getCycleState(719.9);
    const at0 = getCycleState(720);
    expect(at719.stroke).toBe('exhaust');
    expect(at0.stroke).toBe('intake');
    expect(at0.crankAngleDeg).toBeCloseTo(0, 4);
  });
});

