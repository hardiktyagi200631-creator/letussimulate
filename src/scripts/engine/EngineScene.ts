/**
 * EngineScene.ts
 * Manages the Three.js WebGL canvas, lighting, camera views, OrbitControls,
 * Raycaster component interaction, and the render loop.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EngineModel } from './EngineModel';
import { EngineSimulation } from './EngineSimulation';
import type { FullEngineState } from './EnginePhysics';

export interface SceneOptions {
  container: HTMLElement;
  simulation: EngineSimulation;
  onComponentSelected?: (componentId: string | null) => void;
  onStateUpdate?: (state: FullEngineState) => void;
}

export class EngineScene {
  private container: HTMLElement;
  private simulation: EngineSimulation;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  public model: EngineModel;

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private isPointerDown = false;
  private pointerDownTime = 0;

  private onComponentSelected?: (componentId: string | null) => void;
  private onStateUpdate?: (state: FullEngineState) => void;
  private animationFrameId: number | null = null;
  private lastTime = 0;
  private isDestroyed = false;

  // Camera presets
  private readonly cameraPositions = {
    isometric: new THREE.Vector3(180, 140, 240),
    front: new THREE.Vector3(0, 100, 320),
    side: new THREE.Vector3(320, 100, 0),
    top: new THREE.Vector3(0, 360, 20),
  };
  private readonly cameraTarget = new THREE.Vector3(0, 85, 0);

  constructor(options: SceneOptions) {
    this.container = options.container;
    this.simulation = options.simulation;
    this.onComponentSelected = options.onComponentSelected;
    this.onStateUpdate = options.onStateUpdate;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090d16); // Clean dark engineering lab backdrop

    // Subtle technical grid
    const gridHelper = new THREE.GridHelper(400, 20, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -60;
    this.scene.add(gridHelper);

    // 2. Camera setup
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 550;
    this.camera = new THREE.PerspectiveCamera(42, width / height, 1, 2000);
    this.camera.position.copy(this.cameraPositions.isometric);
    this.camera.lookAt(this.cameraTarget);

    // 3. Renderer setup with resilient fallback
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      this.renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: 'default',
      });
    }
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.copy(this.cameraTarget);
    this.controls.minDistance = 60;
    this.controls.maxDistance = 800;
    this.controls.maxPolarAngle = Math.PI * 0.85;

    // 5. Lighting
    this.setupLighting();

    // 6. Build Engine Model
    this.model = new EngineModel(this.simulation.physics.getGeometry());
    this.scene.add(this.model.rootGroup);

    // 7. Raycaster for selection
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // 8. Event listeners
    this.setupEventListeners();

    // 9. Start animation loop
    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  private setupLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    // Hemisphere light (sky/ground contrast for metallic surfaces)
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.8);
    hemiLight.position.set(0, 300, 0);
    this.scene.add(hemiLight);

    // Main key light (angled from front-top-right)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(200, 250, 200);
    this.scene.add(keyLight);

    // Fill light (softer from opposite side)
    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.6);
    fillLight.position.set(-200, 150, -100);
    this.scene.add(fillLight);

    // Rim light from behind for silhouette definition
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    rimLight.position.set(0, -100, -250);
    this.scene.add(rimLight);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onResize);
    if (typeof ResizeObserver !== 'undefined' && this.container) {
      const ro = new ResizeObserver(() => this.onResize());
      ro.observe(this.container);
    }

    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointerup', this.onPointerUp);
  }

  private onResize = (): void => {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 550;
    if (width > 0 && height > 0) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  };

  private onPointerDown = (): void => {
    this.isPointerDown = true;
    this.pointerDownTime = performance.now();
  };

  private onPointerUp = (event: PointerEvent): void => {
    // Check if it was a quick click rather than a camera drag
    const elapsed = performance.now() - this.pointerDownTime;
    if (elapsed < 250) {
      this.handleRaycast(event);
    }
    this.isPointerDown = false;
  };

  private handleRaycast(event: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.model.allSelectableMeshes, false);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object as THREE.Mesh;
      const componentId = hitMesh.userData?.componentId || null;
      this.model.highlightComponent(componentId);
      if (this.onComponentSelected) {
        this.onComponentSelected(componentId);
      }
    } else {
      this.model.highlightComponent(null);
      if (this.onComponentSelected) {
        this.onComponentSelected(null);
      }
    }
  }

  /**
   * Smoothly changes camera view to a preset angle.
   */
  public setCameraView(view: 'isometric' | 'front' | 'side' | 'top' | 'reset'): void {
    const targetPos =
      view === 'reset' ? this.cameraPositions.isometric : this.cameraPositions[view];

    this.camera.position.copy(targetPos);
    this.controls.target.copy(this.cameraTarget);
    this.controls.update();
  }

  private animate(timestamp: number): void {
    if (this.isDestroyed) return;

    this.animationFrameId = requestAnimationFrame(this.animate);

    const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    // Advance physics simulation
    this.simulation.tick(dt);
    const state = this.simulation.getCurrentState();

    // Synchronize 3D model with physical calculations
    this.model.update(state);

    // Notify external listeners (parameters panel, charts, stroke display)
    if (this.onStateUpdate) {
      this.onStateUpdate(state);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointerup', this.onPointerUp);

    this.model.dispose();
    this.renderer.dispose();
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  }
}

