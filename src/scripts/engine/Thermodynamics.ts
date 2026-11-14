/**
 * Thermodynamics.ts
 * Thermodynamic modeling of the internal combustion engine cycle.
 * Calculates volumes, pressure-volume paths, temperatures, work output, and efficiencies.
 */

import {
  P_ATM,
  T_ATM,
  POLY_COMPRESSION,
  POLY_EXPANSION,
  COMBUSTION_PEAK_PRESSURE_MAX,
  COMBUSTION_PEAK_TEMP_MAX,
  GAMMA_AIR,
  type EngineGeometry,
} from './EngineConstants';

export interface ThermodynamicState {
  /** Swept volume in cm^3 (cc) */
  sweptVolumeCc: number;
  /** Clearance volume in cm^3 (cc) */
  clearanceVolumeCc: number;
  /** Total cylinder volume at current crank angle in cm^3 (cc) */
  currentVolumeCc: number;
  /** Instantaneous pressure in bar (1 bar = 100 kPa) */
  pressureBar: number;
  /** Instantaneous gas temperature in Kelvin */
  temperatureK: number;
  /** Instantaneous gas temperature in Celsius */
  temperatureC: number;
  /** Mean piston speed in m/s */
  meanPistonSpeed: number;
  /** Ideal Otto cycle thermal efficiency [0, 1] */
  idealThermalEfficiency: number;
  /** Realistic indicated thermal efficiency [0, 1] */
  indicatedThermalEfficiency: number;
  /** Mechanical efficiency [0, 1] */
  mechanicalEfficiency: number;
  /** Brake thermal efficiency [0, 1] */
  brakeThermalEfficiency: number;
  /** Indicated Mean Effective Pressure (IMEP) in bar */
  imepBar: number;
  /** Indicated Power in kW */
  indicatedPowerKw: number;
  /** Brake Power in kW */
  brakePowerKw: number;
  /** Brake Torque in N*m */
  brakeTorqueNm: number;
}

export interface PVPoint {
  crankAngleDeg: number;
  volumeCc: number;
  pressureBar: number;
  stroke: 'intake' | 'compression' | 'power' | 'exhaust';
}

/**
 * Calculates engine geometry metrics (volumes and mean piston speed).
 */
export function calculateGeometryVolumes(geom: EngineGeometry, rpm: number) {
  const boreCm = geom.bore / 10;
  const strokeCm = geom.stroke / 10;
  const sweptVolumeCc = (Math.PI / 4) * Math.pow(boreCm, 2) * strokeCm;
  const clearanceVolumeCc = sweptVolumeCc / (geom.compressionRatio - 1);
  const strokeM = geom.stroke / 1000;
  const meanPistonSpeed = (2 * strokeM * rpm) / 60;

  return {
    sweptVolumeCc,
    clearanceVolumeCc,
    totalMaxVolumeCc: sweptVolumeCc + clearanceVolumeCc,
    meanPistonSpeed,
  };
}

/**
 * Calculates the thermodynamic state at a specific crank angle and RPM.
 */
export function calculateThermodynamics(
  thetaDeg: number,
  rpm: number,
  displacementM: number,
  geom: EngineGeometry
): ThermodynamicState {
  const { sweptVolumeCc, clearanceVolumeCc, meanPistonSpeed } =
    calculateGeometryVolumes(geom, rpm);

  // Instantaneous volume = Vc + (pi/4)*bore^2 * displacement
  const boreM = geom.bore / 1000;
  const dispVolumeM3 = (Math.PI / 4) * Math.pow(boreM, 2) * displacementM;
  const dispVolumeCc = dispVolumeM3 * 1e6;
  const currentVolumeCc = clearanceVolumeCc + dispVolumeCc;
  const maxVolumeCc = clearanceVolumeCc + sweptVolumeCc;

  const normDeg = ((thetaDeg % 720) + 720) % 720;

  // Pressures and temperatures across the 4 strokes
  let pressureBar = P_ATM;
  let temperatureK = T_ATM;

  // Compression starting conditions at BDC (180°)
  const p1 = 0.95 * P_ATM; // slight intake depression
  const t1 = T_ATM + 15; // 313 K intake charge warming

  // Compression at TDC (360°)
  const p2 = p1 * Math.pow(geom.compressionRatio, POLY_COMPRESSION);
  const t2 = t1 * Math.pow(geom.compressionRatio, POLY_COMPRESSION - 1);

  // Peak combustion conditions (near 375° crank)
  const p3 = Math.min(COMBUSTION_PEAK_PRESSURE_MAX, p2 * 3.0);
  const t3 = COMBUSTION_PEAK_TEMP_MAX;

  // End of expansion at BDC (540°)
  const p4 = p3 / Math.pow(geom.compressionRatio, POLY_EXPANSION);
  const t4 = t3 / Math.pow(geom.compressionRatio, POLY_EXPANSION - 1);

  if (normDeg < 180) {
    // 1. INTAKE STROKE (0° - 180°)
    // Cylinder is filled with fresh charge, pressure slightly below atmospheric
    const depression = 0.08 * Math.sin((normDeg / 180) * Math.PI);
    pressureBar = P_ATM - depression;
    temperatureK = T_ATM + 10;
  } else if (normDeg < 360) {
    // 2. COMPRESSION STROKE (180° - 360°)
    // Polytropic compression P * V^n = constant
    const volRatio = maxVolumeCc / Math.max(clearanceVolumeCc, currentVolumeCc);
    pressureBar = p1 * Math.pow(volRatio, POLY_COMPRESSION);
    temperatureK = t1 * Math.pow(volRatio, POLY_COMPRESSION - 1);

    // Near TDC spark ignition begins (e.g. 345° to 360°)
    if (normDeg > 345) {
      const sparkFraction = (normDeg - 345) / 15;
      pressureBar += sparkFraction * 5.0; // pre-TDC flame initiation
      temperatureK += sparkFraction * 200;
    }
  } else if (normDeg < 540) {
    // 3. POWER / EXPANSION STROKE (360° - 540°)
    if (normDeg <= 375) {
      // Rapid combustion heat release and peak pressure
      const combustionFraction = (normDeg - 360) / 15;
      pressureBar = p2 + (p3 - p2) * Math.sin((combustionFraction * Math.PI) / 2);
      temperatureK = t2 + (t3 - t2) * Math.sin((combustionFraction * Math.PI) / 2);
    } else {
      // Polytropic expansion from peak
      const volAtPeak = clearanceVolumeCc + (dispVolumeCc * 0.08);
      const expRatio = currentVolumeCc / volAtPeak;
      pressureBar = Math.max(p4, p3 / Math.pow(expRatio, POLY_EXPANSION));
      temperatureK = Math.max(t4, t3 / Math.pow(expRatio, POLY_EXPANSION - 1));
    }
  } else {
    // 4. EXHAUST STROKE (540° - 720°)
    // Pressure drops to slight exhaust backpressure
    const exhaustOverpressure = 0.12 * Math.sin(((normDeg - 540) / 180) * Math.PI);
    pressureBar = P_ATM + exhaustOverpressure;
    temperatureK = 750 - 300 * ((normDeg - 540) / 180);
  }

  // Ideal Otto Cycle efficiency: 1 - (1 / CR^(gamma - 1))
  const idealThermalEfficiency = 1 - 1 / Math.pow(geom.compressionRatio, GAMMA_AIR - 1);

  // Realistic efficiencies (calibrated illustrative values for a small 4-stroke SI engine)
  const indicatedThermalEfficiency = idealThermalEfficiency * 0.58; // ~34%
  const mechanicalEfficiency = 0.84; // ~84% friction/pumping losses
  const brakeThermalEfficiency = indicatedThermalEfficiency * mechanicalEfficiency; // ~28.5%

  // Indicated Mean Effective Pressure (IMEP) estimate: ~8.5 bar at full throttle
  const imepBar = 8.5;
  const imepPa = imepBar * 1e5;

  // Swept volume in m^3
  const sweptVolumeM3 = sweptVolumeCc * 1e-6;

  // Indicated Power (Watts) = (IMEP * Vs * N) / (60 * 2)  (since 4-stroke has 1 power stroke per 2 revs)
  const indicatedPowerW = (imepPa * sweptVolumeM3 * rpm) / (60 * 2);
  const indicatedPowerKw = indicatedPowerW / 1000;

  // Brake Power (kW)
  const brakePowerKw = indicatedPowerKw * mechanicalEfficiency;

  // Brake Torque T = (P * 60) / (2 * pi * N)
  const brakeTorqueNm = (brakePowerKw * 1000 * 60) / (2 * Math.PI * rpm);

  return {
    sweptVolumeCc,
    clearanceVolumeCc,
    currentVolumeCc,
    pressureBar,
    temperatureK,
    temperatureC: temperatureK - 273.15,
    meanPistonSpeed,
    idealThermalEfficiency,
    indicatedThermalEfficiency,
    mechanicalEfficiency,
    brakeThermalEfficiency,
    imepBar,
    indicatedPowerKw,
    brakePowerKw,
    brakeTorqueNm,
  };
}

/**
 * Pre-computes full 720-degree P-V curve points for rendering the P-V diagram.
 */
export function generatePVDiaData(
  geom: EngineGeometry,
  mode: 'ideal' | 'realistic' = 'realistic',
  stepDeg = 2
): PVPoint[] {
  const points: PVPoint[] = [];
  const { stroke, conRodLength } = geom;

  // We need displacement for each degree
  for (let deg = 0; deg <= 720; deg += stepDeg) {
    const rad = (deg * Math.PI) / 180;
    const r = (stroke / 1000) / 2;
    const l = conRodLength / 1000;
    const sinTheta = Math.sin(rad);
    const cosTheta = Math.cos(rad);
    const root = Math.sqrt(Math.max(0, l * l - r * r * sinTheta * sinTheta));
    const dispM = (r + l) - (r * cosTheta + root);

    const thermo = calculateThermodynamics(deg, 1500, dispM, geom);

    let strokeName: 'intake' | 'compression' | 'power' | 'exhaust' = 'intake';
    if (deg < 180) strokeName = 'intake';
    else if (deg < 360) strokeName = 'compression';
    else if (deg < 540) strokeName = 'power';
    else strokeName = 'exhaust';

    if (mode === 'ideal') {
      // In ideal Otto cycle:
      // Intake: isobaric at 1 atm (Vc -> Vc+Vs)
      // Compression: isentropic from 1 atm at Vmax to P2 at Vc
      // Combustion: isometric heat addition at Vc from P2 to P3
      // Expansion: isentropic from P3 at Vc to P4 at Vmax
      // Blowdown / Exhaust: isometric heat rejection at Vmax from P4 to 1 atm, then isobaric exhaust
      let idealP = P_ATM;
      const vRatio = (thermo.clearanceVolumeCc + thermo.sweptVolumeCc) / Math.max(thermo.clearanceVolumeCc, thermo.currentVolumeCc);

      if (deg >= 180 && deg < 360) {
        idealP = P_ATM * Math.pow(vRatio, GAMMA_AIR);
      } else if (deg >= 360 && deg < 540) {
        const pPeakIdeal = P_ATM * Math.pow(geom.compressionRatio, GAMMA_AIR) * 3.2;
        const expRatio = thermo.currentVolumeCc / thermo.clearanceVolumeCc;
        idealP = pPeakIdeal / Math.pow(expRatio, GAMMA_AIR);
      } else {
        idealP = P_ATM;
      }

      points.push({
        crankAngleDeg: deg,
        volumeCc: thermo.currentVolumeCc,
        pressureBar: idealP,
        stroke: strokeName,
      });
    } else {
      points.push({
        crankAngleDeg: deg,
        volumeCc: thermo.currentVolumeCc,
        pressureBar: thermo.pressureBar,
        stroke: strokeName,
      });
    }
  }

  return points;
}

