/**
 * Valves.ts
 * Manages intake and exhaust valve lift, cam profiles, and valve timing modes (ideal vs realistic).
 */

import type { ValveTimingSettings } from './EngineConstants';

export interface ValveState {
  /** Intake valve lift in mm (0 = seated/closed, >0 = open) */
  intakeLift: number;
  /** Exhaust valve lift in mm (0 = seated/closed, >0 = open) */
  exhaustLift: number;
  /** Normalized intake lift [0, 1] */
  intakeNormalized: number;
  /** Normalized exhaust lift [0, 1] */
  exhaustNormalized: number;
  /** Whether intake valve is open */
  isIntakeOpen: boolean;
  /** Whether exhaust valve is open */
  isExhaustOpen: boolean;
  /** Whether valve overlap is currently occurring */
  isOverlap: boolean;
  /** Inlet Valve Opening angle in crank degrees */
  ivoAngleDeg: number;
  /** Inlet Valve Closing angle in crank degrees */
  ivcAngleDeg: number;
  /** Exhaust Valve Opening angle in crank degrees */
  evoAngleDeg: number;
  /** Exhaust Valve Closing angle in crank degrees */
  evcAngleDeg: number;
  /** Overlap duration in crank degrees */
  overlapDurationDeg: number;
}

/**
 * Computes smooth cam lift profile using harmonic lift curve:
 * Lift = maxLift * sin^2(pi * progress)
 */
function harmonicLift(progress: number, maxLift: number): number {
  if (progress <= 0 || progress >= 1) return 0;
  return maxLift * Math.pow(Math.sin(progress * Math.PI), 2);
}

/**
 * Calculates current valve state for any given crank angle.
 */
export function calculateValves(
  crankAngleDeg: number,
  settings: ValveTimingSettings,
  maxLiftMm = 8.5
): ValveState {
  const norm = ((crankAngleDeg % 720) + 720) % 720;

  if (settings.mode === 'ideal') {
    // Mode A: Ideal Valve Timing
    // Intake valve open strictly 0° to 180°
    let intakeLift = 0;
    if (norm >= 0 && norm <= 180) {
      const p = norm / 180;
      intakeLift = harmonicLift(p, maxLiftMm);
    }

    // Exhaust valve open strictly 540° to 720°
    let exhaustLift = 0;
    if (norm >= 540 && norm <= 720) {
      const p = (norm - 540) / 180;
      exhaustLift = harmonicLift(p, maxLiftMm);
    }

    const isIntakeOpen = intakeLift > 0.01;
    const isExhaustOpen = exhaustLift > 0.01;

    return {
      intakeLift,
      exhaustLift,
      intakeNormalized: intakeLift / maxLiftMm,
      exhaustNormalized: exhaustLift / maxLiftMm,
      isIntakeOpen,
      isExhaustOpen,
      isOverlap: false,
      ivoAngleDeg: 0,
      ivcAngleDeg: 180,
      evoAngleDeg: 540,
      evcAngleDeg: 720,
      overlapDurationDeg: 0,
    };
  }

  // Mode B: Realistic Illustrative Valve Timing
  // IVO is BTDC (i.e. 720 - ivo)
  const ivoAngle = (720 - settings.ivo) % 720;
  // IVC is ABDC (i.e. 180 + ivc)
  const ivcAngle = 180 + settings.ivc;
  // Intake total duration = (720 - ivo to 720) + (0 to 180 + ivc) = ivo + 180 + ivc
  const intakeDuration = settings.ivo + 180 + settings.ivc;

  // EVO is BBDC (i.e. 540 - evo)
  const evoAngle = 540 - settings.evo;
  // EVC is ATDC (i.e. evc)
  const evcAngle = settings.evc;
  // Exhaust total duration = evo + 180 + evc
  const exhaustDuration = settings.evo + 180 + settings.evc;

  // Calculate Intake Lift
  let intakeLift = 0;
  if (norm >= ivoAngle) {
    // Span before 720°
    const offset = norm - ivoAngle;
    const progress = offset / intakeDuration;
    intakeLift = harmonicLift(progress, maxLiftMm);
  } else if (norm <= ivcAngle) {
    // Span after 0°
    const offset = norm + (720 - ivoAngle);
    const progress = offset / intakeDuration;
    intakeLift = harmonicLift(progress, maxLiftMm);
  }

  // Calculate Exhaust Lift
  let exhaustLift = 0;
  if (norm >= evoAngle) {
    // Span from EVO to 720°
    const offset = norm - evoAngle;
    const progress = offset / exhaustDuration;
    exhaustLift = harmonicLift(progress, maxLiftMm);
  } else if (norm <= evcAngle) {
    // Span from 0° to EVC
    const offset = norm + (720 - evoAngle);
    const progress = offset / exhaustDuration;
    exhaustLift = harmonicLift(progress, maxLiftMm);
  }

  const isIntakeOpen = intakeLift > 0.01;
  const isExhaustOpen = exhaustLift > 0.01;
  const isOverlap = isIntakeOpen && isExhaustOpen;
  const overlapDurationDeg = settings.ivo + settings.evc;

  return {
    intakeLift,
    exhaustLift,
    intakeNormalized: intakeLift / maxLiftMm,
    exhaustNormalized: exhaustLift / maxLiftMm,
    isIntakeOpen,
    isExhaustOpen,
    isOverlap,
    ivoAngleDeg: ivoAngle,
    ivcAngleDeg: ivcAngle,
    evoAngleDeg: evoAngle,
    evcAngleDeg: evcAngle,
    overlapDurationDeg,
  };
}
