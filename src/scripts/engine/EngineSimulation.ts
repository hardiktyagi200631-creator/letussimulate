/**
 * EngineSimulation.ts
 * Time-based simulation runner executing continuous crankshaft motion and notifying subscribers.
 */

import { EnginePhysicsEngine, type FullEngineState } from './EnginePhysics';
import { DEFAULT_RPM, MIN_RPM, MAX_RPM } from './EngineConstants';

export type SimulationListener = (state: FullEngineState) => void;

export class EngineSimulation {
  public physics: EnginePhysicsEngine;
  private currentCrankAngleDeg = 0;
  private targetRpm: number = DEFAULT_RPM;
  private isPlaying = true;
  private speedMultiplier = 0.1; // Default to 0.1x slow-motion for smooth human visualization of strokes
  private listeners: Set<SimulationListener> = new Set();
  private lastTimestamp = 0;
  private animationFrameId: number | null = null;

  constructor(physics?: EnginePhysicsEngine, initialRpm = DEFAULT_RPM) {
    this.physics = physics || new EnginePhysicsEngine();
    this.targetRpm = Math.max(MIN_RPM, Math.min(MAX_RPM, initialRpm));
  }

  public subscribe(listener: SimulationListener): () => void {
    this.listeners.add(listener);
    // Immediately emit current state
    listener(this.getCurrentState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getCurrentAngle(): number {
    return this.currentCrankAngleDeg;
  }

  public setAngle(deg: number): void {
    this.currentCrankAngleDeg = ((deg % 720) + 720) % 720;
    this.notify();
  }

  public getRpm(): number {
    return this.targetRpm;
  }

  public setRpm(rpm: number): void {
    this.targetRpm = Math.max(MIN_RPM, Math.min(MAX_RPM, rpm));
    this.notify();
  }

  public getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }

  public setSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = Math.max(0.01, Math.min(10, multiplier));
  }

  public isRunning(): boolean {
    return this.isPlaying;
  }

  public play(): void {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.lastTimestamp = performance.now();
    }
  }

  public pause(): void {
    this.isPlaying = false;
  }

  public togglePlay(): boolean {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
    return this.isPlaying;
  }

  public reset(): void {
    this.currentCrankAngleDeg = 0;
    this.notify();
  }

  /**
   * Advances the engine by a discrete degree step (e.g. 5° or 10°).
   */
  public step(stepDeg = 5): void {
    this.pause();
    this.setAngle(this.currentCrankAngleDeg + stepDeg);
  }

  /**
   * Advances simulation by delta time in seconds.
   */
  public tick(dtSeconds: number): void {
    if (!this.isPlaying || dtSeconds <= 0) return;

    // Crank angle change: dTheta (deg) = 6 * RPM * dt * multiplier
    const deltaDeg = 6 * this.targetRpm * dtSeconds * this.speedMultiplier;
    this.currentCrankAngleDeg = (this.currentCrankAngleDeg + deltaDeg) % 720;
    this.notify();
  }

  public getCurrentState(): FullEngineState {
    return this.physics.evaluate(this.currentCrankAngleDeg, this.targetRpm);
  }

  private notify(): void {
    const state = this.getCurrentState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('Error in simulation listener:', err);
      }
    });
  }
}

