/**
 * CrankSlider.ts
 * Rigorous crank-slider mechanism kinematics based on exact trigonometric formulations.
 */

export interface KinematicState {
  /** Crank angle in radians [0, 4pi) */
  thetaRad: number;
  /** Crank angle in degrees [0, 720) */
  thetaDeg: number;
  /** Crank radius in metres */
  r: number;
  /** Connecting rod length in metres */
  l: number;
  /** Connecting rod-to-crank radius ratio (l/r) */
  lambdaInv: number;
  /** Piston displacement from TDC in metres (0 at TDC, stroke at BDC) */
  displacement: number;
  /** Piston velocity in m/s (positive moving down away from TDC, zero at TDC/BDC) */
  velocity: number;
  /** Piston acceleration in m/s^2 */
  acceleration: number;
  /** Connecting rod tilt angle in radians from vertical cylinder axis */
  rodAngleRad: number;
  /** Connecting rod tilt angle in degrees */
  rodAngleDeg: number;
  /** Crank pin X coordinate (m) */
  crankPinX: number;
  /** Crank pin Y coordinate (m) */
  crankPinY: number;
  /** Piston pin X coordinate (m, always 0 on cylinder centerline) */
  pistonPinX: number;
  /** Piston pin Y coordinate (m, measured from crankshaft center) */
  pistonPinY: number;
  /** TDC reference Y coordinate (m) = l + r */
  yTdc: number;
  /** BDC reference Y coordinate (m) = l - r */
  yBdc: number;
}

/**
 * Calculates the exact analytical kinematics of the crank-slider mechanism.
 *
 * @param thetaDeg Crankshaft angle in degrees (measured from TDC = 0°)
 * @param rpm Engine rotational speed in revolutions per minute
 * @param strokeMm Piston stroke in mm (stroke = 2 * crank radius)
 * @param conRodMm Connecting rod length in mm
 */
export function calculateCrankSlider(
  thetaDeg: number,
  rpm: number,
  strokeMm: number,
  conRodMm: number
): KinematicState {
  // Normalize theta to [0, 720)
  const normDeg = ((thetaDeg % 720) + 720) % 720;
  const thetaRad = (normDeg * Math.PI) / 180;

  // Convert mm to metres for standard SI kinematic calculations
  const strokeM = strokeMm / 1000;
  const r = strokeM / 2; // crank radius
  const l = conRodMm / 1000; // connecting rod length

  if (l <= r) {
    throw new Error(
      `Invalid geometry: connecting rod length (${conRodMm} mm) must be strictly greater than crank radius (${strokeMm / 2} mm).`
    );
  }

  // Crank pin position (crankshaft axis at origin (0,0))
  // At theta = 0 (TDC): pin is at (0, +r)
  const sinTheta = Math.sin(thetaRad);
  const cosTheta = Math.cos(thetaRad);
  const crankPinX = r * sinTheta;
  const crankPinY = r * cosTheta;

  // Connecting rod obliquity: sin(phi) = (r / l) * sin(theta)
  const sinPhi = (r / l) * sinTheta;
  // Guard against float precision issues near +/- 1
  const clampedSinPhi = Math.max(-1, Math.min(1, sinPhi));
  const rodAngleRad = Math.asin(clampedSinPhi);
  const rodAngleDeg = (rodAngleRad * 180) / Math.PI;

  // Root term: sqrt(l^2 - r^2 * sin^2(theta))
  const discriminant = l * l - r * r * sinTheta * sinTheta;
  const root = Math.sqrt(Math.max(0, discriminant));

  // Piston pin Y position from crankshaft center: y_p = r*cos(theta) + sqrt(l^2 - r^2*sin^2(theta))
  const pistonPinX = 0;
  const pistonPinY = crankPinY + root;

  // Reference points
  const yTdc = l + r;
  const yBdc = l - r;

  // Displacement from TDC: x = yTdc - y_p = r*(1 - cos(theta)) + l - sqrt(l^2 - r^2*sin^2(theta))
  const displacement = yTdc - pistonPinY;

  // Angular velocity omega in rad/s
  const omega = (2 * Math.PI * rpm) / 60;

  // Piston velocity dx/dt = omega * dx/dtheta
  // dx/dtheta = r * sin(theta) + (r^2 * sin(theta) * cos(theta)) / root
  //           = r * (sin(theta) + (r * sin(2*theta)) / (2 * root))
  const sin2Theta = Math.sin(2 * thetaRad);
  const dx_dtheta = r * (sinTheta + (r * sin2Theta) / (2 * root));
  const velocity = omega * dx_dtheta;

  // Piston acceleration d^2x/dt^2 = omega^2 * d^2x/dtheta^2 (for constant omega)
  // Exact analytical derivative of dx/dtheta:
  // d/dtheta[r * sin(theta)] = r * cos(theta)
  // d/dtheta[(r^2 * sin(2theta)) / (2 * root)] =
  //   (r^2 * 2*cos(2theta) * 2*root - r^2 * sin(2theta) * 2 * (-2 r^2 sin(theta) cos(theta) / (2 root))) / (4 root^2)
  //   = r^2 * cos(2theta) / root + (r^4 * sin^2(2theta)) / (4 * root^3)
  const cos2Theta = Math.cos(2 * thetaRad);
  const d2x_dtheta2 =
    r * cosTheta +
    (r * r * cos2Theta) / root +
    (r * r * r * r * sin2Theta * sin2Theta) / (4 * Math.pow(root, 3));
  const acceleration = omega * omega * d2x_dtheta2;

  return {
    thetaRad,
    thetaDeg: normDeg,
    r,
    l,
    lambdaInv: l / r,
    displacement,
    velocity,
    acceleration,
    rodAngleRad,
    rodAngleDeg,
    crankPinX,
    crankPinY,
    pistonPinX,
    pistonPinY,
    yTdc,
    yBdc,
  };
}

