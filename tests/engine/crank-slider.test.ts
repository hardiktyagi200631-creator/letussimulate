import { describe, it, expect } from 'vitest';
import { calculateCrankSlider } from '../../src/scripts/engine/CrankSlider';

describe('Crank-Slider Kinematics', () => {
  const strokeMm = 60;
  const conRodMm = 110;
  const rpm = 1200;

  it('should have zero displacement at TDC (theta = 0°)', () => {
    const state = calculateCrankSlider(0, rpm, strokeMm, conRodMm);
    expect(state.displacement).toBeCloseTo(0, 5);
  });

  it('should have displacement equal to stroke length at BDC (theta = 180°)', () => {
    const state = calculateCrankSlider(180, rpm, strokeMm, conRodMm);
    const strokeM = strokeMm / 1000;
    expect(state.displacement).toBeCloseTo(strokeM, 5);
  });

  it('should return to zero displacement at theta = 360° and theta = 720°', () => {
    const state360 = calculateCrankSlider(360, rpm, strokeMm, conRodMm);
    const state720 = calculateCrankSlider(720, rpm, strokeMm, conRodMm);
    expect(state360.displacement).toBeCloseTo(0, 5);
    expect(state720.displacement).toBeCloseTo(0, 5);
  });

  it('should have zero velocity at TDC (0°) and BDC (180°)', () => {
    const tdcState = calculateCrankSlider(0, rpm, strokeMm, conRodMm);
    const bdcState = calculateCrankSlider(180, rpm, strokeMm, conRodMm);
    expect(tdcState.velocity).toBeCloseTo(0, 4);
    expect(bdcState.velocity).toBeCloseTo(0, 4);
  });

  it('should maintain an exact constant connecting rod length at all crank angles', () => {
    const expectedLengthM = conRodMm / 1000;
    for (let deg = 0; deg < 720; deg += 15) {
      const state = calculateCrankSlider(deg, rpm, strokeMm, conRodMm);
      const dx = state.pistonPinX - state.crankPinX;
      const dy = state.pistonPinY - state.crankPinY;
      const calculatedLength = Math.sqrt(dx * dx + dy * dy);
      expect(calculatedLength).toBeCloseTo(expectedLengthM, 6);
    }
  });

  it('should calculate connecting rod angle correctly', () => {
    // At theta = 0, rod angle must be 0
    const state0 = calculateCrankSlider(0, rpm, strokeMm, conRodMm);
    expect(state0.rodAngleDeg).toBeCloseTo(0, 4);

    // At theta = 90, sin(phi) = r / l = 30 / 110 = 0.2727...
    const state90 = calculateCrankSlider(90, rpm, strokeMm, conRodMm);
    const expectedPhiDeg = (Math.asin(30 / 110) * 180) / Math.PI;
    expect(state90.rodAngleDeg).toBeCloseTo(expectedPhiDeg, 4);
  });
});

