/**
 * EngineModel.ts
 * Detailed 3D mechanical engine assembly constructed with Three.js.
 * Implements parametric kinematics, cutaway view, transparent mode, exploded view,
 * raycastable components, and thermodynamic particle/flame effects.
 */

import * as THREE from 'three';
import { ENGINE_COMPONENTS, type ComponentInfo } from './ComponentData';
import type { FullEngineState } from './EnginePhysics';
import type { EngineGeometry } from './EngineConstants';

export class EngineModel {
  public rootGroup: THREE.Group;

  // Major functional sub-assemblies
  public crankshaftGroup: THREE.Group;
  public connectingRodGroup: THREE.Group;
  public pistonGroup: THREE.Group;
  public intakeValveGroup: THREE.Group;
  public exhaustValveGroup: THREE.Group;
  public camshaftGroup: THREE.Group;
  public sparkPlugGroup: THREE.Group;
  public cylinderBlockGroup: THREE.Group;
  public cylinderHeadGroup: THREE.Group;
  public flywheelGroup: THREE.Group;
  public timingBeltGroup: THREE.Group;

  // Dynamic visual effect elements
  public sparkMesh: THREE.Points;
  public combustionGlow: THREE.Mesh;
  public intakeParticles: THREE.Points;
  public exhaustParticles: THREE.Points;

  // Component meshes map for raycasting & highlighting
  public componentMeshes: Map<string, THREE.Object3D[]> = new Map();
  public allSelectableMeshes: THREE.Mesh[] = [];

  // Material storage for transparency & highlighting
  private originalMaterials: Map<THREE.Mesh, THREE.Material | THREE.Material[]> = new Map();
  private highlightMaterial: THREE.MeshStandardMaterial;

  // State variables
  private explodedFactor = 0.0; // 0.0 = assembled, 1.0 = fully exploded
  private isTransparent = false;
  private transparencyAlpha = 0.35;
  private isolatedComponentId: string | null = null;
  private geometry: EngineGeometry;

  constructor(geometry: EngineGeometry) {
    this.geometry = geometry;
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'EngineAssembly';

    // Highlight material for component selection
    this.highlightMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.8,
    });

    // Initialize groups
    this.crankshaftGroup = new THREE.Group();
    this.crankshaftGroup.name = 'CrankshaftAssembly';

    this.connectingRodGroup = new THREE.Group();
    this.connectingRodGroup.name = 'ConnectingRodAssembly';

    this.pistonGroup = new THREE.Group();
    this.pistonGroup.name = 'PistonAssembly';

    this.intakeValveGroup = new THREE.Group();
    this.intakeValveGroup.name = 'IntakeValveAssembly';

    this.exhaustValveGroup = new THREE.Group();
    this.exhaustValveGroup.name = 'ExhaustValveAssembly';

    this.camshaftGroup = new THREE.Group();
    this.camshaftGroup.name = 'CamshaftAssembly';

    this.sparkPlugGroup = new THREE.Group();
    this.sparkPlugGroup.name = 'SparkPlugAssembly';

    this.cylinderBlockGroup = new THREE.Group();
    this.cylinderBlockGroup.name = 'CylinderBlockAssembly';

    this.cylinderHeadGroup = new THREE.Group();
    this.cylinderHeadGroup.name = 'CylinderHeadAssembly';

    this.flywheelGroup = new THREE.Group();
    this.flywheelGroup.name = 'FlywheelAssembly';

    this.timingBeltGroup = new THREE.Group();
    this.timingBeltGroup.name = 'TimingBeltAssembly';

    // Particle & Glow placeholders
    this.sparkMesh = this.createSparkEffect();
    this.combustionGlow = this.createCombustionEffect();
    this.intakeParticles = this.createIntakeParticles();
    this.exhaustParticles = this.createExhaustParticles();

    // Construct the 3D model
    this.buildModel();
  }

  /**
   * Builds all 3D mechanical components with engineering-accurate geometry and materials.
   */
  private buildModel(): void {
    // 1. Engineering Materials
    const matAluminumCast = new THREE.MeshStandardMaterial({
      color: 0xc8d0d8,
      roughness: 0.55,
      metalness: 0.65,
      side: THREE.DoubleSide,
    });
    const matSteelForged = new THREE.MeshStandardMaterial({
      color: 0x7c858d,
      roughness: 0.35,
      metalness: 0.85,
    });
    const matPolishedSteel = new THREE.MeshStandardMaterial({
      color: 0xe0e6ed,
      roughness: 0.15,
      metalness: 0.95,
      side: THREE.DoubleSide,
    });
    const matBronze = new THREE.MeshStandardMaterial({
      color: 0xb58d4c,
      roughness: 0.35,
      metalness: 0.75,
    });
    const matCeramicWhite = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.1,
      metalness: 0.05,
    });
    const matCastIronDark = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.7,
      metalness: 0.5,
    });
    const matBlackRubber = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.1,
    });
    const matIntakePort = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.4,
      metalness: 0.4,
      transparent: true,
      opacity: 0.85,
    });
    const matExhaustPort = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.4,
      metalness: 0.4,
      transparent: true,
      opacity: 0.85,
    });

    const bore = this.geometry.bore;
    const stroke = this.geometry.stroke;
    const conRodLen = this.geometry.conRodLength;
    const crankRadius = stroke / 2;

    // --- CYLINDER BLOCK & CRANKCASE (Cutaway front half) ---
    // Cylinder outer wall with 180° cutaway so internal motion is visible
    const blockOuterRadius = (bore / 2) + 12;
    const blockHeight = stroke * 2.2;
    const blockCenterY = conRodLen * 0.75;

    // Semi-cylindrical cutaway block
    const blockGeom = new THREE.CylinderGeometry(
      blockOuterRadius,
      blockOuterRadius,
      blockHeight,
      32,
      1,
      false,
      Math.PI * 0.5,
      Math.PI * 1.0 // 180 deg cutaway
    );
    const blockMesh = new THREE.Mesh(blockGeom, matAluminumCast);
    blockMesh.position.set(0, blockCenterY, 0);
    this.tagComponent(blockMesh, 'cylinderBlock');
    this.cylinderBlockGroup.add(blockMesh);

    // Cylinder Liner (cross-hatch honed sleeve inside)
    const linerGeom = new THREE.CylinderGeometry(
      (bore / 2) + 3,
      (bore / 2) + 3,
      blockHeight * 0.95,
      32,
      1,
      false,
      Math.PI * 0.5,
      Math.PI * 1.0
    );
    const linerMesh = new THREE.Mesh(linerGeom, matPolishedSteel);
    linerMesh.position.set(0, blockCenterY, 0);
    this.tagComponent(linerMesh, 'cylinderLiner');
    this.cylinderBlockGroup.add(linerMesh);

    // Crankcase lower sump
    const sumpGeom = new THREE.BoxGeometry(blockOuterRadius * 2.2, 45, blockOuterRadius * 1.8);
    const sumpMesh = new THREE.Mesh(sumpGeom, matCastIronDark);
    sumpMesh.position.set(0, -35, 0);
    this.tagComponent(sumpMesh, 'cylinderBlock');
    this.cylinderBlockGroup.add(sumpMesh);

    // --- CYLINDER HEAD ---
    const headHeight = 55;
    const headY = (conRodLen + crankRadius) + 25; // Sits above TDC
    const headGeom = new THREE.BoxGeometry(blockOuterRadius * 2.2, headHeight, blockOuterRadius * 2.0);
    const headMesh = new THREE.Mesh(headGeom, matAluminumCast);
    headMesh.position.set(0, headY, 0);
    this.tagComponent(headMesh, 'cylinderHead');
    this.cylinderHeadGroup.add(headMesh);

    // Intake Port & Manifold runner (left side, X < 0)
    const intakeGeom = new THREE.CylinderGeometry(15, 14, 45, 16);
    const intakeMesh = new THREE.Mesh(intakeGeom, matIntakePort);
    intakeMesh.rotation.z = Math.PI / 4;
    intakeMesh.position.set(-36, headY + 8, 0);
    this.tagComponent(intakeMesh, 'intakeManifold');
    this.cylinderHeadGroup.add(intakeMesh);

    // Exhaust Port & Manifold runner (right side, X > 0)
    const exhaustGeom = new THREE.CylinderGeometry(14, 13, 45, 16);
    const exhaustMesh = new THREE.Mesh(exhaustGeom, matExhaustPort);
    exhaustMesh.rotation.z = -Math.PI / 4;
    exhaustMesh.position.set(36, headY + 8, 0);
    this.tagComponent(exhaustMesh, 'exhaustManifold');
    this.cylinderHeadGroup.add(exhaustMesh);

    // --- PISTON ASSEMBLY ---
    const pistonHeight = stroke * 0.75;
    const pistonRadius = (bore / 2) - 0.2; // 0.2 mm clearance

    // Piston crown and skirt
    const pistonGeom = new THREE.CylinderGeometry(pistonRadius, pistonRadius, pistonHeight, 32);
    const pistonMesh = new THREE.Mesh(pistonGeom, matAluminumCast);
    pistonMesh.position.set(0, pistonHeight / 2 - 12, 0);
    this.tagComponent(pistonMesh, 'piston');
    this.pistonGroup.add(pistonMesh);

    // Piston Rings (3 distinct rings near top of crown)
    const ringOffsets = [pistonHeight / 2 - 2, pistonHeight / 2 - 5, pistonHeight / 2 - 8];
    ringOffsets.forEach((yOff) => {
      const ringGeom = new THREE.TorusGeometry(pistonRadius + 0.15, 0.65, 8, 32);
      ringGeom.rotateX(Math.PI / 2);
      const ringMesh = new THREE.Mesh(ringGeom, matCastIronDark);
      ringMesh.position.set(0, yOff, 0);
      this.tagComponent(ringMesh, 'pistonRings');
      this.pistonGroup.add(ringMesh);
    });

    // Piston Pin / Gudgeon Pin (hollow cylinder through pin boss)
    const pinGeom = new THREE.CylinderGeometry(9, 9, bore * 0.8, 16);
    pinGeom.rotateX(Math.PI / 2);
    const pinMesh = new THREE.Mesh(pinGeom, matPolishedSteel);
    pinMesh.position.set(0, 0, 0); // Pin center is local (0,0,0) of pistonGroup
    this.tagComponent(pinMesh, 'gudgeonPin');
    this.pistonGroup.add(pinMesh);

    // --- CONNECTING ROD ASSEMBLY ---
    // Small end (eyes around gudgeon pin at (0, conRodLen, 0) locally)
    const smallEndGeom = new THREE.CylinderGeometry(14, 14, 18, 16);
    smallEndGeom.rotateX(Math.PI / 2);
    const smallEndMesh = new THREE.Mesh(smallEndGeom, matSteelForged);
    smallEndMesh.position.set(0, conRodLen, 0);
    this.tagComponent(smallEndMesh, 'connectingRod');
    this.connectingRodGroup.add(smallEndMesh);

    // Big end (encircling crank pin at (0, 0, 0) locally)
    const bigEndGeom = new THREE.CylinderGeometry(24, 24, 22, 24);
    bigEndGeom.rotateX(Math.PI / 2);
    const bigEndMesh = new THREE.Mesh(bigEndGeom, matSteelForged);
    bigEndMesh.position.set(0, 0, 0);
    this.tagComponent(bigEndMesh, 'connectingRod');
    this.connectingRodGroup.add(bigEndMesh);

    // Connecting rod H-beam shank connecting big and small ends
    const shankLength = conRodLen - 30;
    const shankGeom = new THREE.BoxGeometry(10, shankLength, 14);
    const shankMesh = new THREE.Mesh(shankGeom, matSteelForged);
    shankMesh.position.set(0, conRodLen / 2, 0);
    this.tagComponent(shankMesh, 'connectingRod');
    this.connectingRodGroup.add(shankMesh);

    // --- CRANKSHAFT ASSEMBLY ---
    // Crank pin (connecting rod journal) at local (0, crankRadius, 0)
    const crankPinGeom = new THREE.CylinderGeometry(18, 18, 24, 24);
    crankPinGeom.rotateX(Math.PI / 2);
    const crankPinMesh = new THREE.Mesh(crankPinGeom, matPolishedSteel);
    crankPinMesh.position.set(0, crankRadius, 0);
    this.tagComponent(crankPinMesh, 'crankshaft');
    this.crankshaftGroup.add(crankPinMesh);

    // Counterweight webs (paired balanced masses opposite the crank pin)
    [-18, 18].forEach((zPos) => {
      // Counterweight shape: segment opposite crankpin
      const webGeom = new THREE.CylinderGeometry(
        crankRadius * 1.55,
        crankRadius * 1.55,
        12,
        32,
        1,
        false,
        Math.PI * 0.1,
        Math.PI * 0.8
      );
      webGeom.rotateX(Math.PI / 2);
      const webMesh = new THREE.Mesh(webGeom, matSteelForged);
      webMesh.position.set(0, -crankRadius * 0.35, zPos);
      this.tagComponent(webMesh, 'crankshaft');
      this.crankshaftGroup.add(webMesh);

      // Main journal shaft on each side
      const mainJournalGeom = new THREE.CylinderGeometry(21, 21, 25, 24);
      mainJournalGeom.rotateX(Math.PI / 2);
      const mainJournalMesh = new THREE.Mesh(mainJournalGeom, matPolishedSteel);
      mainJournalMesh.position.set(0, 0, zPos > 0 ? zPos + 18 : zPos - 18);
      this.tagComponent(mainJournalMesh, 'crankshaft');
      this.crankshaftGroup.add(mainJournalMesh);
    });

    // Flywheel (mounted on crankshaft output end at Z = 50)
    const flywheelGeom = new THREE.CylinderGeometry(blockOuterRadius * 1.6, blockOuterRadius * 1.6, 16, 48);
    flywheelGeom.rotateX(Math.PI / 2);
    const flywheelMesh = new THREE.Mesh(flywheelGeom, matCastIronDark);
    flywheelMesh.position.set(0, 0, 52);
    this.tagComponent(flywheelMesh, 'flywheel');
    this.crankshaftGroup.add(flywheelMesh); // rotates continuously with crankshaft

    // Crankshaft timing gear (front at Z = -45)
    const crankGearGeom = new THREE.CylinderGeometry(18, 18, 10, 24);
    crankGearGeom.rotateX(Math.PI / 2);
    const crankGearMesh = new THREE.Mesh(crankGearGeom, matBronze);
    crankGearMesh.position.set(0, 0, -45);
    this.tagComponent(crankGearMesh, 'timingGears');
    this.crankshaftGroup.add(crankGearMesh);

    // --- OVERHEAD CAMSHAFT & TIMING SPROCKET ---
    const camY = headY + 36;
    // Camshaft central shaft
    const camShaftGeom = new THREE.CylinderGeometry(11, 11, 100, 24);
    camShaftGeom.rotateX(Math.PI / 2);
    const camShaftMesh = new THREE.Mesh(camShaftGeom, matPolishedSteel);
    camShaftMesh.position.set(0, 0, 0);
    this.tagComponent(camShaftMesh, 'camshaft');
    this.camshaftGroup.add(camShaftMesh);

    // Intake Cam Lobe (egg-shaped cam profile)
    const intakeLobeGeom = new THREE.CylinderGeometry(12, 16, 12, 16);
    intakeLobeGeom.rotateX(Math.PI / 2);
    const intakeLobeMesh = new THREE.Mesh(intakeLobeGeom, matSteelForged);
    intakeLobeMesh.position.set(-18, 5, 0);
    this.tagComponent(intakeLobeMesh, 'camshaft');
    this.camshaftGroup.add(intakeLobeMesh);

    // Exhaust Cam Lobe
    const exhaustLobeGeom = new THREE.CylinderGeometry(12, 16, 12, 16);
    exhaustLobeGeom.rotateX(Math.PI / 2);
    const exhaustLobeMesh = new THREE.Mesh(exhaustLobeGeom, matSteelForged);
    exhaustLobeMesh.position.set(18, -5, 0);
    this.tagComponent(exhaustLobeMesh, 'camshaft');
    this.camshaftGroup.add(exhaustLobeMesh);

    // Cam Timing Gear (Diameter exactly 2x crank gear for 2:1 reduction)
    const camGearGeom = new THREE.CylinderGeometry(36, 36, 10, 36);
    camGearGeom.rotateX(Math.PI / 2);
    const camGearMesh = new THREE.Mesh(camGearGeom, matBronze);
    camGearMesh.position.set(0, 0, -45);
    this.tagComponent(camGearMesh, 'timingGears');
    this.camshaftGroup.add(camGearMesh);

    this.camshaftGroup.position.set(0, camY, 0);

    // Timing belt connecting crank gear to cam gear
    const beltGeom = new THREE.BoxGeometry(4, camY, 8);
    const beltMesh1 = new THREE.Mesh(beltGeom, matBlackRubber);
    beltMesh1.position.set(-27, camY / 2, -45);
    const beltMesh2 = new THREE.Mesh(beltGeom, matBlackRubber);
    beltMesh2.position.set(27, camY / 2, -45);
    this.tagComponent(beltMesh1, 'timingGears');
    this.tagComponent(beltMesh2, 'timingGears');
    this.timingBeltGroup.add(beltMesh1);
    this.timingBeltGroup.add(beltMesh2);

    // --- VALVES (INTAKE & EXHAUST) ---
    // Intake Valve (X = -18 mm)
    const valveStemLen = 58;
    const intakeStemGeom = new THREE.CylinderGeometry(2.8, 2.8, valveStemLen, 16);
    const intakeStemMesh = new THREE.Mesh(intakeStemGeom, matPolishedSteel);
    intakeStemMesh.position.set(0, valveStemLen / 2, 0);

    const intakeHeadGeom = new THREE.ConeGeometry(14, 7, 24);
    const intakeHeadMesh = new THREE.Mesh(intakeHeadGeom, matSteelForged);
    intakeHeadMesh.rotation.x = Math.PI;
    intakeHeadMesh.position.set(0, 0, 0);

    // Valve Spring (helical coil representation)
    const springGeom = new THREE.CylinderGeometry(7.5, 7.5, 34, 16, 12, true);
    const springMeshIntake = new THREE.Mesh(springGeom, matCastIronDark);
    springMeshIntake.position.set(0, valveStemLen * 0.65, 0);
    this.tagComponent(springMeshIntake, 'valveSprings');

    this.intakeValveGroup.add(intakeStemMesh);
    this.intakeValveGroup.add(intakeHeadMesh);
    this.intakeValveGroup.add(springMeshIntake);
    this.tagComponent(intakeStemMesh, 'intakeValve');
    this.tagComponent(intakeHeadMesh, 'intakeValve');

    // Base position of intake valve in cylinder head
    this.intakeValveGroup.position.set(-18, headY - 14, 0);

    // Exhaust Valve (X = +18 mm)
    const exhaustStemMesh = new THREE.Mesh(intakeStemGeom.clone(), matPolishedSteel);
    exhaustStemMesh.position.set(0, valveStemLen / 2, 0);

    const exhaustHeadGeom = new THREE.ConeGeometry(12, 7, 24);
    const exhaustHeadMesh = new THREE.Mesh(exhaustHeadGeom, matSteelForged);
    exhaustHeadMesh.rotation.x = Math.PI;
    exhaustHeadMesh.position.set(0, 0, 0);

    const springMeshExhaust = new THREE.Mesh(springGeom.clone(), matCastIronDark);
    springMeshExhaust.position.set(0, valveStemLen * 0.65, 0);
    this.tagComponent(springMeshExhaust, 'valveSprings');

    this.exhaustValveGroup.add(exhaustStemMesh);
    this.exhaustValveGroup.add(exhaustHeadMesh);
    this.exhaustValveGroup.add(springMeshExhaust);
    this.tagComponent(exhaustStemMesh, 'exhaustValve');
    this.tagComponent(exhaustHeadMesh, 'exhaustValve');

    this.exhaustValveGroup.position.set(18, headY - 14, 0);

    // --- SPARK PLUG ASSEMBLY ---
    // Central threaded body
    const plugBodyGeom = new THREE.CylinderGeometry(7, 7, 22, 16);
    const plugBodyMesh = new THREE.Mesh(plugBodyGeom, matSteelForged);
    plugBodyMesh.position.set(0, headY + 12, 0);
    this.tagComponent(plugBodyMesh, 'sparkPlug');
    this.sparkPlugGroup.add(plugBodyMesh);

    // Ceramic ribbed insulator
    const ceramicGeom = new THREE.CylinderGeometry(5.5, 5.5, 26, 16);
    const ceramicMesh = new THREE.Mesh(ceramicGeom, matCeramicWhite);
    ceramicMesh.position.set(0, headY + 32, 0);
    this.tagComponent(ceramicMesh, 'sparkPlug');
    this.sparkPlugGroup.add(ceramicMesh);

    // Spark plug terminal nut on top
    const terminalGeom = new THREE.CylinderGeometry(3, 3, 8, 12);
    const terminalMesh = new THREE.Mesh(terminalGeom, matBronze);
    terminalMesh.position.set(0, headY + 47, 0);
    this.tagComponent(terminalMesh, 'sparkPlug');
    this.sparkPlugGroup.add(terminalMesh);

    // Electrodes (extending into combustion chamber)
    const electrodeGeom = new THREE.CylinderGeometry(1.2, 1.2, 8, 8);
    const electrodeMesh = new THREE.Mesh(electrodeGeom, matPolishedSteel);
    electrodeMesh.position.set(0, headY - 4, 0);
    this.tagComponent(electrodeMesh, 'sparkPlug');
    this.sparkPlugGroup.add(electrodeMesh);

    // Ground electrode bend
    const groundGeom = new THREE.BoxGeometry(2, 6, 2);
    const groundMesh = new THREE.Mesh(groundGeom, matPolishedSteel);
    groundMesh.position.set(3, headY - 7, 0);
    this.tagComponent(groundMesh, 'sparkPlug');
    this.sparkPlugGroup.add(groundMesh);

    // Attach effects to root group
    this.sparkMesh.position.set(0, headY - 8, 0);
    this.combustionGlow.position.set(0, headY - 14, 0);

    // Assemble root tree
    this.rootGroup.add(this.cylinderBlockGroup);
    this.rootGroup.add(this.cylinderHeadGroup);
    this.rootGroup.add(this.crankshaftGroup);
    this.rootGroup.add(this.connectingRodGroup);
    this.rootGroup.add(this.pistonGroup);
    this.rootGroup.add(this.intakeValveGroup);
    this.rootGroup.add(this.exhaustValveGroup);
    this.rootGroup.add(this.camshaftGroup);
    this.rootGroup.add(this.timingBeltGroup);
    this.rootGroup.add(this.sparkPlugGroup);
    this.rootGroup.add(this.sparkMesh);
    this.rootGroup.add(this.combustionGlow);
    this.rootGroup.add(this.intakeParticles);
    this.rootGroup.add(this.exhaustParticles);
  }

  /**
   * Registers a mesh with a component ID for Raycasting selection and highlighting.
   */
  private tagComponent(mesh: THREE.Mesh, componentId: string): void {
    mesh.userData = {
      componentId,
      info: ENGINE_COMPONENTS[componentId],
    };
    this.originalMaterials.set(mesh, mesh.material);
    this.allSelectableMeshes.push(mesh);

    if (!this.componentMeshes.has(componentId)) {
      this.componentMeshes.set(componentId, []);
    }
    this.componentMeshes.get(componentId)!.push(mesh);
  }

  /**
   * Creates the dynamic spark plug arc discharge effect.
   */
  private createSparkEffect(): THREE.Points {
    const sparkCount = 45;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(sparkCount * 3);

    for (let i = 0; i < sparkCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 3.5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3.5;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x67e8f9,
      size: 3.5,
      transparent: true,
      opacity: 0.0, // hidden when not firing
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geom, mat);
    points.visible = false;
    return points;
  }

  /**
   * Creates the dynamic combustion flame glow inside the cylinder.
   */
  private createCombustionEffect(): THREE.Mesh {
    const geom = new THREE.SphereGeometry(this.geometry.bore * 0.44, 24, 24);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.visible = false;
    return mesh;
  }

  /**
   * Creates fresh air-fuel intake stream particles.
   */
  private createIntakeParticles(): THREE.Points {
    const count = 60;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = -40 + Math.random() * 25;
      positions[i * 3 + 1] = 120 + Math.random() * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 2.2,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Points(geom, mat);
  }

  /**
   * Creates burnt exhaust gas smoke particles.
   */
  private createExhaustParticles(): THREE.Points {
    const count = 60;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = 15 + Math.random() * 30;
      positions[i * 3 + 1] = 120 + Math.random() * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 2.5,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Points(geom, mat);
  }

  /**
   * Synchronizes 3D engine components with the calculated physical state.
   */
  public update(state: FullEngineState): void {
    const { kinematics, cycle, valves } = state;
    const conRodLen = this.geometry.conRodLength;
    const headY = (conRodLen + this.geometry.stroke / 2) + 25;

    // 1. Crankshaft Rotation around Z axis
    // Crank rotates clockwise in standard view (-thetaRad)
    this.crankshaftGroup.rotation.z = -kinematics.thetaRad;

    // 2. Connecting Rod Kinematics
    // Crank pin position in mm
    const crankPinX = kinematics.crankPinX * 1000;
    const crankPinY = kinematics.crankPinY * 1000;

    // Connecting rod big end is at crank pin
    this.connectingRodGroup.position.set(crankPinX, crankPinY, 0);
    // Connecting rod angle phi from vertical
    this.connectingRodGroup.rotation.z = kinematics.rodAngleRad;

    // 3. Piston Motion
    // Constrained to vertical Y axis at X=0, Z=0
    const pistonPinY = kinematics.pistonPinY * 1000;
    this.pistonGroup.position.set(0, pistonPinY, 0);

    // 4. Valves Lift Actuation
    // Valves move downward when opening into cylinder
    const intakeBaseY = headY - 14;
    const exhaustBaseY = headY - 14;
    this.intakeValveGroup.position.y = intakeBaseY - valves.intakeLift;
    this.exhaustValveGroup.position.y = exhaustBaseY - valves.exhaustLift;

    // 5. Camshaft Synchronization
    // Camshaft rotates at half crankshaft speed: theta / 2
    this.camshaftGroup.rotation.z = -(kinematics.thetaRad / 2);

    // 6. Visual Effects Updates
    // A) Spark Plug Firing
    if (cycle.isSparkActive) {
      this.sparkMesh.visible = true;
      (this.sparkMesh.material as THREE.PointsMaterial).opacity =
        0.5 + 0.5 * cycle.sparkIntensity;
      // Slight jitter in spark discharge
      this.sparkMesh.rotation.z += 0.2;
    } else {
      this.sparkMesh.visible = false;
      (this.sparkMesh.material as THREE.PointsMaterial).opacity = 0;
    }

    // B) Combustion Flame Kernel
    if (cycle.combustionIntensity > 0.02) {
      this.combustionGlow.visible = true;
      const mat = this.combustionGlow.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.min(0.85, cycle.combustionIntensity * 0.9);
      // Flame expands to fill chamber down to current piston crown
      const chamberHeight = Math.max(10, headY - 10 - (pistonPinY + 20));
      this.combustionGlow.scale.set(1.0, chamberHeight / 25, 1.0);
      this.combustionGlow.position.y = headY - 14 - (chamberHeight * 0.4);
    } else {
      this.combustionGlow.visible = false;
    }

    // C) Intake Particles (active during intake when intake valve is open)
    const intakeMat = this.intakeParticles.material as THREE.PointsMaterial;
    if (valves.isIntakeOpen) {
      intakeMat.opacity = Math.min(0.85, valves.intakeNormalized);
      // Flow particles toward intake valve
      const pos = this.intakeParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3] += 0.8; // move right toward port
        pos[i * 3 + 1] -= 0.6; // move down into head
        if (pos[i * 3] > -15) {
          pos[i * 3] = -40;
          pos[i * 3 + 1] = 120 + Math.random() * 25;
        }
      }
      this.intakeParticles.geometry.attributes.position.needsUpdate = true;
    } else {
      intakeMat.opacity = 0;
    }

    // D) Exhaust Particles (active during exhaust stroke when exhaust valve is open)
    const exhaustMat = this.exhaustParticles.material as THREE.PointsMaterial;
    if (valves.isExhaustOpen) {
      exhaustMat.opacity = Math.min(0.85, valves.exhaustNormalized);
      const pos = this.exhaustParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3] += 0.8; // move right out of runner
        pos[i * 3 + 1] += 0.5; // move up
        if (pos[i * 3] > 48) {
          pos[i * 3] = 16;
          pos[i * 3 + 1] = 120;
        }
      }
      this.exhaustParticles.geometry.attributes.position.needsUpdate = true;
    } else {
      exhaustMat.opacity = 0;
    }

    // 7. Exploded View Offsets Application
    this.applyExplodedOffsets();
  }

  /**
   * Sets the exploded-view factor from 0.0 (assembled) to 1.0 (fully exploded).
   */
  public setExplodedFactor(factor: number): void {
    this.explodedFactor = Math.max(0, Math.min(1, factor));
    this.applyExplodedOffsets();
  }

  public getExplodedFactor(): number {
    return this.explodedFactor;
  }

  /**
   * Applies spatial offsets to each major component according to its assembly axis.
   */
  private applyExplodedOffsets(): void {
    const f = this.explodedFactor;

    // Cylinder head moves up (+Y)
    this.cylinderHeadGroup.position.set(0, f * 55, 0);

    // Spark plug moves further up (+Y)
    this.sparkPlugGroup.position.set(0, f * 95, 0);

    // Camshaft moves further up (+Y)
    const camY = (this.geometry.conRodLength + this.geometry.stroke / 2) + 25 + 36;
    this.camshaftGroup.position.set(0, camY + f * 110, 0);

    // Cylinder block moves sideways (+X)
    this.cylinderBlockGroup.position.set(f * 60, 0, 0);

    // Timing belt moves forward (-Z)
    this.timingBeltGroup.position.set(0, 0, -f * 35);
  }

  /**
   * Toggles or sets transparent cutaway mode for external casing.
   */
  public setTransparentMode(transparent: boolean, alpha = 0.35): void {
    this.isTransparent = transparent;
    this.transparencyAlpha = alpha;

    const blockMeshes = this.componentMeshes.get('cylinderBlock') || [];
    const linerMeshes = this.componentMeshes.get('cylinderLiner') || [];
    const headMeshes = this.componentMeshes.get('cylinderHead') || [];

    [...blockMeshes, ...linerMeshes, ...headMeshes].forEach((obj) => {
      if (obj instanceof THREE.Mesh) {
        if (transparent) {
          obj.material = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            roughness: 0.1,
            metalness: 0.1,
            transparent: true,
            opacity: alpha,
            depthWrite: false,
          });
        } else {
          const orig = this.originalMaterials.get(obj);
          if (orig) obj.material = orig;
        }
      }
    });
  }

  /**
   * Highlights a specific component with emissive cyan glow.
   */
  public highlightComponent(componentId: string | null): void {
    // Restore all meshes
    this.allSelectableMeshes.forEach((mesh) => {
      if (this.isolatedComponentId && mesh.userData.componentId !== this.isolatedComponentId) {
        mesh.visible = false;
      } else {
        mesh.visible = true;
        const orig = this.originalMaterials.get(mesh);
        if (orig && !this.isTransparent) {
          mesh.material = orig;
        }
      }
    });

    if (!componentId) return;

    // Apply highlight material to targeted meshes
    const targets = this.componentMeshes.get(componentId);
    if (targets) {
      targets.forEach((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.visible = true;
          obj.material = this.highlightMaterial;
        }
      });
    }
  }

  /**
   * Isolates a component, hiding all other components. Pass null to reset.
   */
  public isolateComponent(componentId: string | null): void {
    this.isolatedComponentId = componentId;
    if (!componentId) {
      this.allSelectableMeshes.forEach((mesh) => {
        mesh.visible = true;
      });
      this.highlightComponent(null);
      return;
    }

    this.allSelectableMeshes.forEach((mesh) => {
      mesh.visible = mesh.userData.componentId === componentId;
    });
  }

  /**
   * Cleans up all geometries, materials, and textures for clean memory disposal.
   */
  public dispose(): void {
    this.rootGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
        if (obj.geometry) obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else if (obj.material) {
          obj.material.dispose();
        }
      }
    });
    this.highlightMaterial.dispose();
  }
}

