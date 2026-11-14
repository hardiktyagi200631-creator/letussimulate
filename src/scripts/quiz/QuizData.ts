/**
 * QuizData.ts
 * Educational questions, options, explanations, and challenge mode definitions for IC engine thermodynamics & kinematics.
 */

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'true_false' | 'formula' | 'component';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    type: 'mcq',
    question: 'How many crankshaft revolutions are required to complete one four-stroke engine cycle?',
    options: ['1 revolution (360°)', '2 revolutions (720°)', '4 revolutions (1440°)', 'Half a revolution (180°)'],
    correctIndex: 1,
    explanation:
      'In a four-stroke internal combustion engine, each stroke corresponds to 180° of crankshaft rotation (half a revolution). The four strokes (Intake, Compression, Power, Exhaust) therefore require 4 × 180° = 720°, or exactly two complete crankshaft revolutions.',
  },
  {
    id: 'q2',
    type: 'formula',
    question: 'If an engine has a cylinder bore of 70 mm and a stroke of 60 mm, what is its swept volume (displacement)?',
    options: ['~115 cm³ (cc)', '~231 cm³ (cc)', '~462 cm³ (cc)', '~924 cm³ (cc)'],
    correctIndex: 1,
    explanation:
      'Swept volume Vs = (π / 4) × D² × L. Converting to cm: D = 7.0 cm, L = 6.0 cm. Vs = (π / 4) × 49 × 6.0 = 230.91 cm³ (approximately 231 cc).',
  },
  {
    id: 'q3',
    type: 'mcq',
    question: 'At what rotational speed does the camshaft rotate relative to the crankshaft in a four-stroke engine?',
    options: [
      'At identical speed (1:1 ratio)',
      'At half the crankshaft speed (1:2 ratio)',
      'At twice the crankshaft speed (2:1 ratio)',
      'At one-quarter of the crankshaft speed',
    ],
    correctIndex: 1,
    explanation:
      'Each valve (intake and exhaust) opens only once during the entire 720° four-stroke cycle. Therefore, the camshaft must complete exactly one revolution for every two revolutions of the crankshaft (camshaft speed = crankshaft speed / 2).',
  },
  {
    id: 'q4',
    type: 'true_false',
    question: 'True or False: In real engine operation, both the intake and exhaust valves are open simultaneously for a brief period known as valve overlap.',
    options: ['True', 'False'],
    correctIndex: 0,
    explanation:
      'True! In realistic engine timing, the intake valve opens before TDC (IVO) and the exhaust valve closes after TDC (EVC). The angular period during which both valves remain open together around TDC is called valve overlap, which enhances cylinder scavenging through exhaust gas inertia.',
  },
  {
    id: 'q5',
    type: 'mcq',
    question: 'Why is spark ignition initiated 15° to 25° Before Top Dead Centre (BTDC) rather than exactly at TDC?',
    options: [
      'To prevent the spark plug from overheating',
      'Because the air-fuel mixture flame takes a finite time (1-2 milliseconds) to develop peak pressure just after TDC',
      'To push the piston backwards to compress the gases tighter',
      'Because modern petrol is non-combustible at TDC',
    ],
    correctIndex: 1,
    explanation:
      'Combustion is not instantaneous; it requires a finite physical duration for the flame kernel to propagate across the combustion chamber. Spark advance ensures that peak combustion chamber pressure occurs approximately 10° to 15° after TDC (ATDC), maximizing mechanical torque on the crank pin.',
  },
  {
    id: 'q6',
    type: 'component',
    question: 'Which component stores kinetic energy during the power stroke to maintain smooth rotation through the intake, compression, and exhaust strokes?',
    options: ['Connecting Rod', 'Gudgeon Pin', 'Flywheel', 'Cam Lobe'],
    correctIndex: 2,
    explanation:
      'The flywheel possesses a large polar mass moment of inertia. In a single-cylinder engine, useful positive work is delivered only during the 180° power stroke. The flywheel absorbs excess energy during expansion and releases it to drive the piston through the other three non-power strokes.',
  },
  {
    id: 'q7',
    type: 'formula',
    question: 'If an engine has a swept volume (Vs) of 231 cc and a clearance volume (Vc) of 28.875 cc, what is its compression ratio (CR)?',
    options: ['7:1', '8:1', '9:1', '10:1'],
    correctIndex: 2,
    explanation:
      'Compression Ratio CR = (Vs + Vc) / Vc = (231 + 28.875) / 28.875 = 259.875 / 28.875 = 9.0:1.',
  },
  {
    id: 'q8',
    type: 'true_false',
    question: 'True or False: Piston velocity in a crank-slider mechanism reaches zero at both Top Dead Centre (TDC) and Bottom Dead Centre (BDC).',
    options: ['True', 'False'],
    correctIndex: 0,
    explanation:
      'True! At TDC and BDC, the piston instantaneously stops to reverse its direction of motion. Analytically, dx/dθ = r × [sin(θ) + (r sin 2θ)/(2√(l² - r² sin² θ))]. At θ = 0° and θ = 180°, sin(θ) = 0 and sin(2θ) = 0, so velocity is exactly zero.',
  },
  {
    id: 'q9',
    type: 'mcq',
    question: 'What does the enclosed area inside a closed Pressure-Volume (P-V) indicator loop represent?',
    options: [
      'Total fuel mass consumed per second',
      'Net indicated mechanical work done per cycle',
      'Maximum engine rotational speed',
      'Coolant heat absorption rate',
    ],
    correctIndex: 1,
    explanation:
      'From thermodynamics, work W = ∮ P dV. In a four-stroke engine P-V diagram, the upper positive power loop minus the lower pumping loop represents the net indicated mechanical work generated per thermodynamic cycle.',
  },
  {
    id: 'q10',
    type: 'mcq',
    question: 'Why does brake power differ from indicated power in an internal combustion engine?',
    options: [
      'Brake power is higher because of flywheel momentum',
      'Brake power is lower due to mechanical friction losses in bearings, pistons, and auxiliary drives',
      'Indicated power is measured only in diesel engines',
      'There is no difference; indicated power and brake power are synonymous',
    ],
    correctIndex: 1,
    explanation:
      'Indicated power (Pi) is the total thermodynamic power developed by the gas on the piston crown. Brake power (Pb) is the actual usable power measured at the output crankshaft. The difference (Pi - Pb) represents friction power, governed by mechanical efficiency ηm = Pb / Pi (typically 80% to 88%).',
  },
];

