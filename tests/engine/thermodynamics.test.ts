import { describe, it, expect } from 'vitest';
import {
  calculateGeometryVolumes,
  calculateThermodynamics,
} from '../../src/scripts/engine/Thermodynamics';
import { DEFAULT_GEOMETRY } from '../../src/scripts/engine/EngineConstants';

describe('Thermodynamic Calculations and Metrics', () => {
  const geom = { ...DEFAULT_GEOMETRY, bore: 70, stroke: 60, compressionRatio: 9.0 };

  it('calculates swept volume accurately', () => {
    // Vs = (pi / 4) * D^2 * L = (pi / 4) * 7.0^2 * 6.0 cm^3 ≈ 230.907 cc
    const { sweptVolumeCc } = calculateGeometryVolumes(geom, 1200);
    const expectedVs = (Math.PI / 4) * 49 * 6.0;
    expect(sweptVolumeCc).toBeCloseTo(expectedVs, 2);
  });

  it('calculates clearance volume based on compression ratio', () => {
    // Vc = Vs / (CR - 1)
    const { sweptVolumeCc, clearanceVolumeCc } = calculateGeometryVolumes(geom, 1200);
    const expectedVc = sweptVolumeCc / (geom.compressionRatio - 1);
    expect(clearanceVolumeCc).toBeCloseTo(expectedVc, 2);

    // Verify compression ratio formula: (Vs + Vc) / Vc = CR
    const computedCr = (sweptVolumeCc + clearanceVolumeCc) / clearanceVolumeCc;
    expect(computedCr).toBeCloseTo(geom.compressionRatio, 4);
  });

  it('calculates mean piston speed Cm = 2 * L * N / 60', () => {
    // For stroke = 60 mm (0.060 m), N = 3000 RPM
    // Cm = 2 * 0.060 * 3000 / 60 = 6.0 m/s
    const { meanPistonSpeed } = calculateGeometryVolumes(geom, 3000);
    expect(meanPistonSpeed).toBeCloseTo(6.0, 4);
  });

  it('verifies cylinder volume bounds during cycle', () => {
    const { clearanceVolumeCc, sweptVolumeCc } = calculateGeometryVolumes(geom, 1200);
    const maxVol = clearanceVolumeCc + sweptVolumeCc;

    // At TDC (0° displacement = 0), volume should equal Vc
    const tdcState = calculateThermodynamics(0, 1200, 0, geom);
    expect(tdcState.currentVolumeCc).toBeCloseTo(clearanceVolumeCc, 1);

    // At BDC (displacement = stroke = 0.060 m), volume should equal Vc + Vs
    const bdcState = calculateThermodynamics(180, 1200, 0.06, geom);
    expect(bdcState.currentVolumeCc).toBeCloseTo(maxVol, 1);
  });

  it('calculates power and torque consistently: P = 2*pi*N*T / 60', () => {
    const state = calculateThermodynamics(90, 2400, 0.03, geom);
    const pWatts = state.brakePowerKw * 1000;
    const computedTorque = (60 * pWatts) / (2 * Math.PI * 2400);
    expect(state.brakeTorqueNm).toBeCloseTo(computedTorque, 2);
  });
});

