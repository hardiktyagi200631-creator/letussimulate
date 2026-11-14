/**
 * EngineCycle.ts
 * Manages the 720-degree four-stroke thermodynamic cycle, stroke state, and spark timing.
 */

export type StrokeType = 'intake' | 'compression' | 'power' | 'exhaust';

export interface CycleState {
  /** Normalized crankshaft angle in degrees [0, 720) */
  crankAngleDeg: number;
  /** Camshaft angle in degrees [0, 360) (camshaft speed = crankshaft speed / 2) */
  camAngleDeg: number;
  /** Current stroke */
  stroke: StrokeType;
  /** Stroke name display in English */
  strokeName: string;
  /** Stroke index: 1 = intake, 2 = compression, 3 = power, 4 = exhaust */
  strokeIndex: number;
  /** Progress within the current stroke from 0.0 to 1.0 */
  strokeProgress: number;
  /** Whether the spark plug is actively firing */
  isSparkActive: boolean;
  /** Spark intensity from 0.0 to 1.0 */
  sparkIntensity: number;
  /** Combustion flame kernel expansion factor from 0.0 to 1.0 */
  combustionIntensity: number;
  /** Total completed 720-degree cycles */
  completedCycles: number;
}

/**
 * Evaluates the cycle state given a continuous crank angle in degrees.
 *
 * @param totalCrankAngleDeg Continuous crank angle in degrees (can be any real number >= 0)
 * @param sparkAdvance Deg BTDC (e.g. 15°)
 * @param sparkDuration Deg duration (e.g. 8°)
 */
export function getCycleState(
  totalCrankAngleDeg: number,
  sparkAdvance = 15,
  sparkDuration = 8
): CycleState {
  const normDeg = ((totalCrankAngleDeg % 720) + 720) % 720;
  const completedCycles = Math.floor(totalCrankAngleDeg / 720);
  const camAngleDeg = (normDeg / 2) % 360;

  let stroke: StrokeType;
  let strokeName: string;
  let strokeIndex: number;
  let strokeStartDeg: number;

  if (normDeg < 180) {
    stroke = 'intake';
    strokeName = 'Intake (Suction)';
    strokeIndex = 1;
    strokeStartDeg = 0;
  } else if (normDeg < 360) {
    stroke = 'compression';
    strokeName = 'Compression';
    strokeIndex = 2;
    strokeStartDeg = 180;
  } else if (normDeg < 540) {
    stroke = 'power';
    strokeName = 'Power (Expansion)';
    strokeIndex = 3;
    strokeStartDeg = 360;
  } else {
    stroke = 'exhaust';
    strokeName = 'Exhaust';
    strokeIndex = 4;
    strokeStartDeg = 540;
  }

  const strokeProgress = (normDeg - strokeStartDeg) / 180;

  // Spark timing: happens near end of compression stroke before TDC (360°)
  // If sparkAdvance = 15°, spark starts at 360 - 15 = 345°
  const sparkStart = 360 - sparkAdvance;
  const sparkEnd = sparkStart + sparkDuration;

  let isSparkActive = false;
  let sparkIntensity = 0;

  if (normDeg >= sparkStart && normDeg <= sparkEnd) {
    isSparkActive = true;
    // Bell curve or triangle intensity over the duration
    const progress = (normDeg - sparkStart) / sparkDuration;
    sparkIntensity = Math.sin(progress * Math.PI);
  }

  // Combustion flame intensity: starts at spark, peaks just after TDC (365° - 375°), fades by 420°
  let combustionIntensity = 0;
  if (normDeg >= sparkStart && normDeg <= 440) {
    if (normDeg < 360) {
      // Flame kernel developing before TDC
      const p = (normDeg - sparkStart) / sparkAdvance;
      combustionIntensity = 0.3 * Math.pow(p, 2);
    } else if (normDeg <= 375) {
      // Rapid flame propagation and peak heat release
      const p = (normDeg - 360) / 15;
      combustionIntensity = 0.3 + 0.7 * Math.sin((p * Math.PI) / 2);
    } else {
      // Expansion / burnout phase
      const p = (normDeg - 375) / (440 - 375);
      combustionIntensity = Math.max(0, 1.0 - p);
    }
  }

  return {
    crankAngleDeg: normDeg,
    camAngleDeg,
    stroke,
    strokeName,
    strokeIndex,
    strokeProgress,
    isSparkActive,
    sparkIntensity,
    combustionIntensity,
    completedCycles,
  };
}

