/**
 * EngineConstants.ts
 * Physical and geometric constants for the single-cylinder four-stroke petrol engine.
 */

export interface EngineGeometry {
  /** Cylinder bore in millimetres (default: 70 mm) */
  bore: number;
  /** Piston stroke in millimetres (default: 60 mm) */
  stroke: number;
  /** Connecting rod length in millimetres (default: 110 mm) */
  conRodLength: number;
  /** Compression ratio (default: 9.0) */
  compressionRatio: number;
  /** Maximum valve lift in millimetres (default: 8.5 mm) */
  maxValveLift: number;
  /** Intake valve diameter in mm (default: 28 mm) */
  intakeValveDiameter: number;
  /** Exhaust valve diameter in mm (default: 24 mm) */
  exhaustValveDiameter: number;
}

export interface ValveTimingSettings {
  /** Timing mode: ideal (0-180, 540-720) or realistic */
  mode: 'ideal' | 'realistic';
  /** Inlet Valve Opens (deg BTDC, e.g. 12°) */
  ivo: number;
  /** Inlet Valve Closes (deg ABDC, e.g. 42°) */
  ivc: number;
  /** Exhaust Valve Opens (deg BBDC, e.g. 48°) */
  evo: number;
  /** Exhaust Valve Closes (deg ATDC, e.g. 10°) */
  evc: number;
}

export interface IgnitionSettings {
  /** Spark advance in degrees BTDC (e.g. 15°) */
  sparkAdvance: number;
  /** Duration of visible spark in degrees (e.g. 8°) */
  sparkDuration: number;
}

export const DEFAULT_GEOMETRY: EngineGeometry = {
  bore: 70, // mm
  stroke: 60, // mm
  conRodLength: 110, // mm
  compressionRatio: 9.0,
  maxValveLift: 8.5, // mm
  intakeValveDiameter: 28, // mm
  exhaustValveDiameter: 24, // mm
};

export const DEFAULT_VALVE_TIMING: ValveTimingSettings = {
  mode: 'realistic',
  ivo: 12, // deg BTDC (crank angle: 708°)
  ivc: 42, // deg ABDC (crank angle: 222°)
  evo: 48, // deg BBDC (crank angle: 492°)
  evc: 10, // deg ATDC (crank angle: 10°)
};

export const DEFAULT_IGNITION: IgnitionSettings = {
  sparkAdvance: 15, // deg BTDC (crank angle: 345°)
  sparkDuration: 8,  // crank degrees
};

/** Atmospheric reference conditions */
export const P_ATM = 1.01325; // bar (101.325 kPa)
export const T_ATM = 298.15;  // Kelvin (25 °C)

/** Gas properties for air-fuel charge */
export const GAMMA_AIR = 1.4; // ratio of specific heats
export const POLY_COMPRESSION = 1.34; // polytropic exponent compression
export const POLY_EXPANSION = 1.28;   // polytropic exponent expansion
export const COMBUSTION_PEAK_PRESSURE_MAX = 52.0; // bar (at stoichiometric full load)
export const COMBUSTION_PEAK_TEMP_MAX = 2450;     // Kelvin

/** Simulation limits */
export const MIN_RPM = 300;
export const MAX_RPM = 6000;
export const DEFAULT_RPM = 1200;

