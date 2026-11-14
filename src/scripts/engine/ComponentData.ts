/**
 * ComponentData.ts
 * Comprehensive engineering definitions and metadata for every IC engine component.
 */

export interface ComponentInfo {
  id: string;
  name: string;
  category: 'cylinder' | 'crank' | 'valves' | 'ignition';
  definition: string;
  function: string;
  movement: string;
  material: string;
  specifications: string;
  explodedOffset: { x: number; y: number; z: number };
}

export const ENGINE_COMPONENTS: Record<string, ComponentInfo> = {
  piston: {
    id: 'piston',
    name: 'Piston & Crown',
    category: 'cylinder',
    definition:
      'A cylindrical metal plunger that slides reciprocally within the cylinder bore, forming the movable lower wall of the combustion chamber.',
    function:
      'Transfers high combustion gas pressure forces through the gudgeon pin to the connecting rod and drives mechanical work output.',
    movement:
      'Pure linear reciprocation along the cylinder centerline between Top Dead Centre (TDC) and Bottom Dead Centre (BDC).',
    material: 'Forged aluminium alloy (Al-Si eutectic, e.g. A4032 or hypereutectic A390) for high thermal conductivity and low mass.',
    specifications: 'Bore: 70 mm, Crown diameter: 69.94 mm (0.06 mm skirt clearance), Mass: ~210 g.',
    explodedOffset: { x: 0, y: 45, z: 0 },
  },
  pistonRings: {
    id: 'pistonRings',
    name: 'Piston Rings',
    category: 'cylinder',
    definition:
      'Split metallic resilient rings mounted in circumferential grooves on the piston crown outer surface.',
    function:
      'Provides gas sealing to prevent blow-by into the crankcase, controls cylinder wall oil film thickness, and conducts heat from the piston crown to the cooled cylinder liner.',
    movement:
      'Reciprocates with the piston while undergoing minor radial expansion and circumferential rotation.',
    material: 'Nodular ductile cast iron or spring steel with molybdenum or plasma-sprayed ceramic chromium coating.',
    specifications: 'Top compression ring (1.2 mm), Second scraper ring (1.5 mm), Oil control ring (2.5 mm).',
    explodedOffset: { x: 0, y: 55, z: 0 },
  },
  gudgeonPin: {
    id: 'gudgeonPin',
    name: 'Gudgeon Pin (Piston Pin)',
    category: 'crank',
    definition:
      'A precision hardened steel cylindrical pin that hinges the connecting rod small end inside the piston pin bosses.',
    function:
      'Transmits full gas pressure force from the piston crown to the connecting rod while allowing free angular oscillation.',
    movement:
      'Reciprocates vertically with the piston while permitting small angular oscillation (~15°).',
    material: 'Case-hardened nickel-chromium alloy steel (e.g. 16MnCr5 or AISI 8620), ground and polished.',
    specifications: 'Outer diameter: 18 mm, Inner bore: 10 mm (hollow for inertia reduction), Length: 52 mm.',
    explodedOffset: { x: 0, y: 45, z: 30 },
  },
  connectingRod: {
    id: 'connectingRod',
    name: 'Connecting Rod',
    category: 'crank',
    definition:
      'An articulated structural strut connecting the reciprocating piston pin to the rotating crankshaft crank pin.',
    function:
      'Converts the linear reciprocating motion of the piston into continuous rotary motion of the crankshaft while enduring severe alternating tension and compression loads.',
    movement:
      'Complex planar motion: the small end reciprocates linearly, the big end rotates in a circle, and the shank oscillates angularly.',
    material: 'Forged micro-alloyed medium carbon steel (e.g. 36MnVS4) or titanium alloy in high-performance engines.',
    specifications: 'Center-to-center length: 110 mm, H-beam profile, Mass: ~320 g.',
    explodedOffset: { x: -20, y: 15, z: 0 },
  },
  crankshaft: {
    id: 'crankshaft',
    name: 'Crankshaft & Counterweights',
    category: 'crank',
    definition:
      'The central heavy shaft with offset crank pins and counterweights that translates the connecting rod thrust into output shaft torque.',
    function:
      'Translates reciprocating piston thrust into smooth rotational shaft torque to drive external loads, while counterweights balance reciprocating and rotating inertia forces.',
    movement:
      'Pure continuous rotation about the main bearing horizontal axis (Z-axis) at engine speed N (RPM).',
    material: 'Forged alloy steel (e.g. 42CrMo4) or spheroidal graphite ductile iron with induction-hardened journals.',
    specifications: 'Crank radius: 30 mm (stroke = 60 mm), Main journal: 42 mm dia, Crankpin: 36 mm dia.',
    explodedOffset: { x: 0, y: -30, z: 0 },
  },
  flywheel: {
    id: 'flywheel',
    name: 'Flywheel',
    category: 'crank',
    definition:
      'A heavy circular disc mounted on the output flange of the crankshaft possessing large polar mass moment of inertia.',
    function:
      'Stores kinetic energy during the power stroke and releases energy during the non-power strokes (intake, compression, exhaust) to maintain uniform crankshaft angular velocity.',
    movement: 'Pure continuous rotation with the crankshaft about the engine axis.',
    material: 'Grey cast iron (Grade 250) or forged alloy steel dynamically balanced to ISO G2.5.',
    specifications: 'Diameter: 180 mm, Rim width: 28 mm, Mass moment of inertia: ~0.045 kg*m^2.',
    explodedOffset: { x: 0, y: -30, z: 50 },
  },
  cylinderBlock: {
    id: 'cylinderBlock',
    name: 'Cylinder Block & Crankcase',
    category: 'cylinder',
    definition:
      'The main stationary structural backbone of the engine containing the cylinder bore, cooling passages, and lower crankcase.',
    function:
      'Maintains rigid spatial alignment between the cylinder bore, crankshaft bearings, and cylinder head while dissipating waste heat.',
    movement: 'Stationary engine foundation anchored to chassis or test bed.',
    material: 'Gravity die-cast aluminium alloy (A380 or ADC12) with cast-iron cylinder sleeve, or grey cast iron.',
    specifications: 'Overall height: 210 mm, Bore: 70 mm, Wall thickness: 6 mm, Integrated coolant jacket.',
    explodedOffset: { x: 50, y: 0, z: 0 },
  },
  cylinderLiner: {
    id: 'cylinderLiner',
    name: 'Cylinder Liner (Sleeve)',
    category: 'cylinder',
    definition:
      'A replaceable high-precision wear-resistant hollow sleeve pressed into the cylinder block bore.',
    function:
      'Provides a low-friction, perfectly cylindrical sliding surface for the piston rings and resists high combustion temperatures and sliding wear.',
    movement: 'Stationary, tightly interference-fitted inside the cylinder block.',
    material: 'Centrifugally cast pearlitic grey iron with plateau-honed cross-hatch oil retention surface.',
    specifications: 'Inner diameter: 70.00 mm (+0.015/-0.000), Honing angle: 45°, Wall thickness: 3.5 mm.',
    explodedOffset: { x: 50, y: 25, z: 0 },
  },
  cylinderHead: {
    id: 'cylinderHead',
    name: 'Cylinder Head',
    category: 'cylinder',
    definition:
      'The top enclosure bolted rigidly to the upper face of the cylinder block, forming the roof of the combustion chamber.',
    function:
      'Encloses the top of the cylinder, houses intake/exhaust ports, valves, guides, valve seats, spark plug, and camshaft bearings.',
    movement: 'Stationary, torqued securely to the cylinder block with head bolts.',
    material: 'Cast aluminium alloy (A356-T6) heat-treated for high thermal conductivity and mechanical strength.',
    specifications: 'Hemispherical or pent-roof combustion chamber architecture with sintered powder-metal valve seats.',
    explodedOffset: { x: 0, y: 65, z: 0 },
  },
  intakeValve: {
    id: 'intakeValve',
    name: 'Intake Valve',
    category: 'valves',
    definition:
      'A precision poppet valve with an enlarged circular head and slender stem controlling the flow of fresh air-fuel mixture.',
    function:
      'Opens during the intake stroke to admit the fresh combustible air-fuel charge into the cylinder; seals hermetically during compression and power.',
    movement:
      'Linear reciprocation along the valve guide centerline, driven down by the intake cam lobe and returned by valve spring.',
    material: 'Austenitic heat-resisting silicon-chromium valve steel (e.g. Silchrome / 21-4N).',
    specifications: 'Head diameter: 28 mm, Stem diameter: 5.5 mm, Maximum lift: 8.5 mm, Seat angle: 45°.',
    explodedOffset: { x: -35, y: 75, z: 0 },
  },
  exhaustValve: {
    id: 'exhaustValve',
    name: 'Exhaust Valve',
    category: 'valves',
    definition:
      'A heavy-duty poppet valve controlling the discharge of hot expanded combustion gases from the cylinder.',
    function:
      'Opens near the end of expansion and throughout exhaust to evacuate high-temperature burnt gases; withstands extreme thermal shock (>800 °C).',
    movement:
      'Linear reciprocation along its guide centerline, driven down by the exhaust cam lobe and returned by valve spring.',
    material: 'High-alloy nickel superalloy (Nimonic 80A or Stellite-faced 21-4N), often sodium-filled for stem heat conduction.',
    specifications: 'Head diameter: 24 mm, Stem diameter: 5.5 mm, Maximum lift: 8.5 mm, Seat angle: 45°.',
    explodedOffset: { x: 35, y: 75, z: 0 },
  },
  valveSprings: {
    id: 'valveSprings',
    name: 'Valve Springs',
    category: 'valves',
    definition:
      'Helical compression coil springs surrounding the valve stems between the cylinder head seat and the upper spring retainer.',
    function:
      'Ensures rapid positive valve seating against cylinder head seats, maintains continuous follower contact with cam lobes, and prevents valve float at high RPM.',
    movement: 'Continuous cyclic axial compression and elastic expansion with valve lift.',
    material: 'Shot-peened super-clean silicon-chromium spring steel wire (e.g. ASTM A877 / SWOSC-V).',
    specifications: 'Seat load: ~180 N, Full lift load: ~420 N, Natural frequency: >500 Hz to prevent resonance surge.',
    explodedOffset: { x: 0, y: 85, z: 0 },
  },
  camshaft: {
    id: 'camshaft',
    name: 'Overhead Camshaft & Lobes',
    category: 'valves',
    definition:
      'A rotating precision shaft carrying egg-shaped cam lobes that govern the precise timing, velocity, and lift of intake and exhaust valves.',
    function:
      'Converts rotary motion into timed poppet valve lift profiles. Rotates at exactly half crankshaft speed (1 rev per 2 crank revs).',
    movement: 'Continuous pure rotation about its longitudinal axis at half crankshaft angular velocity (N/2).',
    material: 'Chilled cast iron or forged steel with carburized, induction-hardened, and polished cam lobes.',
    specifications: 'Shaft diameter: 22 mm, 2 cam lobes (intake & exhaust), Cam lobe base circle: 24 mm, Cam lift: 8.5 mm.',
    explodedOffset: { x: 0, y: 105, z: 0 },
  },
  timingGears: {
    id: 'timingGears',
    name: 'Timing Drive (2:1 Ratio)',
    category: 'valves',
    definition:
      'The precision synchronous timing belt, chain, or gear drive linking the crankshaft to the camshaft.',
    function:
      'Enforces an exact 2:1 rotational speed reduction between crankshaft and camshaft, maintaining perfect mechanical synchronization across all 4 strokes.',
    movement: 'Continuous synchronous rotation at exact 2:1 gear reduction ratio.',
    material: 'Hardened sintered steel sprockets with high-tensile fiberglass-reinforced chloroprene timing belt.',
    specifications: 'Crank sprocket: 18 teeth, Cam sprocket: 36 teeth (ratio exactly 2:1).',
    explodedOffset: { x: 0, y: 40, z: -40 },
  },
  sparkPlug: {
    id: 'sparkPlug',
    name: 'Spark Plug',
    category: 'ignition',
    definition:
      'An electrical device fitted into the cylinder head combustion chamber roof that discharges high-voltage electric energy across a spark gap.',
    function:
      'Creates a 20,000 to 30,000 Volt electric discharge arc across the electrode gap to ignite the compressed combustible air-fuel charge near the end of compression.',
    movement: 'Stationary, threaded into the cylinder head threaded bore (M14 x 1.25).',
    material: 'Alumina (Al2O3) ceramic insulator, nickel-plated steel body, and iridium/platinum-tipped central electrode.',
    specifications: 'Thread: M14 x 1.25, Hex size: 16 mm, Electrode gap: 0.8 mm, Heat range: Medium cold (NGK 7 equivalent).',
    explodedOffset: { x: 0, y: 95, z: 0 },
  },
  intakeManifold: {
    id: 'intakeManifold',
    name: 'Intake Manifold & Port',
    category: 'cylinder',
    definition:
      'The aerodynamic duct that conveys atmospheric air and metered vaporized fuel into the intake valve port.',
    function:
      'Optimizes air velocity, turbulence, and volumetric efficiency to achieve homogeneous fuel-air mixing without excessive flow restriction.',
    movement: 'Stationary duct bolted to intake face of cylinder head.',
    material: 'Moulded composite polymer (PA66-GF30) or cast aluminium alloy with smooth internal runners.',
    specifications: 'Runner diameter: 30 mm, Flow coefficient: 0.82, Tuned runner length: 140 mm.',
    explodedOffset: { x: -60, y: 65, z: 0 },
  },
  exhaustManifold: {
    id: 'exhaustManifold',
    name: 'Exhaust Manifold & Port',
    category: 'cylinder',
    definition:
      'The high-temperature exhaust runner leading away from the exhaust valve seat to the exhaust system.',
    function:
      'Directs hot burnt combustion gases safely away from the cylinder head while scavenging pulses reduce backpressure on the upward exhaust stroke.',
    movement: 'Stationary duct bolted to exhaust face of cylinder head.',
    material: 'High-silicon ductile iron (SiMo) or thin-wall austenitic stainless steel (AISI 304/321).',
    specifications: 'Runner diameter: 28 mm, Flange thickness: 10 mm, Designed for thermal expansion up to 900 °C.',
    explodedOffset: { x: 60, y: 65, z: 0 },
  },
};

